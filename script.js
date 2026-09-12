const searchInput = document.getElementById("profileSearch");
const searchButton = document.getElementById("searchButton");
const searchMessage = document.getElementById("searchMessage");

const homePage = document.getElementById("homePage");
const profilePage = document.getElementById("profilePage");

const loadingScreen = document.getElementById("loadingScreen");
const loadingBar = document.getElementById("loadingBar");
const loadingTitle = document.getElementById("loadingTitle");
const loadingText = document.getElementById("loadingText");

const backButton = document.getElementById("backButton");

let loadingTimer = null;

/* ---------------------------
   BACKGROUND NOISE
   --------------------------- */

const backgroundNoise = document.getElementById("backgroundNoise");
let backgroundNoiseStarted = false;

function startBackgroundNoise() {
    if (!backgroundNoise || backgroundNoiseStarted) return;

    backgroundNoise.volume = 0.05;
    backgroundNoise.loop = true;

    const playPromise = backgroundNoise.play();

    if (playPromise && typeof playPromise.catch === "function") {
        playPromise.then(() => {
            backgroundNoiseStarted = true;
        }).catch(error => {
            console.warn("Background noise could not play:", error);
        });
    } else {
        backgroundNoiseStarted = true;
    }
}

document.addEventListener("pointerdown", startBackgroundNoise, { once: true });
document.addEventListener("keydown", startBackgroundNoise, { once: true });

/* ---------------------------
   ONE-TIME LOADING SOUND
   --------------------------- */

function playLoadingSound() {
    /*
        No external sound file is required.
        This creates a short futuristic scan/chime and plays it ONCE
        each time a profile search begins.
    */
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.18);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.16, now + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);

        osc.addEventListener("ended", () => {
            ctx.close().catch(() => {});
        });
    } catch (error) {
        console.warn("Loading sound could not play:", error);
    }
}

/* ---------------------------
   SEARCH
   --------------------------- */

function findProfile(query) {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return null;

    const profiles = Object.values(ECHO_PROFILES);

    return profiles.find(profile =>
        profile.name.toLowerCase() === normalized ||
        profile.id.toLowerCase() === normalized
    );
}

function startSearch(query) {
    const normalized = query.trim().toLowerCase();
    searchMessage.textContent = "";

    if (normalized === "chat_90") {
        openChatAuth();
        return;
    }

    const profile = findProfile(query);

    if (!profile) {
        searchMessage.textContent =
            `No record found for "${query.trim()}". Check the name and try again.`;
        return;
    }

    playLoadingSound();
    showLoading(profile);
}

function showLoading(profile) {
    clearInterval(loadingTimer);

    loadingScreen.classList.add("active");
    loadingScreen.setAttribute("aria-hidden", "false");

    loadingTitle.textContent = `ACCESSING ${profile.name.toUpperCase()}`;
    loadingText.textContent = "Searching archive...";
    loadingBar.style.width = "0%";

    const stages = [
        { percent: 22, text: "Locating record..." },
        { percent: 47, text: "Decrypting profile..." },
        { percent: 71, text: "Building documentation..." },
        { percent: 91, text: "Synchronizing archive..." },
        { percent: 100, text: "Record ready." }
    ];

    let index = 0;

    loadingTimer = setInterval(() => {
        const stage = stages[index];

        if (!stage) {
            clearInterval(loadingTimer);

            setTimeout(() => {
                openProfile(profile);
            }, 280);

            return;
        }

        loadingBar.style.width = `${stage.percent}%`;
        loadingText.textContent = stage.text;

        index++;
    }, 350);
}

/* ---------------------------
   PROFILE PAGE
   --------------------------- */

function openProfile(profile) {
    clearInterval(loadingTimer);

        /* PROFILE THEME */
    profilePage.classList.remove(
        "red-profile",
        "blue-profile",
        "purple-profile",
        "green-profile"
    );
if (profile.theme === "red") {
    profilePage.classList.add("red-profile");
}

if (profile.theme === "purple") {
    profilePage.classList.add("purple-profile");
}

    document.getElementById("profileImage").src = profile.image;
    document.getElementById("profileImage").alt = profile.name;

    document.getElementById("profileName").textContent = profile.name;
    document.getElementById("profilePath").textContent = profile.name.toUpperCase();
    document.getElementById("profileTagline").textContent = profile.tagline;

    document.getElementById("profileReaders").textContent = profile.readers;
    document.getElementById("profileSupport").textContent = profile.support;
    document.getElementById("profileStatus").textContent = profile.status;

    document.getElementById("profileBirthDate").textContent = profile.birthDate;
    document.getElementById("profileJoined").textContent = profile.joined;
    document.getElementById("profileId").textContent = profile.id;

    document.getElementById("articleTitle").textContent = profile.articleTitle;

    renderTags(profile.tags || profile.Authors || []);
    renderArticle(profile.article);

    loadingScreen.classList.remove("active");
    loadingScreen.setAttribute("aria-hidden", "true");

    homePage.hidden = true;
    profilePage.hidden = false;

    window.scrollTo({ top: 0, behavior: "instant" });
}

