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
   CHAT_90
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
const chatProfileModal = document.getElementById("chatProfileModal");
const chatViewedProfile = document.getElementById("chatViewedProfile");
const chatProfileClose = document.getElementById("chatProfileClose");
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

const CHAT_NORMAL_PASSWORD = "56789";
const CHAT_SPECIAL_PASSWORD = "9!GAG";
const CHAT_DEFAULT_AVATAR = "https://cdn.pfps.gg/pfps/3651-dark-purple-anime.png";

let chatAccessLevel = "normal";
let chatEditing = false;

const CHAT_DEMO_USERS = [
    { username: "ECHO BOT", avatar: CHAT_DEFAULT_AVATAR, role: "SYSTEM", glow: "#9b9b9b", badge: "", bio: "Archive system bot.", bot: true },
    { username: "Shadow", avatar: CHAT_DEFAULT_AVATAR, role: "MEMBER", glow: "#8a63ff", badge: "", bio: "Watching the archive." },
    { username: "Writer///Tea", avatar: CHAT_DEFAULT_AVATAR, role: "WRITER", glow: "#39ff88", badge: "", bio: "Writing the records." }
];

function getChatProfile() {
    try {
        return JSON.parse(localStorage.getItem("echoChatProfile") || "null");
    } catch (_) {
        return null;
    }
}

function saveChatProfile(profile) {
    localStorage.setItem("echoChatProfile", JSON.stringify(profile));
}

function getChatMessages() {
    try {
        return JSON.parse(localStorage.getItem("echoChatMessages") || "[]");
    } catch (_) {
        return [];
    }
}

function saveChatMessages(messages) {
    localStorage.setItem("echoChatMessages", JSON.stringify(messages.slice(-100)));
}

function showOnly(page) {
    homePage.hidden = true;
    profilePage.hidden = true;
    chatAuthPage.hidden = true;
    chatSetupPage.hidden = true;
    chatPage.hidden = true;
    page.hidden = false;
}

function openChatAuth() {
    clearInterval(loadingTimer);
    loadingScreen.classList.remove("active");
    chatAuthMessage.textContent = "";
    chatPasswordInput.value = "";
    showOnly(chatAuthPage);
    setTimeout(() => chatPasswordInput.focus(), 50);
}

