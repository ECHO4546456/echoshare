const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB = path.join(ROOT, 'chat90-data.json');
const NORMAL_PASSWORD = process.env.CHAT90_PASSWORD || '56789';
const SPECIAL_PASSWORD = process.env.CHAT90_SPECIAL_PASSWORD || '9!GAG';
const MALFUNCTION_PASSWORD = process.env.CHAT90_MALFUNCTION_PASSWORD || 'Ink';

let state = { profiles: {}, messages: [], banned: [], friends: {}, dms: {} };
try { state = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch (_) {}
state.profiles ||= {}; state.messages ||= []; state.banned ||= []; state.friends ||= {}; state.dms ||= {};
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
  return { username:p.username, avatar:p.avatar, bio:p.bio, role:p.role, glow:p.glow, badge:p.badge, banner:p.banner||'', chatBackground:p.chatBackground||'', effect:p.effect, tags:p.tags || [], malfunctionTools:p.malfunctionTools||{}, access:p.access||'normal', joined:p.joined };
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
  let u = requestPath;
  if (u === '/') u='/index.html';
  const file = path.normalize(path.join(ROOT,u));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  fs.readFile(file,(err,data)=>{
    if(err) return res.writeHead(404).end('Not found');
    const ext=path.extname(file); const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.mp3':'audio/mpeg'};
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
  const sid=id(); sessions.set(sid,{ws,username:null,special:false}); clients.set(ws,sid);
  send(ws,{type:'hello',sessionId:sid,history:state.messages.slice(-250),online:onlineProfiles()});
  ws.on('message',(raw)=>{
    let m; try { m=JSON.parse(raw); } catch (_) { return; }
    const s=sessions.get(sid); if(!s) return;
    if(m.type==='auth') {
      const pass=String(m.password||'');
      if(pass!==NORMAL_PASSWORD && pass!==SPECIAL_PASSWORD && pass!==MALFUNCTION_PASSWORD) return send(ws,{type:'authResult',ok:false,message:'ACCESS DENIED — INVALID PASSWORD.'});
      s.special=pass===SPECIAL_PASSWORD; s.malfunction=pass===MALFUNCTION_PASSWORD; return send(ws,{type:'authResult',ok:true,special:s.special,malfunction:s.malfunction});
    }
    if(m.type==='profile') {
      if(!s.special && !s.malfunction && (m.access==='special'||m.access==='malfunction')) return send(ws,{type:'error',message:'Elevated access cannot be self-assigned.'});
      const username=clean(m.username,24); if(!username) return;
      if(state.banned.includes(username.toLowerCase())) return send(ws,{type:'kicked',message:'This username is blocked from CHAT_90.'});
      const old=s.username;
      const profile={username,avatar:clean(m.avatar,500)||'https://cdn.pfps.gg/pfps/3651-dark-purple-anime.png',bio:clean(m.bio,160),tags:Array.isArray(m.tags)?m.tags.map(x=>clean(x,24)).filter(Boolean).slice(0,12):[],access:s.malfunction?'malfunction':s.special?'special':'normal',role:s.malfunction?'MALFUNCTION':s.special?'SPECIAL / ADMIN':'MEMBER',glow:(s.special||s.malfunction)?clean(m.glow,30)||'#ff2d2d':'#39ff88',badge:clean(m.badge,500),banner:cleanMedia(m.banner,4200000),chatBackground:cleanMedia(m.chatBackground,4200000),effect:(s.special||s.malfunction)?(s.malfunction?(clean(m.effect,80)==='angelic-praise'?'angelic-praise':clean(m.effect,80)||'you-and-i-forever'):(['you-and-i-forever','angelic-praise'].includes(clean(m.effect,80))?'red-pulse':clean(m.effect,80)||'red-pulse')):'normal',malfunctionTools:s.malfunction&&m.malfunctionTools&&typeof m.malfunctionTools==='object'?Object.fromEntries(Object.entries(m.malfunctionTools).slice(0,34).map(([k,v])=>[clean(k,40),!!v])):{},joined:old && state.profiles[old] ? state.profiles[old].joined : new Date().toISOString()};
      if(old && old!==username){
        delete state.profiles[old];
        for(const msg of state.messages) if(msg.username===old) msg.username=username;
      }
      state.profiles[username]=profile; s.username=username; save();
      // Profile changes propagate to every existing message immediately, so old messages update too.
      for(const msg of state.messages){ if(msg.username===username){ Object.assign(msg,{avatar:profile.avatar,bio:profile.bio,role:profile.role,glow:profile.glow,badge:profile.badge,banner:profile.banner,chatBackground:profile.chatBackground,effect:profile.effect,malfunctionTools:profile.malfunctionTools||{}}); } }
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
      const msg={id:id(),time:new Date().toISOString(),username:p.username,avatar:p.avatar,role:p.role,glow:p.glow,badge:p.badge,banner:p.banner||'',chatBackground:p.chatBackground||'',effect:p.effect,malfunctionTools:p.malfunctionTools||{},text:clean(m.text,500),image:clean(m.image,800),gif:clean(m.gif,800),media:cleanMedia(m.media,11000000),mediaType:['image','gif','video'].includes(m.mediaType)?m.mediaType:'' ,replyTo:m.replyTo?{id:clean(m.replyTo.id,80),username:clean(m.replyTo.username,24),text:clean(m.replyTo.text,500)}:null,reactions:[]};
      if(!msg.text&&!msg.image&&!msg.gif&&!msg.media) return;
      state.messages.push(msg); state.messages=state.messages.slice(-500); save(); broadcast({type:'message',message:msg}); send(ws,{type:'message',message:msg}); return;
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
    if(m.type==='delete') {
      if(!s.special && !s.malfunction) return; state.messages=state.messages.filter(x=>x.id!==m.id); save(); broadcast({type:'deleted',id:m.id}); send(ws,{type:'deleted',id:m.id}); return;
    }
    if(m.type==='kick') {
      if(!s.special && !s.malfunction) return; const target=clean(m.username,24); state.banned.push(target.toLowerCase()); save();
      for(const [id2,ss] of sessions) if(ss.username===target){ send(ss.ws,{type:'kicked',message:'You were removed from CHAT_90 by an administrator.'}); ss.ws.close(); }
      broadcast({type:'presence',online:onlineProfiles()}); return;
    }

    if(m.type==='malfunctionBroadcast') {
      if(!s.malfunction) return;
      const media=cleanMedia(m.media,22000000); const mediaType=['image','video'].includes(m.mediaType)?m.mediaType:'';
      if(!media || !mediaType) return;
      broadcast({type:'malfunctionBroadcast',username:s.username,media,mediaType,name:clean(m.name,120),time:new Date().toISOString()});
      return;
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
  ws.on('close',()=>{ const s=sessions.get(sid); sessions.delete(sid); clients.delete(ws); if(s&&s.username){ const msg={id:id(),time:new Date().toISOString(),bot:true,username:'ECHO BOT',avatar:'https://cdn.pfps.gg/pfps/3651-dark-purple-anime.png',role:'SYSTEM',glow:'#9b9b9b',text:`${s.username} has left Chat_90.`}; state.messages.push(msg); state.messages=state.messages.slice(-500); save(); broadcast({type:'message',message:msg}); } broadcast({type:'presence',online:onlineProfiles()}); });
});
server.listen(PORT, '0.0.0.0', ()=>console.log(`ECHO//SHARE CHAT_90 server running on port ${PORT}`));