function renderTags(tags) {
    const container = document.getElementById("profileTags");
    container.innerHTML = "";

    tags.forEach(tag => {
        const element = document.createElement("span");
        element.className = "tag";
        element.textContent = tag;
        container.appendChild(element);
    });
}

function renderArticle(sections) {
    const container = document.getElementById("articleContent");
    container.innerHTML = "";

    sections.forEach(section => {
        if (section.heading) {
            const heading = document.createElement("h3");
            heading.textContent = section.heading;
            container.appendChild(heading);
        }

        section.paragraphs.forEach(paragraph => {
            const p = document.createElement("p");

            /*
                Wrap every character in a span.
                CSS makes each individual character glow white + green
                when the mouse hovers over it.
            */
            [...paragraph].forEach(character => {
                const letter = document.createElement("span");
                letter.className = "article-letter";
                letter.textContent = character;
                p.appendChild(letter);
            });

            container.appendChild(p);
        });
    });
}

/* ---------------------------
   BUTTONS / EVENTS
   --------------------------- */

searchButton.addEventListener("click", () => {
    startSearch(searchInput.value);
});

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        startSearch(searchInput.value);
    }
});

document.querySelectorAll(".example-search, .featured-card").forEach(element => {
    element.addEventListener("click", () => {
        const profileName = element.dataset.profile;
        searchInput.value = profileName;
        startSearch(profileName);
    });
});

backButton.addEventListener("click", () => {
    profilePage.hidden = true;
    homePage.hidden = false;
    searchInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
});

/* Allow ESC to return from the profile page. */
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !profilePage.hidden) {
        backButton.click();
    }
});


/* =========================================
   CHAT_90 // GLOBAL LIVE CHAT
   ========================================= */

const chatAuthPage = document.getElementById("chatAuthPage");
const chatSetupPage = document.getElementById("chatSetupPage");
const chatPage = document.getElementById("chatPage");
const chatAuthMessage = document.getElementById("chatAuthMessage");
const chatPasswordInput = document.getElementById("chatPasswordInput");
const chatPasswordButton = document.getElementById("chatPasswordButton");
const chatAuthBack = document.getElementById("chatAuthBack");
const chatSetupBack = document.getElementById("chatSetupBack");
const chatUsernameInput = document.getElementById("chatUsernameInput");
const chatAvatarInput = document.getElementById("chatAvatarInput");
const chatBioInput = document.getElementById("chatBioInput");
const chatTagsInput = document.getElementById("chatTagsInput");
const chatSpecialOptions = document.getElementById("chatSpecialOptions");
const chatGlowInput = document.getElementById("chatGlowInput");
const chatBadgeInput = document.getElementById("chatBadgeInput");
const chatEffectInput = document.getElementById("chatEffectInput");
const chatEnterButton = document.getElementById("chatEnterButton");
const chatBackButton = document.getElementById("chatBackButton");
const chatUsersList = document.getElementById("chatUsersList");
const chatMessages = document.getElementById("chatMessages");
const chatOnlineCount = document.getElementById("chatOnlineCount");
const chatOnlineCountSide = document.getElementById("chatOnlineCountSide");
const chatMeCard = document.getElementById("chatMeCard");
const chatEditProfile = document.getElementById("chatEditProfile");
const chatLogout = document.getElementById("chatLogout");
const chatMessageInput = document.getElementById("chatMessageInput");
const chatSendButton = document.getElementById("chatSendButton");
const chatGifButton = document.getElementById("chatGifButton");
const chatImageButton = document.getElementById("chatImageButton");
const chatProfileModal = document.getElementById("chatProfileModal");
const chatProfileModalContent = document.getElementById("chatProfileModalContent");
const chatProfileModalClose = document.getElementById("chatProfileModalClose");
const chatConnectionState = document.getElementById("chatConnectionState");

