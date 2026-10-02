const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB = path.join(ROOT, 'chat90-data.json');
const NORMAL_PASSWORD = process.env.CHAT90_PASSWORD || '56789';
const ADMIN_PIN = process.env.CHAT90_ADMIN_PIN || '7879';
const BAN_MS = 4 * 24 * 60 * 60 * 1000;

let state = { profiles: {}, messages: [], banned: {}, banHistory: [], friends: {}, dms: {} };
try { state = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch (_) {}
state.profiles ||= {};
state.messages ||= [];
state.friends ||= {};
state.dms ||= {};
if (Array.isArray(state.banned)) {
  const migrated = {};
  for (const name of state.banned) migrated[String(name).toLowerCase()] = { username: String(name), bannedAt: Date.now(), expiresAt: Date.now() + BAN_MS };
  state.banned = migrated;
} else state.banned ||= {};
state.banHistory ||= [];

const clients = new Map();
const sessions = new Map();
function save() { try { fs.writeFileSync(DB, JSON.stringify(state, null, 2)); } catch (_) {} }
function id() { return crypto.randomUUID(); }
function clean(s, n) { return String(s ?? '').trim().slice(0, n); }
function cleanMedia(s, max) { const v = String(s ?? '').trim(); return v.length <= max ? v : ''; }
function broadcast(packet, except) {
  const data = JSON.stringify(packet);
  for (const [ws] of clients) if (ws !== except && ws.readyState === WebSocket.OPEN) ws.send(data);
}
function send(ws, packet) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(packet)); }
function purgeExpiredBans() {
  const now = Date.now(); let changed = false;
  for (const key of Object.keys(state.banned)) if (Number(state.banned[key]?.expiresAt || 0) <= now) { delete state.banned[key]; changed = true; }
  if (changed) save();
}
function isBanned(username) {
  purgeExpiredBans();
  const b = state.banned[String(username).toLowerCase()];
  return !!b && b.expiresAt > Date.now();
}
function publicProfile(p) {
  return { username:p.username, avatar:p.avatar, bio:p.bio, role:p.role, glow:p.glow, badge:p.badge, chatBackground:p.chatBackground||'', effect:p.effect||'normal', tags:p.tags||[], access:p.access||'normal', admin:!!p.admin, joined:p.joined };
}
function onlineProfiles() {
  const seen = new Set(); const out = [];
  for (const s of sessions.values()) if (s.username && !seen.has(s.username) && state.profiles[s.username]) { seen.add(s.username); out.push(publicProfile(state.profiles[s.username])); }
  return out;
}
function findProfile(name) {
  const q = clean(name, 24).toLowerCase();
  return Object.values(state.profiles).find(p => p.username.toLowerCase() === q);
}
function makeBot(text, glow='#9b9b9b') {
  return { id:id(), time:new Date().toISOString(), bot:true, username:'ECHO BOT', avatar:'pngs/LadyLosi.png', role:'SYSTEM', glow, text };
}
function makeAdminMessage(s, text) {
  const p = state.profiles[s.username];
  return { id:id(), time:new Date().toISOString(), username:p?.username||'ADMIN', avatar:p?.avatar||'pngs/LadyLosi.png', role:'ADMIN', glow:'#ff3030', badge:p?.badge||'', effect:'admin-core', chatBackground:p?.chatBackground||'', text:clean(text,500), reactions:[] };
}
function addMessage(msg) { state.messages.push(msg); state.messages = state.messages.slice(-500); save(); }

const server = http.createServer((req,res)=>{
  const requestPath = decodeURIComponent(req.url.split('?')[0]);
  if (requestPath === '/health') { res.writeHead(200, {'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}); return res.end(JSON.stringify({ok:true,service:'CHAT_90'})); }
  if (requestPath === '/api/gifs') {
    const dir=path.join(ROOT,'gifs_emojis','gifs_emojis');
    let files=[]; try { files=fs.readdirSync(dir).filter(name=>/\.(gif|webp|png|jpe?g)$/i.test(name)).sort((a,b)=>a.localeCompare(b)); } catch(_) {}
    res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});
    return res.end(JSON.stringify(files.map(name=>({name:name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' '),url:'/gifs_emojis/gifs_emojis/'+encodeURIComponent(name)}))));
  }
  let u = requestPath; if (u === '/') u='/index.html';
  const file = path.normalize(path.join(ROOT,u));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  fs.readFile(file,(err,data)=>{
    if(err) return res.writeHead(404).end('Not found');
    const ext=path.extname(file).toLowerCase();
    const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.mp4':'video/mp4','.webm':'video/webm','.svg':'image/svg+xml'};
    res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':'no-cache'}); res.end(data);
  });
});

