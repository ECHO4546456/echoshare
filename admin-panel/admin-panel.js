(function(){
  const commands=['/help','/users','/online','/user','/history','/ban','/unban','/kick','/delete','/clear','/say','/announce','/effect','/effects','/glow','/bans','/history-bans','/annoy all','/status','/whois','/find'];
  const $=id=>document.getElementById(id);
  const pinModal=$('adminPinModal'), panel=$('adminPanelModal'), pinInput=$('adminPinInput'), pinStatus=$('adminPinStatus'), input=$('adminCommandInput'), output=$('adminOutput'), suggestions=$('adminSuggestions'), usersList=$('adminUsersList'), selected=$('adminSelectedUser'), mediaInput=$('adminAnnoyFile'), mediaName=$('adminMediaName');
  let history=[], historyIndex=-1, selectedUser='', allUsers=[];
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function write(line,kind=''){const div=document.createElement('div');div.className='admin-output-line '+kind;div.textContent=line;output?.appendChild(div);if(output)output.scrollTop=output.scrollHeight;}
  function showPin(){if(!pinModal)return;pinModal.hidden=false;pinInput.value='';pinStatus.textContent='';setTimeout(()=>pinInput.focus(),30);}
  function hidePin(){if(pinModal)pinModal.hidden=true;}
  function showPanel(){if(panel)panel.hidden=false;renderUsers(allUsers);setTimeout(()=>input?.focus(),30);}
  function hidePanel(){if(panel)panel.hidden=true;}
  function sendPin(){const pin=pinInput.value.trim(); if(!pin)return; window.EchoAdminAPI?.unlock(pin);}
  function sendCommand(command){if(!command)return;history.push(command);history=history.slice(-40);historyIndex=history.length; window.EchoAdminAPI?.command(command);}
  function renderSuggestions(){
    if(!suggestions||!input)return; const value=input.value.trim(); if(!value){suggestions.hidden=true;return;}
    const lower=value.toLowerCase(); const commandQuery=lower.startsWith('/')?lower:'/'+lower; let matches=commands.filter(c=>c.startsWith(commandQuery));
    if(value.startsWith('/ban ')||value.startsWith('/kick ')||value.startsWith('/user ')||value.startsWith('/history ')||value.startsWith('/unban ')){
      const q=value.split(/\s+/).slice(1).join(' ').toLowerCase(); matches=allUsers.map(u=>u.username).filter(n=>!q||n.toLowerCase().startsWith(q)).slice(0,8).map(n=>value.split(/\s+/)[0]+' '+n);
    }
    suggestions.innerHTML=matches.slice(0,8).map(x=>`<button type="button" data-suggest="${esc(x)}">${esc(x)}</button>`).join(''); suggestions.hidden=!matches.length;
    suggestions.querySelectorAll('[data-suggest]').forEach(b=>b.onclick=()=>{input.value=b.dataset.suggest+' ';suggestions.hidden=true;input.focus();});
  }
  function renderUsers(users){
    allUsers=Array.isArray(users)?users:[]; if(!usersList)return;
    const q=($('adminUserSearch')?.value||'').toLowerCase();
    usersList.innerHTML=allUsers.filter(u=>u.username.toLowerCase().includes(q)).map(u=>`<button class="admin-user ${u.username===selectedUser?'selected':''}" data-user="${esc(u.username)}"><span class="admin-user-dot"></span><img src="${esc(u.avatar||'pngs/LadyLosi.png')}"><span><b>${esc(u.username)}</b><small>${esc(u.role||'MEMBER')}</small></span></button>`).join('')||'<div class="admin-empty">NO USERS FOUND</div>';
    usersList.querySelectorAll('[data-user]').forEach(b=>b.onclick=()=>{selectedUser=b.dataset.user;selected.textContent='TARGET // '+selectedUser;input.value='/user '+selectedUser;renderUsers(allUsers);});
  }
  window.EchoAdminPanel={
    open:showPin, close:()=>{hidePin();hidePanel()},
    pinResult(ok,msg){pinStatus.textContent=msg||'';pinStatus.className='admin-pin-status '+(ok?'good':'bad');if(!ok)pinInput.select();},
    unlockSuccess(profile){hidePin();showPanel();if(profile){selectedUser=profile.username||'';selected.textContent='TARGET // '+(selectedUser||'SELF');}write('ADMIN CONSOLE UNLOCKED.','ok'); window.EchoAdminAPI?.command('/users');},
    commandResult(r){
      if(r.users){renderUsers(r.users);write(`LOADED ${r.users.length} USERS.`,'ok');return;}
      if(r.profile){write(`USER: ${r.profile.username} | ${r.profile.role} | ${r.profile.access}`,'ok');write(`BIO: ${r.profile.bio||'—'}`);return;}
      if(r.history){write(`HISTORY: ${r.history.length} MESSAGES.`,'ok');r.history.slice(-20).forEach(m=>write(`[${new Date(m.time).toLocaleTimeString()}] ${m.username}: ${m.text||'[MEDIA]'}`));return;}
      if(r.lines){r.lines.forEach(x=>write(x));return;}
      if(r.effects){write('EFFECTS: '+r.effects.join(' • '),'ok');return;}
      if(r.bans){write('ACTIVE BANS: '+(r.bans.length?r.bans.map(b=>`${b.username} (${Math.max(0,Math.ceil((b.expiresAt-Date.now())/3600000))}h)`).join(' • '):'NONE'),'ok');return;}
      if(r.banHistory){write('BAN HISTORY:', 'ok');r.banHistory.slice(0,30).forEach(b=>{const line=document.createElement('div');line.className='admin-ban-history-row';const label=document.createElement('span');label.textContent=`${b.username} ${b.unbannedAt?'UNBANNED':'BANNED'} ${new Date(b.bannedAt||b.unbannedAt).toLocaleString()}`;line.appendChild(label);if(!b.unbannedAt){const btn=document.createElement('button');btn.textContent='UNBAN';btn.onclick=()=>sendCommand('/unban '+b.username);line.appendChild(btn);}output?.appendChild(line);});if(output)output.scrollTop=output.scrollHeight;return;}
      write(r.message||'COMMAND COMPLETE.',r.ok===false?'bad':'ok');
    },
    setUsers:renderUsers
  };
  $('adminPinSubmit')?.addEventListener('click',sendPin); $('adminPinClose')?.addEventListener('click',hidePin); pinInput?.addEventListener('keydown',e=>{if(e.key==='Enter')sendPin();if(e.key==='Escape')hidePin();});
  $('adminPanelClose')?.addEventListener('click',hidePanel);
  $('adminUserSearch')?.addEventListener('input',()=>renderUsers(allUsers));
  $('adminCommandSend')?.addEventListener('click',()=>{sendCommand(input.value.trim());input.value='';suggestions.hidden=true;});
  input?.addEventListener('input',renderSuggestions);
  input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();sendCommand(input.value.trim());input.value='';suggestions.hidden=true;}else if(e.key==='ArrowUp'){e.preventDefault();if(history.length){historyIndex=Math.max(0,historyIndex-1);input.value=history[historyIndex]||'';}}else if(e.key==='ArrowDown'){e.preventDefault();historyIndex=Math.min(history.length,historyIndex+1);input.value=history[historyIndex]||'';}else if(e.key==='Tab'){e.preventDefault();const first=suggestions?.querySelector('[data-suggest]');if(first){input.value=first.dataset.suggest;suggestions.hidden=true;}}});
  $('adminAnnoyButton')?.addEventListener('click',()=>mediaInput?.click());
  mediaInput?.addEventListener('change',()=>{const f=mediaInput.files?.[0];if(!f)return;mediaName.textContent=f.name;const reader=new FileReader();reader.onload=()=>{const data=reader.result;const type=f.type.startsWith('video/')?'video':'audio';if(!confirm(`Are you sure you want to activate this media for everyone?\n\n${f.name}`))return;window.EchoAdminAPI?.annoyAll({data,type,name:f.name});};reader.readAsDataURL(f);mediaInput.value='';});
  document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='p'){e.preventDefault();if(panel&&!panel.hidden){hidePanel();return;}showPin();}});
})();