const CHAT_NORMAL_PASSWORD = "56789";
const CHAT_SPECIAL_PASSWORD = "9!GAG";
const CHAT_DEFAULT_AVATAR = "https://cdn.pfps.gg/pfps/3651-dark-purple-anime.png";
const CHAT_CHANNEL_NAME = "ECHO_SHARE_CHAT_90_GLOBAL";
const chatChannel = "BroadcastChannel" in window ? new BroadcastChannel(CHAT_CHANNEL_NAME) : null;
const chatClientId = `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
let chatAccessLevel = "normal";
let chatEditing = false;
let chatPresenceTimer = null;
let chatPresence = {};

const CHAT_SPECIAL_EFFECTS = [
    "red-pulse","blood-glitch","crimson-flare","inferno","blood-moon","hellfire","void-rift","soul-burn","scarlet-storm","demon-aura",
    "ruby-shatter","red-lightning","dark-matter","neon-blood","phantom-red","cursed-signal","rage-core","abyssal-wave","crimson-rain","hell-scan",
    "blood-drip","vampire-glow","dragon-fire","war-cry","fatal-error","glitch-burst","hologram-red","laser-slice","shadow-flame","black-sun",
    "red-echo","soul-chain","dark-heart","crimson-orbit","pixel-blood","nightmare","toxic-crimson","arcane-red","chaos-ring","red-comet",
    "executioner","sinister-wave","scarlet-ghost","demon-glitch","void-blood","hellstorm","omega-red","red-singularity","cursed-crown","apocalypse"
];

const CHAT_DEMO_USERS = [
    { username: "ECHO BOT", avatar: CHAT_DEFAULT_AVATAR, role: "SYSTEM", glow: "#9b9b9b", badge: "", bio: "Archive system bot.", tags: ["SYSTEM","BOT"], bot: true },
    { username: "Shadow", avatar: CHAT_DEFAULT_AVATAR, role: "MEMBER", glow: "#8a63ff", badge: "", bio: "Watching the archive.", tags: ["MEMBER","WATCHER"] },
    { username: "Writer///Tea", avatar: CHAT_DEFAULT_AVATAR, role: "WRITER", glow: "#39ff88", badge: "", bio: "Writing the records.", tags: ["WRITER","ARCHIVIST"] }
];

function getChatProfile() { try { return JSON.parse(localStorage.getItem("echoChatProfile") || "null"); } catch (_) { return null; } }
function saveChatProfile(profile) { localStorage.setItem("echoChatProfile", JSON.stringify(profile)); }
function getChatMessages() { try { return JSON.parse(localStorage.getItem("echoChatMessages") || "[]"); } catch (_) { return []; } }
function saveChatMessages(messages) { localStorage.setItem("echoChatMessages", JSON.stringify(messages.slice(-200))); }
function escapeText(text) { return String(text ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function showOnly(page) { homePage.hidden=true; profilePage.hidden=true; chatAuthPage.hidden=true; chatSetupPage.hidden=true; chatPage.hidden=true; page.hidden=false; }
function openChatAuth() { clearInterval(loadingTimer); loadingScreen.classList.remove("active"); chatAuthMessage.textContent=""; chatPasswordInput.value=""; showOnly(chatAuthPage); setTimeout(()=>chatPasswordInput.focus(),50); }
function returnToArchive() { stopPresence(); chatAuthPage.hidden=true; chatSetupPage.hidden=true; chatPage.hidden=true; profilePage.hidden=true; homePage.hidden=false; searchInput.focus(); window.scrollTo({top:0,behavior:"smooth"}); }

function authenticateChat() {
    const password=chatPasswordInput.value;
    if(password!==CHAT_NORMAL_PASSWORD && password!==CHAT_SPECIAL_PASSWORD){ chatAuthMessage.textContent="ACCESS DENIED — INVALID PASSWORD."; chatPasswordInput.value=""; chatPasswordInput.focus(); return; }
    chatAccessLevel=password===CHAT_SPECIAL_PASSWORD?"special":"normal";
    const existing=getChatProfile();
    if(existing){ existing.access=chatAccessLevel; existing.role=chatAccessLevel==="special"?"SPECIAL / ADMIN":"MEMBER"; if(chatAccessLevel!=="special"){existing.glow="#39ff88";existing.badge="";existing.effect="normal";} saveChatProfile(existing); openChat(); return; }
    chatEditing=false; chatSpecialOptions.hidden=chatAccessLevel!=="special"; chatUsernameInput.value=""; chatAvatarInput.value=""; chatBioInput.value=""; chatTagsInput.value=""; chatGlowInput.value="#ff2d2d"; chatBadgeInput.value=""; chatEffectInput.value="red-pulse"; showOnly(chatSetupPage); chatUsernameInput.focus();
}
function openChatSetupForEdit(){ const p=getChatProfile(); if(!p)return; chatEditing=true; chatUsernameInput.value=p.username||""; chatAvatarInput.value=p.avatar||""; chatBioInput.value=p.bio||""; chatTagsInput.value=(p.tags||[]).join(", "); chatGlowInput.value=p.glow||"#ff2d2d"; chatBadgeInput.value=p.badge||""; chatEffectInput.value=p.effect||"red-pulse"; chatSpecialOptions.hidden=p.access!=="special"; showOnly(chatSetupPage); chatUsernameInput.focus(); }
function enterChat(){
    const username=chatUsernameInput.value.trim(); if(!username){chatUsernameInput.focus();return;}
    const old=getChatProfile()||{};
    const tags=chatTagsInput.value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,8);
    const profile={username:username.slice(0,24),avatar:chatAvatarInput.value.trim()||CHAT_DEFAULT_AVATAR,bio:chatBioInput.value.trim().slice(0,120),tags,access:chatAccessLevel,role:chatAccessLevel==="special"?"SPECIAL / ADMIN":"MEMBER",glow:chatAccessLevel==="special"?(chatGlowInput.value.trim()||"#ff2d2d"):"#39ff88",badge:chatAccessLevel==="special"?chatBadgeInput.value.trim():"",effect:chatAccessLevel==="special"?chatEffectInput.value:"normal",clientId:chatClientId};
    saveChatProfile(profile); announcePresence("join"); openChat();
    if(!chatEditing || !old.username) broadcastMessage({bot:true,username:"ECHO BOT",avatar:CHAT_DEFAULT_AVATAR,role:"SYSTEM",glow:"#9b9b9b",tags:["SYSTEM","BOT"],text:`New guy named ${profile.username} has joined Chat_90.`});
    else broadcast({type:"profile",profile});
    chatEditing=false;
}
function openChat(){ const p=getChatProfile(); if(!p){openChatAuth();return;} chatAccessLevel=p.access==="special"?"special":"normal"; showOnly(chatPage); startPresence(); renderChat(); chatMessageInput.focus(); }

function collectUsers(){
    const p=getChatProfile(); const map=new Map();
    CHAT_DEMO_USERS.forEach(u=>map.set(u.username,u));
    Object.values(chatPresence).forEach(u=>{ if(u && u.username) map.set(u.username,u); });
    if(p) map.set(p.username,p);
    return [...map.values()];
}
function renderUsers(profile){
    const users=collectUsers(); chatOnlineCount.textContent=users.length; chatOnlineCountSide.textContent=users.length; chatUsersList.innerHTML="";
    users.forEach(user=>{ const row=document.createElement("button"); row.type="button"; row.className="chat-user-row"; row.style.setProperty("--chat-glow",user.glow||"#ff3030"); row.innerHTML=`<span class="chat-user-dot"></span><img class="chat-user-avatar" src="${escapeText(user.avatar||CHAT_DEFAULT_AVATAR)}" alt=""><div class="chat-user-name">${escapeText(user.username)} <span class="chat-user-role">${escapeText(user.role||"MEMBER")}</span></div>`; row.addEventListener("click",()=>openChatProfile(user)); chatUsersList.appendChild(row); });
}
function renderMe(profile){ chatMeCard.style.setProperty("--chat-glow",profile.glow||"#39ff88"); chatMeCard.innerHTML=`<img class="chat-me-avatar" src="${escapeText(profile.avatar)}" alt=""><div class="chat-me-name">${escapeText(profile.username)} ${profile.badge?`<img class="chat-badge" src="${escapeText(profile.badge)}" alt="badge">`:""}</div><div class="chat-me-role">${escapeText(profile.role)}</div><div class="chat-me-bio">${escapeText(profile.bio||"No bio added.")}</div><div class="chat-tags">${(profile.tags||[]).map(t=>`<span>${escapeText(t)}</span>`).join("")}</div>`; }
function openChatProfile(user){
    const tags=user.tags||[]; chatProfileModalContent.innerHTML=`<div class="chat-modal-kicker">CHAT_90 // PROFILE</div><img class="chat-modal-avatar" src="${escapeText(user.avatar||CHAT_DEFAULT_AVATAR)}" alt=""><h2 style="text-shadow:0 0 18px ${escapeText(user.glow||"#ff3030")}">${escapeText(user.username)}</h2><div class="chat-modal-role">${escapeText(user.role||"MEMBER")}</div><p class="chat-modal-bio">${escapeText(user.bio||"No bio added.")}</p><div class="chat-modal-tags">${tags.length?tags.map(t=>`<span>${escapeText(t)}</span>`).join(""):"<span>NO TAGS</span>"}</div><div class="chat-modal-effect">MESSAGE EFFECT: <b>${escapeText(user.effect||"normal")}</b></div>`; chatProfileModal.hidden=false; chatProfileModal.setAttribute("aria-hidden","false"); }