function returnToArchive() {
    chatAuthPage.hidden = true;
    chatSetupPage.hidden = true;
    chatPage.hidden = true;
    profilePage.hidden = true;
    homePage.hidden = false;
    searchInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function authenticateChat() {
    const password = chatPasswordInput.value;

    if (password !== CHAT_NORMAL_PASSWORD && password !== CHAT_SPECIAL_PASSWORD) {
        chatAuthMessage.textContent = "ACCESS DENIED — INVALID PASSWORD.";
        chatPasswordInput.value = "";
        chatPasswordInput.focus();
        return;
    }

    chatAccessLevel = password === CHAT_SPECIAL_PASSWORD ? "special" : "normal";
    chatAuthMessage.textContent = "ACCESS GRANTED.";

    const existing = getChatProfile();
    if (existing) {
        existing.access = chatAccessLevel;
        saveChatProfile(existing);
        openChat();
        return;
    }

    chatEditing = false;
    chatSpecialOptions.hidden = chatAccessLevel !== "special";
    chatUsernameInput.value = "";
    chatAvatarInput.value = "";
    chatBioInput.value = "";
    chatTagsInput.value = "";
    chatGlowInput.value = "#ff2d2d";
    chatBadgeInput.value = "";
    chatEffectInput.value = "red-pulse";
    showOnly(chatSetupPage);
    chatUsernameInput.focus();
}

function openChatSetupForEdit() {
    const profile = getChatProfile();
    if (!profile) return;

    chatEditing = true;
    chatUsernameInput.value = profile.username || "";
    chatAvatarInput.value = profile.avatar || "";
    chatBioInput.value = profile.bio || "";
    chatTagsInput.value = (profile.tags || []).join(", ");
    chatGlowInput.value = profile.glow || "#ff2d2d";
    chatBadgeInput.value = profile.badge || "";
    chatEffectInput.value = profile.effect || "red-pulse";
    chatSpecialOptions.hidden = profile.access !== "special";
    showOnly(chatSetupPage);
    chatUsernameInput.focus();
}

function enterChat() {
    const username = chatUsernameInput.value.trim();
    if (!username) {
        chatUsernameInput.focus();
        return;
    }

    const oldProfile = getChatProfile() || {};
    const profile = {
        username: username.slice(0, 24),
        avatar: chatAvatarInput.value.trim() || CHAT_DEFAULT_AVATAR,
        bio: chatBioInput.value.trim().slice(0, 160),
        tags: chatTagsInput.value.split(",").map(t => t.trim()).filter(Boolean).slice(0, 12),
        access: chatAccessLevel,
        role: chatAccessLevel === "special" ? "SPECIAL / ADMIN" : "MEMBER",
        glow: chatAccessLevel === "special" ? (chatGlowInput.value.trim() || "#ff2d2d") : "#39ff88",
        badge: chatAccessLevel === "special" ? chatBadgeInput.value.trim() : "",
        effect: chatAccessLevel === "special" ? chatEffectInput.value : "normal"
    };

    saveChatProfile(profile);
    openChat();

    if (!chatEditing || !oldProfile.username) {
        addChatMessage({
            bot: true,
            username: "ECHO BOT",
            avatar: CHAT_DEFAULT_AVATAR,
            role: "SYSTEM",
            glow: "#9b9b9b",
            text: `New guy named ${profile.username} has joined Chat_90.`
        });
    }

    chatEditing = false;
}

function openChat() {
    const profile = getChatProfile();
    if (!profile) {
        openChatAuth();
        return;
    }

    chatAccessLevel = profile.access === "special" ? "special" : "normal";
    showOnly(chatPage);
    renderChat();
    chatMessageInput.focus();
}

function escapeText(text) {
    return String(text).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
}

function renderUsers(profile) {
    const users = [...CHAT_DEMO_USERS.filter(user => user.username !== profile.username), {
        username: profile.username,
        avatar: profile.avatar,
        role: profile.role,
        glow: profile.glow,
        badge: profile.badge,
        bio: profile.bio
    }];

    chatOnlineCount.textContent = users.length;
    chatOnlineCountSide.textContent = users.length;
    chatUsersList.innerHTML = "";

    users.forEach(user => {
        const row = document.createElement("div");
        row.className = "chat-user-row";
        row.style.setProperty("--chat-glow", user.glow || "#ff3030");
        row.innerHTML = `
            <span class="chat-user-dot"></span>
            <img class="chat-user-avatar" src="${escapeText(user.avatar || CHAT_DEFAULT_AVATAR)}" alt="">
            <div class="chat-user-name" style="text-shadow:0 0 8px ${escapeText(user.glow || "#ff3030")}">
                ${escapeText(user.username)}
                <span class="chat-user-role">${escapeText(user.role || "MEMBER")}</span>
            </div>`;
        chatUsersList.appendChild(row);
    });
}

function renderMe(profile) {
    chatMeCard.style.setProperty("--chat-glow", profile.glow || "#39ff88");
    chatMeCard.innerHTML = `
        <img class="chat-me-avatar" src="${escapeText(profile.avatar)}" alt="">
        <div class="chat-me-name">${escapeText(profile.username)} ${profile.badge ? `<img class="chat-badge" src="${escapeText(profile.badge)}" alt="badge">` : ""}</div>
        <div class="chat-me-role">${escapeText(profile.role)}</div>
        <div class="chat-me-bio">${escapeText(profile.bio || "No bio added.")}</div>`;
}

function renderChat() {
    const profile = getChatProfile();
    if (!profile) return;

    renderUsers(profile);
    renderMe(profile);
    chatMessages.innerHTML = "";

    const messages = getChatMessages();
    if (!messages.length) {
        addChatMessage({
            bot: true,
            username: "ECHO BOT",
            avatar: CHAT_DEFAULT_AVATAR,
            role: "SYSTEM",
            glow: "#9b9b9b",
            text: "Welcome to CHAT_90. The archive channel is now online."
        }, false);
        addChatMessage({
            bot: true,
            username: "ECHO BOT",
            avatar: CHAT_DEFAULT_AVATAR,
            role: "SYSTEM",
            glow: "#9b9b9b",
            text: `${profile.username} has entered the channel.`
        }, false);
    } else {
        messages.forEach(message => renderMessage(message));
    }
}

function renderMessage(message) {
    const article = document.createElement("article");
    article.className = `chat-message ${message.bot ? "bot" : ""} ${message.effect || ""}`;
    article.style.setProperty("--chat-glow", message.glow || "#ff3030");
    article.dataset.messageId = message.id || "";

    const canManage = !message.bot && chatAccessLevel === "special";
    const imagePart = message.image ? `<img class="chat-message-image" src="${escapeText(message.image)}" alt="Chat image" loading="lazy">` : "";
    const badgePart = message.badge ? `<img class="chat-badge" src="${escapeText(message.badge)}" alt="badge">` : "";
    const actions = canManage ? `<div class="chat-message-actions"><button data-action="delete">DELETE</button><button data-action="kick">REMOVE USER</button></div>` : "";

    article.innerHTML = `
        <div class="chat-message-head">
            <img class="chat-message-avatar" src="${escapeText(message.avatar || CHAT_DEFAULT_AVATAR)}" alt="">
            <span class="chat-message-name">${escapeText(message.username)}</span>
            ${badgePart}
            <span class="chat-message-role">${escapeText(message.role || "MEMBER")}</span>
            <span class="chat-message-time">${escapeText(message.time || "NOW")}</span>
        </div>
        <div class="chat-message-body">${escapeText(message.text || "")}</div>
        ${imagePart}
        ${actions}`;

    if (message.gif) {
        const gif = document.createElement("img");
        gif.className = "chat-message-image";
        gif.src = message.gif;
        gif.alt = "GIF";
        gif.loading = "lazy";
        article.appendChild(gif);
    }

    const actionButtons = article.querySelectorAll("[data-action]");
    actionButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (button.dataset.action === "delete") deleteChatMessage(message.id);
            if (button.dataset.action === "kick") kickCurrentUser();
        });
    });

    chatMessages.appendChild(article);
}

