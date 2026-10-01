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

let state = { profiles: {}, messages: [], banned: {}, friends: {}, dms: {} };
try { state = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch (_) {}
state.profiles ||= {}; state.messages ||= []; state.friends ||= {}; state.dms ||= {}; state.muted ||= {};
if (Array.isArray(state.banned)) { const legacy={}; state.banned.forEach(u=>legacy[String(u).toLowerCase()] = 0); state.banned=legacy; }
state.banned ||= {};
const EFFECTS = new Set(["normal","red-pulse","neon-surge","rainbow-edge","chromatic-glitch","crimson-flare","blood-moon","void-rift","electric-red","ghost-trail","pixel-tear","starfall","toxic-glow","golden-crown","black-hole","hologram","scarlet-rain","terminal-scan","apex-aura"]);
function isBanned(username){ const k=String(username||'').toLowerCase(); const until=Number(state.banned[k]||0); if(until && until>Date.now()) return true; if(until && until<=Date.now()){ delete state.banned[k]; save(); } return false; }
function banUser(username,durationMs){ const k=String(username||'').trim().toLowerCase(); if(!k)return; state.banned[k]=Date.now()+durationMs; save(); }
function unbanUser(username){ delete state.banned[String(username||'').trim().toLowerCase()]; save(); }
function adminMessage(text){ return {id:id(),time:new Date().toISOString(),bot:true,username:'CHAT_90 ADMIN',avatar:'pngs/LadyLosi.png',role:'ADMIN SYSTEM',glow:'#ff2d2d',effect:'red-pulse',text}; }
const clients = new Map();
const sessions = new Map();

function save() { fs.writeFileSync(DB, JSON.stringify(state, null, 2)); }
function id() { return crypto.randomUUID(); }
function clean(s, n) { return String(s ?? '').trim().slice(0, n); }
function cleanMedia(s, max) { const v=String(s??'').trim(); return v.length<=max?v:''; }
function broadcast(packet, except) {
  const data = JSON.stringify(packet);
  for (const [ws] of clients) if (ws !== except && ws.readyState === WebSocket.OPEN) ws.send(data);
}
function publicProfile(p) {
  return { username:p.username, avatar:p.avatar, bio:p.bio, role:p.role, glow:p.glow, badge:p.badge, chatBackground:p.chatBackground||'', effect:p.effect, tags:p.tags || [], malfunctionTools:p.malfunctionTools||{}, access:p.access||'normal', joined:p.joined };
}
function onlineProfiles() {
  const seen = new Set(); const out=[];
  for (const s of sessions.values()) if (!seen.has(s.username) && state.profiles[s.username]) { seen.add(s.username); out.push(publicProfile(state.profiles[s.username])); }
  return out;
}
function send(ws, packet) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(packet)); }

const server = http.createServer((req,res)=>{
  const requestPath = decodeURIComponent(req.url.split('?')[0]);
  if (requestPath === '/health') {
    res.writeHead(200, {'Content-Type':'application/json','Cache-Control':'no-store'});
    return res.end(JSON.stringify({ok:true,service:'CHAT_90'}));
  }
  if (requestPath === '/api/gifs') {
    const dir=path.join(ROOT,'gifs_emojis','gifs_emojis');
    let files=[]; try { files=fs.readdirSync(dir).filter(name=>/\.(gif|webp|png|jpe?g)$/i.test(name)).sort((a,b)=>a.localeCompare(b)); } catch(_) {}
    res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});
    return res.end(JSON.stringify(files.map(name=>({name:name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' '),url:'/gifs_emojis/gifs_emojis/'+encodeURIComponent(name)}))));
  }
  let u = requestPath;
  if (u === '/') u='/index.html';
  const file = path.normalize(path.join(ROOT,u));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  fs.readFile(file,(err,data)=>{
    if(err) return res.writeHead(404).end('Not found');
    const ext=path.extname(file); const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.webm':'video/webm','.mp4':'video/mp4'};
    res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':'no-cache'}); res.end(data);
  });
});