function closeChatProfile(){chatProfileModal.hidden=true;chatProfileModal.setAttribute("aria-hidden","true");}

function renderChat(){ const p=getChatProfile(); if(!p)return; renderUsers(p); renderMe(p); chatMessages.innerHTML=""; const messages=getChatMessages(); if(!messages.length){ addChatMessage({bot:true,username:"ECHO BOT",avatar:CHAT_DEFAULT_AVATAR,role:"SYSTEM",glow:"#9b9b9b",tags:["SYSTEM","BOT"],text:"Welcome to CHAT_90. The global archive channel is now online."},false); } else messages.forEach(renderMessage); }
function renderMessage(message){
    const article=document.createElement("article"); article.className=`chat-message ${message.bot?"bot":""} ${message.effect||""}`; article.style.setProperty("--chat-glow",message.glow||"#ff3030"); article.dataset.messageId=message.id||"";
    const canManage=!message.bot&&chatAccessLevel==="special"; const badge=message.badge?`<img class="chat-badge" src="${escapeText(message.badge)}" alt="badge">`:""; const actions=canManage?`<div class="chat-message-actions"><button data-action="delete">DELETE</button><button data-action="kick">REMOVE USER</button></div>`:"";
    article.innerHTML=`<div class="chat-message-head"><img class="chat-message-avatar" src="${escapeText(message.avatar||CHAT_DEFAULT_AVATAR)}" alt=""><button class="chat-message-name chat-name-button" type="button">${escapeText(message.username)}</button>${badge}<span class="chat-message-role">${escapeText(message.role||"MEMBER")}</span><span class="chat-message-time">${escapeText(message.time||"NOW")}</span></div><div class="chat-message-body">${escapeText(message.text||"")}</div>${message.image?`<img class="chat-message-image" src="${escapeText(message.image)}" alt="Chat image" loading="lazy">`:""}${actions}`;
    if(message.gif){const gif=document.createElement("img");gif.className="chat-message-image chat-gif";gif.src=message.gif;gif.alt="GIF";gif.loading="lazy";article.appendChild(gif);}
    article.querySelector(".chat-name-button")?.addEventListener("click",()=>openChatProfile(message)); article.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>b.dataset.action==="delete"?deleteChatMessage(message.id):kickCurrentUser())); chatMessages.appendChild(article);
}
function addChatMessage(data,persist=true){ const message={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),...data}; if(persist){const m=getChatMessages();m.push(message);saveChatMessages(m);} renderMessage(message); chatMessages.scrollTop=chatMessages.scrollHeight; }
function broadcastMessage(data){const message={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),...data}; const m=getChatMessages();m.push(message);saveChatMessages(m); if(chatPage&&!chatPage.hidden) addChatMessage(message,false); broadcast({type:"message",message}); }
function broadcast(data){if(chatChannel)chatChannel.postMessage(data);}
function sendChatMessage(text,extra={}){const p=getChatProfile();if(!p||(!text.trim()&&!extra.image&&!extra.gif))return;broadcastMessage({username:p.username,avatar:p.avatar,role:p.role,glow:p.glow,badge:p.badge,effect:p.effect,tags:p.tags,text:text.trim(),...extra});}
function deleteChatMessage(id){if(chatAccessLevel!=="special")return;saveChatMessages(getChatMessages().filter(m=>m.id!==id));broadcast({type:"delete",id});renderChat();}
function kickCurrentUser(){if(chatAccessLevel!=="special")return;const p=getChatProfile();broadcast({type:"kick",username:p?.username});localStorage.removeItem("echoChatProfile");stopPresence();returnToArchive();searchMessage.textContent="CHAT_90: your session was removed by a special account.";}
function sendImagePrompt(){const url=window.prompt("Paste an image URL:");if(url)sendChatMessage("",{image:url.trim()});}
function sendGifPrompt(){const url=window.prompt("Paste a GIF URL:");if(url)sendChatMessage("",{gif:url.trim()});}