function addChatMessage(data, persist = true) {
    const message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ...data
    };

    if (persist) {
        const messages = getChatMessages();
        messages.push(message);
        saveChatMessages(messages);
    }

    renderMessage(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChatMessage(text, extra = {}) {
    const profile = getChatProfile();
    if (!profile || !text.trim() && !extra.image && !extra.gif) return;

    addChatMessage({
        username: profile.username,
        avatar: profile.avatar,
        role: profile.role,
        glow: profile.glow,
        badge: profile.badge,
        effect: profile.effect,
        text: text.trim(),
        ...extra
    });
}

function deleteChatMessage(id) {
    if (chatAccessLevel !== "special") return;
    saveChatMessages(getChatMessages().filter(message => message.id !== id));
    renderChat();
}

function kickCurrentUser() {
    if (chatAccessLevel !== "special") return;
    localStorage.removeItem("echoChatProfile");
    localStorage.setItem("echoChatKicked", "1");
    returnToArchive();
    searchMessage.textContent = "CHAT_90: your session was removed by a special account.";
}

function sendImagePrompt() {
    const url = window.prompt("Paste an image URL:");
    if (!url) return;
    sendChatMessage("", { image: url.trim() });
}

function sendGifPrompt() {
    const url = window.prompt("Paste a GIF URL:");
    if (!url) return;
    sendChatMessage("", { gif: url.trim() });
}

chatPasswordButton.addEventListener("click", authenticateChat);
chatPasswordInput.addEventListener("keydown", event => {
    if (event.key === "Enter") authenticateChat();
});
chatAuthBack.addEventListener("click", returnToArchive);
chatSetupBack.addEventListener("click", returnToArchive);
chatEnterButton.addEventListener("click", enterChat);
chatUsernameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") enterChat();
});
chatBackButton.addEventListener("click", returnToArchive);
chatEditProfile.addEventListener("click", openChatSetupForEdit);
chatLogout.addEventListener("click", () => {
    const profile = getChatProfile();
    if (profile) {
        addChatMessage({
            bot: true,
            username: "ECHO BOT",
            avatar: CHAT_DEFAULT_AVATAR,
            role: "SYSTEM",
            glow: "#9b9b9b",
            text: `${profile.username} has left Chat_90.`
        });
    }
    localStorage.removeItem("echoChatProfile");
    returnToArchive();
});
chatSendButton.addEventListener("click", () => {
    sendChatMessage(chatMessageInput.value);
    chatMessageInput.value = "";
    chatMessageInput.focus();
});
chatMessageInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatSendButton.click();
    }
});
chatGifButton.addEventListener("click", sendGifPrompt);
chatImageButton.addEventListener("click", sendImagePrompt);