const wss = new WebSocket.Server({ server, path:'/chat90' });
setInterval(()=>{ purgeExpiredBans(); for(const ws of clients.keys()) if(ws.readyState===WebSocket.OPEN) { try{ws.ping()}catch(_){} } },30000).unref();

wss.on('connection',(ws)=>{
  const sid=id(); sessions.set(sid,{ws,username:null,admin:false}); clients.set(ws,sid);
  send(ws,{type:'hello',sessionId:sid,history:state.messages.slice(-250),online:onlineProfiles()});

  ws.on('message',(raw)=>{
    let m; try { m=JSON.parse(raw); } catch (_) { return; }
    const s=sessions.get(sid); if(!s) return;

    if(m.type==='auth') {
      const pass=String(m.password||'');
      if(pass!==NORMAL_PASSWORD) return send(ws,{type:'authResult',ok:false,message:'ACCESS DENIED — INVALID MEMBER PASSWORD.'});
      s.authenticated=true; s.admin=false;
      return send(ws,{type:'authResult',ok:true,admin:false});
    }

    if(m.type==='adminAuth') {
      if(!s.authenticated || String(m.pin||'')!==ADMIN_PIN) return send(ws,{type:'adminAuthResult',ok:false,message:'INVALID ADMIN PIN.'});
      s.admin=true;
      if(s.username && state.profiles[s.username]) {
        const p=state.profiles[s.username]; p.admin=true; p.access='admin'; p.role='ADMIN'; p.glow='#ff3030'; p.effect='admin-core';
        for(const msg of state.messages) if(msg.username===s.username) Object.assign(msg,{role:'ADMIN',glow:'#ff3030',effect:'admin-core',avatar:p.avatar,badge:p.badge,chatBackground:p.chatBackground});
        save(); broadcast({type:'profileUpdated',profile:publicProfile(p),previousUsername:s.username});
      }
      return send(ws,{type:'adminAuthResult',ok:true,profile:s.username?publicProfile(state.profiles[s.username]):null});
    }

    if(m.type==='profile') {
      if(!s.authenticated) return;
      const username=clean(m.username,24); if(!username) return;
      if(isBanned(username) && !s.admin) return send(ws,{type:'kicked',message:'This username is banned from CHAT_90 for 4 days.'});
      const old=s.username;
      const profile={
        username,
        // Uploaded avatars/badges are compressed in the browser, but keep enough
        // room for a real data URL so the image is not silently truncated.
        avatar:cleanMedia(m.avatar,900000)||'pngs/LadyLosi.png',
        bio:clean(m.bio,160),
        tags:Array.isArray(m.tags)?m.tags.map(x=>clean(x,24)).filter(Boolean).slice(0,12):[],
        access:s.admin?'admin':'normal', role:s.admin?'ADMIN':'MEMBER', admin:!!s.admin,
        glow:s.admin?'#ff3030':'#39ff88', badge:cleanMedia(m.badge,600000),
        chatBackground:cleanMedia(m.chatBackground,4200000), effect:s.admin?(clean(m.effect,80)||'admin-core'):clean(m.effect,80)||'normal',
        joined:old && state.profiles[old] ? state.profiles[old].joined : new Date().toISOString()
      };
      if(old && old!==username){ delete state.profiles[old]; for(const msg of state.messages) if(msg.username===old) msg.username=username; }
      state.profiles[username]=profile; s.username=username;
      for(const msg of state.messages) if(msg.username===username) Object.assign(msg,{avatar:profile.avatar,bio:profile.bio,role:profile.role,glow:profile.glow,badge:profile.badge,chatBackground:profile.chatBackground,effect:profile.effect});
      save(); send(ws,{type:'profileSaved',profile:publicProfile(profile)}); broadcast({type:'profileUpdated',profile:publicProfile(profile),previousUsername:old||null});
      if(!old){ const msg=makeBot(`New guy named ${username} has joined Chat_90.`); addMessage(msg); broadcast({type:'message',message:msg}); }
      broadcast({type:'presence',online:onlineProfiles()}); return;
    }

    if(m.type==='message') {
      if(!s.authenticated || !s.username || !state.profiles[s.username]) return;
      const p=state.profiles[s.username];
      const msg={id:id(),time:new Date().toISOString(),username:p.username,avatar:p.avatar,role:p.role,glow:p.glow,badge:p.badge,chatBackground:p.chatBackground||'',effect:p.effect||'normal',admin:!!p.admin,text:clean(m.text,500),image:clean(m.image,800),gif:clean(m.gif,800),media:cleanMedia(m.media,11000000),mediaType:['image','gif','video'].includes(m.mediaType)?m.mediaType:'',replyTo:m.replyTo?{id:clean(m.replyTo.id,80),username:clean(m.replyTo.username,24),text:clean(m.replyTo.text,500)}:null,reactions:[]};
      if(!msg.text&&!msg.image&&!msg.gif&&!msg.media) return;
      addMessage(msg);
      const nonBot=state.messages.filter(x=>!x.bot);
      if(nonBot.length>10){
        const removeIds=new Set(nonBot.slice(0,6).map(x=>x.id));
        state.messages=state.messages.filter(x=>!removeIds.has(x.id));
        const cleanup=makeBot('Cleaned up 6 Messages <3'); state.messages.push(cleanup); save();
        broadcast({type:'historySync',history:state.messages.slice(-250),removed:[...removeIds],cleanupMessage:cleanup});
        return;
      }
      broadcast({type:'message',message:msg}); return;
    }

    if(m.type==='reaction') {
      if(!s.authenticated || !s.username) return;
      const target=state.messages.find(x=>x.id===clean(m.messageId,80)); if(!target||!m.url)return;
      const url=cleanMedia(m.url,5600000); if(!url.startsWith('data:image/'))return;
      target.reactions=Array.isArray(target.reactions)?target.reactions:[]; target.reactions=target.reactions.filter(r=>r.username!==s.username); target.reactions.push({username:s.username,url}); target.reactions=target.reactions.slice(-20); save(); broadcast({type:'reaction',messageId:target.id,reactions:target.reactions}); return;
    }

    if(m.type==='adminCommand') {
      if(!s.admin) return send(ws,{type:'adminCommandResult',ok:false,message:'ADMIN PANEL LOCKED.'});
      const raw=clean(m.command,500); const parts=raw.replace(/^\//,'').trim().split(/\s+/); const cmd=(parts.shift()||'').toLowerCase(); const arg=parts.join(' ').trim();
      const result={ok:true,command:raw};
      if(cmd==='help') result.lines=['/help','/users','/online','/user <name>','/history <name>','/ban <name>','/unban <name>','/kick <name>','/delete <message id>','/clear','/say <message>','/announce <message>','/effect <effect>','/effects','/glow <color>','/bans','/history-bans'];
      else if(cmd==='users') result.users=Object.values(state.profiles).map(publicProfile);
      else if(cmd==='online') result.users=onlineProfiles();
      else if(cmd==='user') { const p=findProfile(arg); result.profile=p?publicProfile(p):null; result.message=p?'USER FOUND.':'USER NOT FOUND.'; }
      else if(cmd==='history') { const p=findProfile(arg); result.history=p?state.messages.filter(x=>x.username===p.username).slice(-100):[]; result.message=p?'HISTORY LOADED.':'USER NOT FOUND.'; }
      else if(cmd==='ban') { const p=findProfile(arg); if(!p) result={ok:false,message:'USER NOT FOUND.'}; else { const now=Date.now(); state.banned[p.username.toLowerCase()]={username:p.username,bannedAt:now,expiresAt:now+BAN_MS}; state.banHistory.push({username:p.username,bannedAt:now,expiresAt:now+BAN_MS,by:s.username}); save(); for(const ss of sessions.values()) if(ss.username===p.username){send(ss.ws,{type:'kicked',message:'You are banned from CHAT_90 for 4 days.'}); try{ss.ws.close()}catch(_){}} broadcast({type:'presence',online:onlineProfiles()}); result.message=`${p.username} BANNED FOR 4 DAYS.`;} }
      else if(cmd==='unban') { const key=arg.toLowerCase(); if(!state.banned[key]) result={ok:false,message:'ACTIVE BAN NOT FOUND.'}; else { delete state.banned[key]; state.banHistory.push({username:arg,unbannedAt:Date.now(),by:s.username}); save(); result.message=`${arg} UNBANNED.`; } }
      else if(cmd==='kick') { const p=findProfile(arg); if(!p) result={ok:false,message:'USER NOT FOUND.'}; else { for(const ss of sessions.values()) if(ss.username===p.username){send(ss.ws,{type:'kicked',message:'You were kicked from CHAT_90.'}); try{ss.ws.close()}catch(_){}} result.message=`${p.username} KICKED.`; } }
      else if(cmd==='delete') { const before=state.messages.length; state.messages=state.messages.filter(x=>x.id!==arg); save(); broadcast({type:'historySync',history:state.messages.slice(-250),removed:[]}); result.message=state.messages.length<before?'MESSAGE DELETED.':'MESSAGE ID NOT FOUND.'; }
      else if(cmd==='clear') { state.messages=state.messages.filter(x=>x.bot); const msg=makeBot('ADMIN cleared the non-system CHAT_90 history.'); state.messages.push(msg); save(); broadcast({type:'historySync',history:state.messages.slice(-250),removed:[]}); result.message='CHAT HISTORY CLEARED.'; }
      else if(cmd==='say') { const msg=makeAdminMessage(s,arg); if(msg.text){addMessage(msg);broadcast({type:'message',message:msg});result.message='ADMIN MESSAGE SENT.';}else result={ok:false,message:'MESSAGE IS EMPTY.'}; }
      else if(cmd==='announce') { const msg=makeBot(arg,'#ff4dff'); msg.role='ANNOUNCEMENT'; addMessage(msg); broadcast({type:'message',message:msg}); result.message='ANNOUNCEMENT SENT.'; }
      else if(cmd==='effect') { const p=state.profiles[s.username]; p.effect=clean(arg,80)||'admin-core'; for(const msg of state.messages) if(msg.username===s.username) msg.effect=p.effect; save(); broadcast({type:'profileUpdated',profile:publicProfile(p),previousUsername:s.username}); result.message=`ADMIN EFFECT: ${p.effect}`; }
      else if(cmd==='effects') result.effects=['admin-core','prism','void-rift','star-mid','crimson-flare','blood-glitch','red-lightning','nightmare','singularity','hologram'];
      else if(cmd==='glow') { const color=clean(arg,30); if(!/^#[0-9a-f]{3,8}$/i.test(color)) result={ok:false,message:'USE A HEX COLOR LIKE #FF3030.'}; else { const p=state.profiles[s.username]; p.glow=color; for(const msg of state.messages) if(msg.username===s.username) msg.glow=color; save(); broadcast({type:'profileUpdated',profile:publicProfile(p),previousUsername:s.username}); result.message=`ADMIN GLOW SET TO ${color}`; } }
      else if(cmd==='bans') result.bans=Object.values(state.banned);
      else if(cmd==='history-bans') result.banHistory=state.banHistory.slice(-100).reverse();
      else result={ok:false,message:`UNKNOWN COMMAND: ${cmd||'(empty)'}`};
      return send(ws,{type:'adminCommandResult',...result});
    }

    if(m.type==='annoyAll') {
      if(!s.admin) return;
      const media=cleanMedia(m.media,22000000); const mediaType=['audio','video'].includes(m.mediaType)?m.mediaType:'';
      if(!media||!mediaType)return;
      broadcast({type:'annoyAll',username:s.username,media,mediaType,name:clean(m.name,120),time:new Date().toISOString()}); return;
    }

    if(m.type==='friendToggle') { if(!s.username)return; const target=clean(m.username,24); if(!state.profiles[target]||target===s.username)return; state.friends[s.username] ||= []; const list=state.friends[s.username]; const idx=list.indexOf(target); if(idx>=0)list.splice(idx,1);else list.push(target); save(); send(ws,{type:'friends',friends:list}); const ts=[...sessions.values()].find(x=>x.username===target); if(ts)send(ts.ws,{type:'friendNotice',username:s.username,added:idx<0}); return; }
    if(m.type==='getFriends') { if(s.username)send(ws,{type:'friends',friends:state.friends[s.username]||[]}); return; }
    if(m.type==='dmSend') { if(!s.username)return; const target=clean(m.to,24),text=clean(m.text,500); if(!target||!text||!state.profiles[target])return; const key=[s.username,target].sort().join('|||'); state.dms[key] ||= []; const dm={id:id(),time:new Date().toISOString(),from:s.username,to:target,text}; state.dms[key].push(dm); state.dms[key]=state.dms[key].slice(-200); save(); const packet={type:'dm',message:dm}; send(ws,packet); const ts=[...sessions.values()].find(x=>x.username===target); if(ts)send(ts.ws,packet); return; }
    if(m.type==='dmHistory') { if(s.username){ const target=clean(m.with,24); const key=[s.username,target].sort().join('|||'); send(ws,{type:'dmHistory',with:target,messages:state.dms[key]||[]}); } return; }
    if(m.type==='requestProfile') { const p=findProfile(m.username); if(p)send(ws,{type:'profile',profile:publicProfile(p)}); return; }
  });

  ws.on('close',()=>{
    const s=sessions.get(sid); sessions.delete(sid); clients.delete(ws);
    if(s&&s.username){ const msg=makeBot(`${s.username} has left Chat_90.`); addMessage(msg); broadcast({type:'message',message:msg}); }
    broadcast({type:'presence',online:onlineProfiles()});
  });
});

server.listen(PORT,'0.0.0.0',()=>console.log(`ECHO//SHARE CHAT_90 server running on port ${PORT}`));