function announcePresence(action){const p=getChatProfile();if(!p||!chatChannel)return;broadcast({type:"presence",action,clientId:chatClientId,profile:{...p,clientId:chatClientId,sentAt:Date.now()},sentAt:Date.now()});}
function startPresence(){ if(!chatChannel)return; if(chatConnectionState)chatConnectionState.textContent="GLOBAL LIVE"; announcePresence("join"); clearInterval(chatPresenceTimer); chatPresenceTimer=setInterval(()=>announcePresence("heartbeat"),5000); }
function stopPresence(){clearInterval(chatPresenceTimer);chatPresenceTimer=null;const p=getChatProfile();if(p&&chatChannel)broadcast({type:"presence",action:"leave",clientId:chatClientId});}
if(chatChannel){chatChannel.onmessage=e=>{const d=e.data||{}; if(d.type==="message"){const msgs=getChatMessages();if(!msgs.some(m=>m.id===d.message.id)){msgs.push(d.message);saveChatMessages(msgs);}if(chatPage&&!chatPage.hidden) addChatMessage(d.message,false);} if(d.type==="delete"){saveChatMessages(getChatMessages().filter(m=>m.id!==d.id));if(chatPage&&!chatPage.hidden)renderChat();} if(d.type==="presence"){if(d.action==="leave")delete chatPresence[d.clientId];else chatPresence[d.clientId]=d.profile; if(chatPage&&!chatPage.hidden)renderUsers(getChatProfile());} if(d.type==="profile"&&d.profile){chatPresence[d.profile.clientId||d.profile.username]=d.profile;if(chatPage&&!chatPage.hidden)renderUsers(getChatProfile());} if(d.type==="kick"&&d.username===getChatProfile()?.username){localStorage.removeItem("echoChatProfile");stopPresence();returnToArchive();searchMessage.textContent="CHAT_90: you were removed by a special account.";} }; }
setInterval(()=>{const now=Date.now();Object.keys(chatPresence).forEach(k=>{if(now-(chatPresence[k].sentAt||now)>15000)delete chatPresence[k];});if(chatPage&&!chatPage.hidden)renderUsers(getChatProfile());},5000);