/* ===========================
   CHAT_90 GLOBAL NETWORK LAYER
   =========================== */
const CHAT90_SERVER_URL = "https://echoshare-0nsm.onrender.com";
let chatSocket = null;
let chatConnected = false;
let chatAuthenticated = false;
let chatServerMessages = [];
let chatOnlineProfiles = [];
let chatReconnectTimer = null;
let chatReconnectDelay = 1000;
let chatPendingPackets = [];
let chatManualClose = false;

const CHAT_EFFECTS_50 = [
  ["red-pulse","Red Pulse"],["blood-glitch","Blood Glitch"],["crimson-flare","Crimson Flare"],
  ["inferno","Inferno"],["blood-moon","Blood Moon"],["hellfire","Hellfire"],["void-rift","Void Rift"],["soul-burn","Soul Burn"],["demon-aura","Demon Aura"],["red-lightning","Red Lightning"],
  ["nightmare","Nightmare"],["omega-red","Omega Red"],["red-singularity","Red Singularity"],["cursed-crown","Cursed Crown"],["apocalypse","Apocalypse"],["scarlet-storm","Scarlet Storm"],["crimson-rain","Crimson Rain"],["blood-surge","Blood Surge"],["hell-gate","Hell Gate"],["abyssal-glow","Abyssal Glow"],
  ["dark-flame","Dark Flame"],["soul-shatter","Soul Shatter"],["phantom-red","Phantom Red"],["executioner","Executioner"],["war-drum","War Drum"],["berserker","Berserker"],["rage-core","Rage Core"],["devil-mark","Devil Mark"],["red-curse","Red Curse"],["grave-light","Grave Light"],
  ["dead-star","Dead Star"],["red-eclipse","Red Eclipse"],["blood-orbit","Blood Orbit"],["chaos-ripple","Chaos Ripple"],["hell-wave","Hell Wave"],["infernal-runes","Infernal Runes"],["crimson-ghost","Crimson Ghost"],["soul-chain","Soul Chain"],["dark-matter-red","Dark Matter"],["warped-reality","Warped Reality"],
  ["red-aurora","Red Aurora"],["cursed-static","Cursed Static"],["dragon-blood","Dragon Blood"],["demon-heart","Demon Heart"],["fatal-error","Fatal Error"],["scarlet-void","Scarlet Void"],["apex-blood","Apex Blood"],["king-of-hell","King of Hell"],["last-breath","Last Breath"],["endless-night","Endless Night"]
];

function fillSpecialEffects(){
  if(!chatEffectInput) return;
  const current=chatEffectInput.value;
  chatEffectInput.innerHTML=CHAT_EFFECTS_50.map(([v,n])=>`<option value="${v}">${n}</option>`).join("");
  chatEffectInput.value=CHAT_EFFECTS_50.some(x=>x[0]===current)?current:"red-pulse";
}
fillSpecialEffects();

function chatWSUrl(){
  const base = new URL(CHAT90_SERVER_URL);
  return `${base.protocol === "https:" ? "wss:" : "ws:"}//${base.host}/chat90`;
}

function chatIsSocketOpen(){
  return !!chatSocket && chatSocket.readyState === WebSocket.OPEN;
}

function setChatConnectionState(state){
  chatConnected = state === "connected";
  if(chatPage && !chatPage.hidden){
    chatPage.dataset.connection = state;
    if(chatOnlineCount) chatOnlineCount.title = state === "connected" ? "CHAT_90 connected" : "CHAT_90 connecting";
  }
}

function queueChatPacket(packet){
  if(chatPendingPackets.length >= 50) chatPendingPackets.shift();
  chatPendingPackets.push(packet);
}