const wss = new WebSocket.Server({ server, path:'/chat90' });
const pingTimer = setInterval(()=>{
  for (const ws of clients.keys()) {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.ping(); } catch (_) {}
    }
  }
}, 30000);
pingTimer.unref();
wss.on('connection',(ws)=>{
  const sid=id(); sessions.set(sid,{ws,username:null,admin:false}); clients.set(ws,sid);
  send(ws,{type:'hello',sessionId:sid,history:state.messages.slice(-250),online:onlineProfiles()});
  ws.on('message',(raw)=>{
    let m; try { m=JSON.parse(raw); } catch (_) { return; }
    const s=sessions.get(sid); if(!s) return;
    if(m.type==='auth') {
      const pass=String(m.password||'');
      if(pass!==NORMAL_PASSWORD) return send(ws,{type:'authResult',ok:false,message:'ACCESS DENIED — INVALID PASSWORD.'});
      s.admin=false; return send(ws,{type:'authResult',ok:true});
    }
    if(m.type==='profile') {
      
      const username=clean(m.username,24); if(!username) return;
      if(isBanned(username)) return send(ws,{type:'kicked',message:'This username is banned from CHAT_90.'});
      const old=s.username;
      const profile={username,avatar:clean(m.avatar,500)||'pngs/LadyLosi.png',bio:clean(m.bio,160),tags:Array.isArray(m.tags)?m.tags.map(x=>clean(x,24)).filter(Boolean).slice(0,12):[],access:s.admin?'admin':'normal',role:s.admin?'ADMIN':'MEMBER',glow:s.admin?'#ff2d2d':'#39ff88',badge:clean(m.badge,500),chatBackground:cleanMedia(m.chatBackground,4200000),effect:EFFECTS.has(clean(m.effect,80))?clean(m.effect,80):'normal',malfunctionTools:{},joined:old && state.profiles[old] ? state.profiles[old].joined : new Date().toISOString()};
      if(old && old!==username){
        delete state.profiles[old];
        for(const msg of state.messages) if(msg.username===old) msg.username=username;
      }
      state.profiles[username]=profile; s.username=username; save();
      // Profile changes propagate to every existing message immediately, so old messages update too.
      for(const msg of state.messages){ if(msg.username===username){ Object.assign(msg,{avatar:profile.avatar,bio:profile.bio,role:profile.role,glow:profile.glow,badge:profile.badge,chatBackground:profile.chatBackground,effect:profile.effect,malfunctionTools:profile.malfunctionTools||{}}); } }
      save();
      send(ws,{type:'profileSaved',profile:publicProfile(profile)});
      broadcast({type:'profileUpdated',profile:publicProfile(profile),previousUsername:old||null});
      if(!old) { const msg={id:id(),time:new Date().toISOString(),bot:true,username:'ECHO BOT',avatar:profile.avatar,role:'SYSTEM',glow:'#9b9b9b',text:`New guy named ${username} has joined Chat_90.`}; state.messages.push(msg); state.messages=state.messages.slice(-500); save(); broadcast({type:'message',message:msg}); }
      broadcast({type:'presence',online:onlineProfiles()});
      return;
    }
    if(m.type==='message') {
      if(!s.username || !state.profiles[s.username]) return;
      const p=state.profiles[s.username];
      state.muted ||= {}; const muteUntil=Number(state.muted[String(s.username).toLowerCase()]||0); if(muteUntil>Date.now()) return send(ws,{type:'error',message:`YOU ARE MUTED FOR ${Math.ceil((muteUntil-Date.now())/60000)} MORE MINUTE(S).`}); if(muteUntil) { delete state.muted[String(s.username).toLowerCase()]; save(); }
      const msg={id:id(),time:new Date().toISOString(),username:p.username,avatar:p.avatar,role:p.role,glow:p.glow,badge:p.badge,chatBackground:p.chatBackground||'',effect:p.effect,malfunctionTools:p.malfunctionTools||{},text:clean(m.text,500),image:clean(m.image,800),gif:clean(m.gif,800),media:cleanMedia(m.media,11000000),mediaType:['image','gif','video'].includes(m.mediaType)?m.mediaType:'' ,replyTo:m.replyTo?{id:clean(m.replyTo.id,80),username:clean(m.replyTo.username,24),text:clean(m.replyTo.text,500)}:null,reactions:[]};
      if(!msg.text&&!msg.image&&!msg.gif&&!msg.media) return;
      state.messages.push(msg);
      const userMessageCount=state.messages.filter(x=>!x.bot).length;
      if(userMessageCount>10){
        const removed=state.messages.splice(0,Math.min(6,state.messages.length));
        const cleanup={id:id(),time:new Date().toISOString(),bot:true,username:'ECHO BOT',avatar:'pngs/LadyLosi.png',role:'SYSTEM',glow:'#9b9b9b',text:'Cleaned up 6 Messages <3'};
        state.messages.push(cleanup);
        state.messages=state.messages.slice(-500);
        save();
        broadcast({type:'historySync',history:state.messages.slice(-250),removed:removed.map(x=>x.id).filter(Boolean),cleanupMessage:cleanup});
        return;
      }
      state.messages=state.messages.slice(-500); save(); broadcast({type:'message',message:msg}); send(ws,{type:'message',message:msg}); return;
    }
    if(m.type==='reaction') {
      if(!s.username || !state.profiles[s.username]) return;
      const target=state.messages.find(x=>x.id===clean(m.messageId,80));
      if(!target || !m.url) return;
      const url=cleanMedia(m.url,5600000); if(!url.startsWith('data:image/gif') && !url.startsWith('data:image/')) return;
      target.reactions=Array.isArray(target.reactions)?target.reactions:[];
      target.reactions=target.reactions.filter(r=>r.username!==s.username);
      target.reactions.push({username:s.username,url}); target.reactions=target.reactions.slice(-20); save();
      broadcast({type:'reaction',messageId:target.id,reactions:target.reactions}); send(ws,{type:'reaction',messageId:target.id,reactions:target.reactions}); return;
    }
    if(m.type==='adminAuth') {
      if(String(m.pin||'')!==ADMIN_PIN) return send(ws,{type:'adminAuthResult',ok:false,message:'PIN REJECTED — ACCESS DENIED.'});
      s.admin=true;
      if(s.username && state.profiles[s.username]) {
        const p=state.profiles[s.username]; p.access='admin'; p.role='ADMIN'; p.glow='#ff2d2d'; p.effect=EFFECTS.has(p.effect)&&p.effect!=='normal'?p.effect:'red-pulse';
        for(const msg of state.messages) if(msg.username===s.username) Object.assign(msg,{role:'ADMIN',glow:'#ff2d2d',effect:p.effect,access:'admin'});
        save(); broadcast({type:'profileUpdated',profile:publicProfile(p),previousUsername:s.username});
      }
      send(ws,{type:'adminAuthResult',ok:true,profile:s.username&&state.profiles[s.username]?publicProfile(state.profiles[s.username]):null});
      broadcast({type:'presence',online:onlineProfiles()});
      return;
    }
    if(m.type==='adminCommand') {
      if(!s.admin) return send(ws,{type:'adminResult',ok:false,message:'ADMIN SESSION REQUIRED.'});
      const cmd=clean(m.command,40).toLowerCase(); const args=Array.isArray(m.args)?m.args.map(x=>clean(x,300)):[];
      if(cmd==='help') return send(ws,{type:'adminResult',ok:true,command:'help',message:'COMMANDS: /help /users /bans /ban <user> [4d|1h|30m] /unban <user> /history <user> /clear /announce <text> /effect <name> /effect all <name> /effects /glow <#hex> /kick <user> /whois <user> /find <user> /status /mute <user> [minutes] /unmute <user> /delete <messageId>'});
      if(cmd==='bans'){const bans=Object.entries(state.banned).filter(([,until])=>Number(until)>Date.now()).map(([username,until])=>({username,until}));return send(ws,{type:'adminResult',ok:true,command:'bans',bans,message:`${bans.length} ACTIVE BAN(S).`});}
      if(cmd==='users') return send(ws,{type:'adminResult',ok:true,command:'users',users:onlineProfiles(),message:`${onlineProfiles().length} ACTIVE USER(S).`});
      if(cmd==='history'){const target=args[0];const history=state.messages.filter(x=>!target||String(x.username).toLowerCase()===String(target).toLowerCase()).slice(-50);return send(ws,{type:'adminResult',ok:true,command:'history',history,message:`${history.length} HISTORY ENTRY(S).`});}
      if(cmd==='status') return send(ws,{type:'adminResult',ok:true,command:'status',message:`${onlineProfiles().length} ONLINE • ${state.messages.length} STORED MESSAGES • ${Object.keys(state.banned).length} BAN RECORD(S).`});
      if(cmd==='find'){const target=args[0];const p=Object.values(state.profiles).find(x=>x.username.toLowerCase()===String(target||'').toLowerCase());return send(ws,{type:'adminResult',ok:!!p,command:'find',profile:p||null,message:p?`ACCOUNT EXISTS • ${p.username}`:'ACCOUNT NOT FOUND.'});}
      if(cmd==='whois'){const target=args[0];const p=Object.values(state.profiles).find(x=>x.username.toLowerCase()===String(target||'').toLowerCase());return send(ws,{type:'adminResult',ok:!!p,profile:p||null,message:p?`${p.username} • ${p.role} • ${p.joined}`:'USER NOT FOUND.'});}
      if(cmd==='ban'||cmd==='kick'){const target=args[0];if(!target)return send(ws,{type:'adminResult',ok:false,message:'USAGE: /ban <username> [duration]'});const raw=args[1]||'4d';const match=raw.match(/^(\d+)(m|h|d)$/i);const ms=match?Number(match[1])*({m:60000,h:3600000,d:86400000}[match[2].toLowerCase()]):4*86400000;banUser(target,ms);for(const ss of sessions.values())if(ss.username===target){send(ss.ws,{type:'kicked',message:`BANNED FROM CHAT_90 FOR ${raw.toUpperCase()}.`});try{ss.ws.close();}catch(_){}}broadcast({type:'presence',online:onlineProfiles()});return send(ws,{type:'adminResult',ok:true,message:`${target} BANNED FROM CHAT_90 FOR ${raw.toUpperCase()}.`});}
      if(cmd==='unban'){const target=args[0];if(!target)return send(ws,{type:'adminResult',ok:false,message:'USAGE: /unban <username>'});unbanUser(target);return send(ws,{type:'adminResult',ok:true,message:`${target} UNBANNED.`});}
      if(cmd==='clear'){state.messages=[];save();broadcast({type:'historySync',history:[]});return send(ws,{type:'adminResult',ok:true,message:'CHAT HISTORY CLEARED.'});}
      if(cmd==='delete'){const target=args[0];state.messages=state.messages.filter(x=>x.id!==target);save();broadcast({type:'deleted',id:target});return send(ws,{type:'adminResult',ok:true,message:'MESSAGE DELETED.'});}
      if(cmd==='announce'){const text=args.join(' ');if(!text)return send(ws,{type:'adminResult',ok:false,message:'USAGE: /announce <message>'});const msg=adminMessage(text);state.messages.push(msg);state.messages=state.messages.slice(-500);save();broadcast({type:'message',message:msg});return send(ws,{type:'adminResult',ok:true,message:'ANNOUNCEMENT SENT.'});}
      if(cmd==='effect'){let target='me',effect=args[0];if(args[0]==='all'){target='all';effect=args[1];}if(!effect||!EFFECTS.has(effect))return send(ws,{type:'adminResult',ok:false,message:'UNKNOWN EFFECT. USE /effects TO LIST AVAILABLE EFFECTS.'});if(target==='all'){state.messages=state.messages.map(x=>({...x,effect}));save();broadcast({type:'historySync',history:state.messages.slice(-250)});}else if(s.username&&state.profiles[s.username]){state.profiles[s.username].effect=effect;for(const msg of state.messages)if(msg.username===s.username)msg.effect=effect;save();broadcast({type:'profileUpdated',profile:publicProfile(state.profiles[s.username]),previousUsername:s.username});}return send(ws,{type:'adminResult',ok:true,message:`EFFECT ${effect.toUpperCase()} APPLIED ${target==='all'?'GLOBALLY':'TO ADMIN SESSION'}.`});}
      if(cmd==='glow'){const color=args[0]||'#ff2d2d';if(!/^#[0-9a-f]{6}$/i.test(color))return send(ws,{type:'adminResult',ok:false,message:'USE A HEX COLOR LIKE #ff2d2d.'});if(s.username&&state.profiles[s.username]){state.profiles[s.username].glow=color;for(const msg of state.messages)if(msg.username===s.username)msg.glow=color;save();broadcast({type:'profileUpdated',profile:publicProfile(state.profiles[s.username]),previousUsername:s.username});}return send(ws,{type:'adminResult',ok:true,message:`ADMIN GLOW SET TO ${color}.`});}
      if(cmd==='mute'||cmd==='unmute'){const target=args[0];if(!target)return send(ws,{type:'adminResult',ok:false,message:`USAGE: /${cmd} <username>${cmd==='mute'?' [minutes]':''}`});if(cmd==='mute'){const minutes=Math.max(1,Number(args[1]||10));state.muted[target.toLowerCase()]=Date.now()+minutes*60000;}else delete state.muted[target.toLowerCase()];save();broadcast({type:'adminNotice',message:cmd==='mute'?`${target} is muted.`:`${target} is unmuted.`});return send(ws,{type:'adminResult',ok:true,message:cmd==='mute'?`${target} MUTED.`:`${target} UNMUTED.`});}
      if(cmd==='effects')return send(ws,{type:'adminResult',ok:true,command:'effects',message:Array.from(EFFECTS).join(' • ')});
      return send(ws,{type:'adminResult',ok:false,message:`UNKNOWN COMMAND: /${cmd}. TRY /help.`});
    }
    if(m.type==='adminBroadcast'){
      if(!s.admin)return;
      const media=cleanMedia(m.media,24000000);const mediaType=['audio','video'].includes(m.mediaType)?m.mediaType:'';if(!media||!mediaType)return;
      broadcast({type:'adminBroadcast',media,mediaType,name:clean(m.name,120)});return;
    }

    if(m.type==='friendToggle') {
      if(!s.username) return;
      const target=clean(m.username,24);
      if(!state.profiles[target] || target===s.username) return;
      state.friends[s.username] ||= [];
      const list=state.friends[s.username];
      const idx=list.indexOf(target);
      if(idx>=0) list.splice(idx,1); else list.push(target);
      save();
      send(ws,{type:'friends',friends:list});
      const targetSession=[...sessions.values()].find(x=>x.username===target);
      if(targetSession) send(targetSession.ws,{type:'friendNotice',username:s.username,added:idx<0});
      return;
    }
    if(m.type==='getFriends') {
      if(!s.username) return;
      send(ws,{type:'friends',friends:state.friends[s.username]||[]});
      return;
    }
    if(m.type==='dmSend') {
      if(!s.username) return;
      const target=clean(m.to,24), text=clean(m.text,500);
      if(!target || !text || !state.profiles[target]) return;
      const key=[s.username,target].sort().join('|||');
      state.dms[key] ||= [];
      const dm={id:id(),time:new Date().toISOString(),from:s.username,to:target,text};
      state.dms[key].push(dm); state.dms[key]=state.dms[key].slice(-200); save();
      const packet={type:'dm',message:dm};
      send(ws,packet);
      const targetSession=[...sessions.values()].find(x=>x.username===target);
      if(targetSession) send(targetSession.ws,packet);
      return;
    }
    if(m.type==='dmHistory') {
      if(!s.username) return;
      const target=clean(m.with,24);
      const key=[s.username,target].sort().join('|||');
      send(ws,{type:'dmHistory',with:target,messages:state.dms[key]||[]});
      return;
    }
    if(m.type==='requestProfile') {
      const p=state.profiles[clean(m.username,24)]; if(p) send(ws,{type:'profile',profile:publicProfile(p)}); return;
    }
  });
  ws.on('close',()=>{ const s=sessions.get(sid); sessions.delete(sid); clients.delete(ws); if(s&&s.username){ const msg={id:id(),time:new Date().toISOString(),bot:true,username:'ECHO BOT',avatar:'pngs/LadyLosi.png',role:'SYSTEM',glow:'#9b9b9b',text:`${s.username} has left Chat_90.`}; state.messages.push(msg); state.messages=state.messages.slice(-500); save(); broadcast({type:'message',message:msg}); } broadcast({type:'presence',online:onlineProfiles()}); });
});
server.listen(PORT, '0.0.0.0', ()=>console.log(`ECHO//SHARE CHAT_90 server running on port ${PORT}`));