chatPasswordButton.addEventListener("click",authenticateChat); chatPasswordInput.addEventListener("keydown",e=>{if(e.key==="Enter")authenticateChat();}); chatAuthBack.addEventListener("click",returnToArchive); chatSetupBack.addEventListener("click",returnToArchive); chatEnterButton.addEventListener("click",enterChat); chatUsernameInput.addEventListener("keydown",e=>{if(e.key==="Enter")enterChat();}); chatBackButton.addEventListener("click",returnToArchive); chatEditProfile.addEventListener("click",openChatSetupForEdit); chatLogout.addEventListener("click",()=>{const p=getChatProfile();if(p)broadcastMessage({bot:true,username:"ECHO BOT",avatar:CHAT_DEFAULT_AVATAR,role:"SYSTEM",glow:"#9b9b9b",tags:["SYSTEM","BOT"],text:`${p.username} has left Chat_90.`});stopPresence();localStorage.removeItem("echoChatProfile");returnToArchive();}); chatSendButton.addEventListener("click",()=>{sendChatMessage(chatMessageInput.value);chatMessageInput.value="";chatMessageInput.focus();}); chatMessageInput.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();chatSendButton.click();}}); chatGifButton.addEventListener("click",sendGifPrompt); chatImageButton.addEventListener("click",sendImagePrompt); chatProfileModalClose.addEventListener("click",closeChatProfile); chatProfileModal.addEventListener("click",e=>{if(e.target===chatProfileModal)closeChatProfile();});
window.addEventListener("beforeunload",stopPresence);