function flushChatPackets(){
  if(!chatIsSocketOpen() || !chatAuthenticated) return;
  while(chatPendingPackets.length){
    const packet=chatPendingPackets.shift();
    try { chatSocket.send(JSON.stringify(packet)); } catch(_){ chatPendingPackets.unshift(packet); break; }
  }
}

function sendChatAuthAndProfile(){
  if(!chatIsSocketOpen()) return;
  chatAuthenticated=false;
  const password=window.chat90Password || (getChatProfile()?.access === "special" ? CHAT_SPECIAL_PASSWORD : CHAT_NORMAL_PASSWORD);
  try { chatSocket.send(JSON.stringify({type:"auth",password})); } catch(_){ return; }
}

function sendChatProfileToServer(){
  if(!chatIsSocketOpen() || !chatAuthenticated) return;
  const p=getChatProfile();
  if(!p) return;
  try { chatSocket.send(JSON.stringify({...p,type:"profile",tags:p.tags||[]})); } catch(_){ }
}

function scheduleChatReconnect(){
  if(chatManualClose || chatPage.hidden || chatReconnectTimer) return;
  const delay=chatReconnectDelay;
  chatReconnectDelay=Math.min(chatReconnectDelay*2,15000);
  chatReconnectTimer=setTimeout(()=>{ chatReconnectTimer=null; connectChatSocket(); },delay);
}

function connectChatSocket(){
  if(chatManualClose || chatPage.hidden) return;
  if(chatSocket && (chatSocket.readyState===WebSocket.OPEN || chatSocket.readyState===WebSocket.CONNECTING)) return;
  setChatConnectionState("connecting");
  try {
    chatSocket=new WebSocket(chatWSUrl());
  } catch(e) {
    setChatConnectionState("disconnected");
    scheduleChatReconnect();
    return;
  }

  chatSocket.addEventListener("open",()=>{
    chatReconnectDelay=1000;
    setChatConnectionState("connected");
    sendChatAuthAndProfile();
  });

  chatSocket.addEventListener("error",()=>{
    setChatConnectionState("disconnected");
  });

  chatSocket.addEventListener("close",()=>{
    chatAuthenticated=false;
    setChatConnectionState("disconnected");
    chatSocket=null;
    scheduleChatReconnect();
  });

  chatSocket.addEventListener("message",event=>{
    let packet;
    try { packet=JSON.parse(event.data); } catch(_) { return; }

    if(packet.type==="hello"){
      chatServerMessages=Array.isArray(packet.history)?packet.history:[];
      chatOnlineProfiles=Array.isArray(packet.online)?packet.online:[];
      renderGlobalChat();
      return;
    }

    if(packet.type==="authResult"){
      if(!packet.ok){
        chatAuthenticated=false;
        setChatConnectionState("disconnected");
        console.error("CHAT_90 authentication failed:",packet.message);
        return;
      }
      chatAuthenticated=true;
      chatAccessLevel=packet.special?"special":"normal";
      sendChatProfileToServer();
      flushChatPackets();
      return;
    }

    if(packet.type==="profileSaved"){
      if(packet.profile){
        const existing=getChatProfile();
        if(existing) saveChatProfile({...existing,...packet.profile});
      }
      return;
    }

    if(packet.type==="message"){
      if(packet.message && !chatServerMessages.some(x=>x.id===packet.message.id)) chatServerMessages.push(packet.message);
      chatServerMessages=chatServerMessages.slice(-500);
      renderGlobalChat();
      return;
    }

    if(packet.type==="presence"){
      chatOnlineProfiles=Array.isArray(packet.online)?packet.online:[];
      renderGlobalUsers();
      return;
    }

    if(packet.type==="deleted"){
      chatServerMessages=chatServerMessages.filter(x=>x.id!==packet.id);
      renderGlobalChat();
      return;
    }

    if(packet.type==="profile"){
      showViewedProfile(packet.profile);
      return;
    }

    if(packet.type==="kicked"){
      localStorage.removeItem("echoChatProfile");
      chatManualClose=true;
      try { chatSocket?.close(); } catch(_){ }
      returnToArchive();
      alert(packet.message||"Removed from CHAT_90.");
    }

    if(packet.type==="error"){
      console.error("CHAT_90 server error:",packet.message);
    }
  });
}

function wsSend(packet){
  if(!packet) return;
  if(chatIsSocketOpen() && chatAuthenticated){
    try { chatSocket.send(JSON.stringify(packet)); return true; } catch(_){ }
  }
  queueChatPacket(packet);
  if(!chatSocket || chatSocket.readyState===WebSocket.CLOSED) connectChatSocket();
  return false;
}

function authenticateChat(){
  const password=chatPasswordInput.value;
  if(password!==CHAT_NORMAL_PASSWORD && password!==CHAT_SPECIAL_PASSWORD){ chatAuthMessage.textContent='ACCESS DENIED — INVALID PASSWORD.'; chatPasswordInput.value=''; chatPasswordInput.focus(); return; }
  window.chat90Password=password;
  chatAccessLevel=password===CHAT_SPECIAL_PASSWORD?'special':'normal';
  chatSpecialOptions.hidden=chatAccessLevel!=='special';
  fillSpecialEffects();
  const existing=getChatProfile();
  if(existing){
    existing.access=chatAccessLevel;
    saveChatProfile(existing);
    openChat();
    return;
  }
  chatEditing=false;
  chatUsernameInput.value=''; chatAvatarInput.value=''; chatBioInput.value=''; chatTagsInput.value='';
  chatGlowInput.value='#ff2d2d'; chatBadgeInput.value=''; fillSpecialEffects();
  showOnly(chatSetupPage); chatUsernameInput.focus();
}

function enterChat(){
  const username=chatUsernameInput.value.trim();
  if(!username) return chatUsernameInput.focus();
  const profile={
    username:username.slice(0,24),
    avatar:chatAvatarInput.value.trim()||CHAT_DEFAULT_AVATAR,
    bio:chatBioInput.value.trim().slice(0,160),
    tags:chatTagsInput.value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12),
    access:chatAccessLevel,
    role:chatAccessLevel==='special'?'SPECIAL / ADMIN':'MEMBER',
    glow:chatAccessLevel==='special'?(chatGlowInput.value.trim()||'#ff2d2d'):'#39ff88',
    badge:chatAccessLevel==='special'?chatBadgeInput.value.trim():'',
    effect:chatAccessLevel==='special'?chatEffectInput.value:'normal'
  };
  saveChatProfile(profile); chatEditing=false; openChat();
}

function openChat(){
  const profile=getChatProfile();
  if(!profile) return openChatAuth();
  chatManualClose=false;
  chatAccessLevel=profile.access==='special'?'special':'normal';
  showOnly(chatPage);
  renderMe(profile);
  chatMessages.innerHTML='';
  window.chat90Password=window.chat90Password || (profile.access==='special'?CHAT_SPECIAL_PASSWORD:CHAT_NORMAL_PASSWORD);
  connectChatSocket();
  chatMessageInput.focus();
}

function renderGlobalUsers(){
  const me=getChatProfile();
  const users=chatOnlineProfiles.length?chatOnlineProfiles:(me?[me]:[]);
  chatOnlineCount.textContent=users.length;
  chatOnlineCountSide.textContent=users.length;
  chatUsersList.innerHTML='';
  users.forEach(user=>{
    const row=document.createElement('button');
    row.type='button'; row.className='chat-user-row chat-user-clickable';
    row.style.setProperty('--chat-glow',user.glow||'#ff3030');
    row.innerHTML=`<span class="chat-user-dot"></span><img class="chat-user-avatar" src="${escapeText(user.avatar||CHAT_DEFAULT_AVATAR)}" alt=""><div class="chat-user-name" style="text-shadow:0 0 8px ${escapeText(user.glow||'#ff3030')}">${escapeText(user.username)} <span class="chat-user-role">${escapeText(user.role||'MEMBER')}</span></div>`;
    row.addEventListener('click',()=>showViewedProfile(user));
    chatUsersList.appendChild(row);
  });
}

function renderGlobalChat(){
  if(chatPage.hidden) return;
  renderGlobalUsers();
  renderMe(getChatProfile()||{});
  chatMessages.innerHTML='';
  chatServerMessages.forEach(renderMessage);
  chatMessages.scrollTop=chatMessages.scrollHeight;
}

function renderMessage(message){
  const article=document.createElement('article');
  article.className=`chat-message ${message.bot?'bot':''} ${message.effect||''}`;
  article.style.setProperty('--chat-glow',message.glow||'#ff3030');
  article.dataset.messageId=message.id||'';
  const badge=message.badge?`<img class="chat-badge" src="${escapeText(message.badge)}" alt="badge">`:'';
  const manage=chatAccessLevel==='special'&&!message.bot?`<div class="chat-message-actions"><button data-action="delete">DELETE</button><button data-action="kick">REMOVE USER</button></div>`:'';
  article.innerHTML=`<div class="chat-message-head"><button class="chat-message-identity" type="button"><img class="chat-message-avatar" src="${escapeText(message.avatar||CHAT_DEFAULT_AVATAR)}" alt=""><span class="chat-message-name">${escapeText(message.username)}</span></button>${badge}<span class="chat-message-role">${escapeText(message.role||'MEMBER')}</span><span class="chat-message-time">${escapeText(new Date(message.time||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}</span></div><div class="chat-message-body">${escapeText(message.text||'')}</div>${message.image?`<img class="chat-message-image" src="${escapeText(message.image)}" alt="Chat image" loading="lazy">`:''}${message.gif?`<img class="chat-message-image" src="${escapeText(message.gif)}" alt="GIF" loading="lazy">`:''}${manage}`;
  article.querySelector('.chat-message-identity').addEventListener('click',()=>showViewedProfile(chatOnlineProfiles.find(p=>p.username===message.username)||{username:message.username,avatar:message.avatar,role:message.role,glow:message.glow,badge:message.badge,effect:message.effect,tags:[],bio:'',joined:''}));
  article.querySelector('[data-action="delete"]')?.addEventListener('click',()=>wsSend({type:'delete',id:message.id}));
  article.querySelector('[data-action="kick"]')?.addEventListener('click',()=>wsSend({type:'kick',username:message.username}));
  chatMessages.appendChild(article);
}

function sendChatMessage(text,extra={}){
  const p=getChatProfile();
  if(!p) return;
  const cleanText=String(text||'').trim();
  const packet={type:'message',text:cleanText,...extra};
  if(!cleanText && !extra.image && !extra.gif) return;
  wsSend(packet);
}
function deleteChatMessage(id){wsSend({type:'delete',id});}
function kickCurrentUser(username){wsSend({type:'kick',username:username||getChatProfile()?.username});}
function sendImagePrompt(){const url=prompt('Paste an image URL:'); if(url) sendChatMessage('',{image:url.trim()});}
function sendGifPrompt(){const url=prompt('Paste a GIF URL:'); if(url) sendChatMessage('',{gif:url.trim()});}
function showViewedProfile(profile){
  if(!profile) return;
  const history=chatServerMessages.filter(m=>!m.bot&&m.username===profile.username).slice(-30).reverse();
  chatViewedProfile.innerHTML=`<div class="viewed-profile-hero" style="--chat-glow:${escapeText(profile.glow||'#ff3030')}"><img src="${escapeText(profile.avatar||CHAT_DEFAULT_AVATAR)}" alt=""><div><h2>${escapeText(profile.username)} ${profile.badge?`<img class="chat-badge" src="${escapeText(profile.badge)}">`:''}</h2><div class="viewed-role">${escapeText(profile.role||'MEMBER')}</div></div></div><div class="viewed-profile-bio">${escapeText(profile.bio||'No bio added.')}</div><div class="side-title">TAGS</div><div class="tags">${(profile.tags||[]).map(t=>`<span class="tag">${escapeText(t)}</span>`).join('')||'<span class="tag">NO TAGS</span>'}</div><div class="side-title viewed-history-title">CHAT HISTORY</div><div class="viewed-history">${history.length?history.map(m=>`<div class="viewed-history-row"><span>${escapeText(m.text|| (m.gif?'[GIF]':'[IMAGE]'))}</span><small>${escapeText(new Date(m.time||Date.now()).toLocaleString())}</small></div>`).join(''):'<div class="viewed-empty">No messages yet.</div>'}</div>`;
  chatProfileModal.hidden=false;
}

chatProfileClose.addEventListener('click',()=>chatProfileModal.hidden=true);
chatProfileModal.addEventListener('click',e=>{if(e.target===chatProfileModal) chatProfileModal.hidden=true;});
