
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
const clickSound = document.getElementById("clickSound");
const CLICK_SOUND_PATH = "sounds/Goodjob!.mp3";
if (backgroundNoise) backgroundNoise.src = "sounds/background-noise.mp3.mp3";
if (clickSound) clickSound.src = CLICK_SOUND_PATH;
let backgroundNoiseStarted = false;

// Start the background track as soon as the page is loaded.
// Browsers may block unmuted autoplay until the visitor interacts;
// once they click/tap/type, we immediately start it at the saved volume.
function startBackgroundNoise() {
    if (!backgroundNoise || backgroundNoiseStarted) return;

    backgroundNoise.loop = true;
    backgroundNoise.volume = ((Number(window.echoShareGetSetting?.("master") ?? 100) / 100) * (Number(window.echoShareGetSetting?.("background") ?? 5) / 100));

    const playPromise = backgroundNoise.play();
    if (playPromise && typeof playPromise.then === "function") {
        playPromise.then(() => {
            backgroundNoiseStarted = true;
        }).catch(() => {
            // Autoplay was blocked. The interaction listeners below will retry.
        });
    }
}

// Try immediately — this works automatically when the browser permits autoplay.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBackgroundNoise, { once: true });
} else {
    startBackgroundNoise();
}

// Retry after the first user interaction so Chrome/Edge/Safari can unlock audio.
function unlockBackgroundNoise() {
    if (!backgroundNoise) return;
    const on = window.echoShareGetSetting ? window.echoShareGetSetting("backgroundOn") !== false : true;
    const master = Number(window.echoShareGetSetting?.("master") ?? 100) / 100;
    const background = Number(window.echoShareGetSetting?.("background") ?? 5) / 100;
    backgroundNoise.loop = true;
    backgroundNoise.volume = Math.max(0, Math.min(1, master * background));
    if (!on || backgroundNoise.volume <= 0) {
        backgroundNoise.pause();
        return;
    }
    backgroundNoise.play().then(() => {
        backgroundNoiseStarted = true;
    }).catch(() => {});
}

document.addEventListener("pointerdown", unlockBackgroundNoise, { passive: true });
document.addEventListener("keydown", unlockBackgroundNoise, { passive: true });
document.addEventListener("touchstart", unlockBackgroundNoise, { passive: true });

/* ---------------------------
   ONE-TIME LOADING SOUND
   --------------------------- */

function playLoadingSound() {
    try {
        const volume = window.echoShareGetSetting ? Number(window.echoShareGetSetting("click") ?? 65) : 65;
        const master = window.echoShareGetSetting ? Number(window.echoShareGetSetting("master") ?? 100) : 100;
        if (!clickSound || volume <= 0 || master <= 0) return;
        clickSound.volume = Math.max(0, Math.min(1, (volume / 100) * (master / 100)));
        clickSound.currentTime = 0;
        const p = clickSound.play();
        if (p?.catch) p.catch(() => {});
    } catch (_) {}
}

function playGoodjobClick() {
    try {
        const volume = window.echoShareGetSetting ? Number(window.echoShareGetSetting("click") ?? 65) : 65;
        const master = window.echoShareGetSetting ? Number(window.echoShareGetSetting("master") ?? 100) : 100;
        if (!clickSound || volume <= 0 || master <= 0) return;
        clickSound.volume = Math.max(0, Math.min(1, (volume / 100) * (master / 100)));
        clickSound.currentTime = 0;
        const p = clickSound.play();
        if (p?.catch) p.catch(() => {});
    } catch (_) {}
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
    playLoadingSound();

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
        "green-profile",
        "Custom-profile"
    );
if (profile.theme === "red") {
    profilePage.classList.add("red-profile");
}

if (profile.theme === "purple") {
    profilePage.classList.add("purple-profile");
}

if (profile.theme === "Custom") {
    profilePage.classList.add("Custom-profile");
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
const chatAvatarUploadButton = document.getElementById("chatAvatarUploadButton");
const chatBadgeUploadButton = document.getElementById("chatBadgeUploadButton");
const chatAvatarFileInput = document.getElementById("chatAvatarFileInput");
const chatBadgeFileInput = document.getElementById("chatBadgeFileInput");
const chatEffectInput = document.getElementById("chatEffectInput");
const chatBackgroundInput = document.getElementById("chatBackgroundInput");
const chatMediaButton = document.getElementById("chatMediaButton");
const chatMediaInput = document.getElementById("chatMediaInput");
const chatReactionFileInput = document.getElementById("chatReactionFileInput");
const chatMalfunctionOptions = document.getElementById("chatMalfunctionOptions");
const malfunctionToolsGrid = document.getElementById("malfunctionToolsGrid");
const malfunctionMediaButton = document.getElementById("malfunctionMediaButton");
const malfunctionMediaInput = document.getElementById("malfunctionMediaInput");
const malfunctionMediaOverlay = document.getElementById("malfunctionMediaOverlay");
const malfunctionMediaPreview = document.getElementById("malfunctionMediaPreview");
const malfunctionMediaTitle = document.getElementById("malfunctionMediaTitle");
const malfunctionTestButton = document.getElementById("malfunctionTestButton");
const malfunctionAnnoyButton = document.getElementById("malfunctionAnnoyButton");
const malfunctionCancelButton = document.getElementById("malfunctionCancelButton");
const chatReplyBar = document.getElementById("chatReplyBar");
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
const CHAT_MALFUNCTION_PASSWORD = "Ink";
const CHAT_DEFAULT_AVATAR = "pngs/LadyLosi.png";

let chatAccessLevel = "normal";
let chatEditing = false;
let chatReplyTarget = null;
let chatReactionTargetId = null;

const CHAT_DEMO_USERS = [
    { username: "ECHO BOT", avatar: CHAT_DEFAULT_AVATAR, role: "SYSTEM", glow: "#9b9b9b", badge: "", bio: "Archive system bot.", bot: true },
    { username: "Shadow", avatar: CHAT_DEFAULT_AVATAR, role: "MEMBER", glow: "#8a63ff", badge: "", bio: "Watching the archive." },
    { username: "Writer///Tea", avatar: CHAT_DEFAULT_AVATAR, role: "WRITER", glow: "#39ff88", badge: "", bio: "Writing the records." }
];

function isElevatedAccess(){ return chatAccessLevel === "special" || chatAccessLevel === "malfunction"; }
function isMalfunctionAccess(){ return chatAccessLevel === "malfunction"; }
function roleForAccess(access){ return access === "malfunction" ? "MALFUNCTION" : access === "special" ? "SPECIAL / ADMIN" : "MEMBER"; }

const MALFUNCTION_TOOLS = [
  ["chaos-glow","CHAOS GLOW"],["name-distort","NAME DISTORTION"],["eye-sigil","EYE SIGIL"],["screen-static","SCREEN STATIC"],
  ["rgb-shift","RGB SHIFT"],["message-shake","MESSAGE SHAKE"],["neon-scan","NEON SCAN"],["dark-invert","DARK INVERT"],
  ["orbit-ring","ORBIT RING"],["ghost-trail","GHOST TRAIL"],["chromatic-burst","CHROMATIC BURST"],["void-pulse","VOID PULSE"],
  ["terminal-rain","TERMINAL RAIN"],["cursor-glitch","CURSOR GLITCH"],["redline","REDLINE"],["starfall","STARFALL"],
  ["echo-clone","ECHO CLONE"],["heat-haze","HEAT HAZE"],["pixel-tear","PIXEL TEAR"],["bloom-surge","BLOOM SURGE"],
  ["shadow-pulse","SHADOW PULSE"],["lens-flare","LENS FLARE"],["afterimage","AFTERIMAGE"],["color-cycle","COLOR CYCLE"],
  ["edge-glow","EDGE GLOW"],["noise-overlay","NOISE OVERLAY"],["orbit-sparks","ORBIT SPARKS"],["blackout-flash","BLACKOUT FLASH"],
  ["killfeed-mode","KILLFEED MODE"],["profile-distortion","PROFILE DISTORTION"],["banner-ripple","BANNER RIPPLE"],["message-warp","MESSAGE WARP"],
  ["eye-blink","EYE BLINK"],["malfunction-core","MALFUNCTION CORE"]
];
function defaultMalfunctionTools(){ const o={}; MALFUNCTION_TOOLS.forEach(([k])=>o[k]=false); return o; }
function renderMalfunctionTools(profile){
  if(!malfunctionToolsGrid)return;
  const active=profile?.malfunctionTools||{};
  malfunctionToolsGrid.innerHTML=MALFUNCTION_TOOLS.map(([key,label])=>`<label class="malfunction-tool"><input type="checkbox" data-malfunction-tool="${key}" ${active[key]?'checked':''}><span>${label}</span></label>`).join('');
  malfunctionToolsGrid.querySelectorAll('[data-malfunction-tool]').forEach(el=>el.addEventListener('change',()=>{
    const p=getChatProfile()||{}; p.malfunctionTools=p.malfunctionTools||defaultMalfunctionTools(); p.malfunctionTools[el.dataset.malfunctionTool]=el.checked; saveChatProfile(p); scheduleProfileAutosave();
  }));
}

function getChatProfile() {
    try {
        return JSON.parse(localStorage.getItem("echoChatProfile") || "null");
    } catch (_) {
        return null;
    }
}

function saveChatProfile(profile) {
    const remember = window.echoShareGetSetting ? window.echoShareGetSetting("remember") !== false : true;
    if (remember) localStorage.setItem("echoChatProfile", JSON.stringify(profile));
    else localStorage.removeItem("echoChatProfile");
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

    if (password !== CHAT_NORMAL_PASSWORD && password !== CHAT_SPECIAL_PASSWORD && password !== CHAT_MALFUNCTION_PASSWORD) {
        chatAuthMessage.textContent = "ACCESS DENIED — INVALID PASSWORD.";
        chatPasswordInput.value = "";
        chatPasswordInput.focus();
        return;
    }

    chatAccessLevel = password === CHAT_MALFUNCTION_PASSWORD ? "malfunction" : password === CHAT_SPECIAL_PASSWORD ? "special" : "normal";
    chatAuthMessage.textContent = "ACCESS GRANTED.";

    const existing = getChatProfile();
    if (existing) {
        existing.access = chatAccessLevel;
        existing.role = roleForAccess(chatAccessLevel);
        if(chatAccessLevel === "malfunction" && (!existing.effect || existing.effect === "normal")) existing.effect = "you-and-i-forever";
        existing.malfunctionTools ||= defaultMalfunctionTools();
        saveChatProfile(existing);
        openChat();
        return;
    }

    chatEditing = false;
    chatSpecialOptions.hidden = !isElevatedAccess();
    chatMalfunctionOptions.hidden = !isMalfunctionAccess();
    chatUsernameInput.value = "";
    chatAvatarInput.value = "";
    chatBioInput.value = "";
    chatTagsInput.value = "";
    chatGlowInput.value = "#ff2d2d";
    chatBadgeInput.value = "";
    chatEffectInput.value = chatAccessLevel === "malfunction" ? "you-and-i-forever" : "red-pulse";
    renderMalfunctionTools({malfunctionTools:defaultMalfunctionTools()});
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
    chatBackgroundInput.value = profile.chatBackground || "";
    chatEffectInput.value = profile.effect || (profile.access === "malfunction" ? "you-and-i-forever" : "red-pulse");
    chatSpecialOptions.hidden = !isElevatedAccess();
    chatMalfunctionOptions.hidden = profile.access !== "malfunction";
    renderMalfunctionTools(profile);
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

function renderMe(profile){
  chatMeCard.style.setProperty("--chat-glow", profile.glow || "#39ff88");
  chatMeCard.dataset.effect=profile.effect||"normal";
  chatMeCard.className='chat-me-card '+(profile.access==='malfunction'?'malfunction-profile ':'')+String(profile.effect||'normal');
  (profile.malfunctionTools?Object.keys(profile.malfunctionTools).filter(k=>profile.malfunctionTools[k]):[]).forEach(k=>chatMeCard.classList.add('mf-'+k));
  chatMeCard.classList.toggle('angelic-praise',profile.effect==='angelic-praise' && profile.access==='malfunction');
  chatMeCard.innerHTML=`<div class="angelic-profile-aura" aria-hidden="true"></div><img class="chat-me-avatar" src="${escapeText(profile.avatar||CHAT_DEFAULT_AVATAR)}" alt=""><div class="chat-me-name">${escapeText(profile.username)} ${profile.badge?`<img class="chat-badge" src="${escapeText(profile.badge)}" alt="badge">`:""}</div><div class="chat-me-role">${escapeText(profile.role||"MEMBER")}</div><div class="chat-me-bio">${escapeText(profile.bio||"No bio added.")}</div>`;
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
    article.className = `chat-message ${message.bot ? "bot" : ""} ${message.effect || ""} ${message.chatBackground ? "has-chat-background" : ""}`;
    article.style.setProperty("--chat-glow", message.glow || "#ff3030");
    if(message.chatBackground) article.style.setProperty("--chat-card-bg", `url("${String(normalizeChatImageInput(message.chatBackground)).replaceAll('\"','')}")`);
    article.dataset.messageId = message.id || "";

    const canManage = !message.bot && chatAccessLevel === "special";
    const imagePart = message.image ? `<img class="chat-message-image" src="${escapeText(message.image)}" alt="Chat image" loading="lazy">` : "";
    const badgePart = message.badge ? `<img class="chat-badge" src="${escapeText(message.badge)}" alt="badge">` : "";
    const actions = canManage ? `<div class="chat-message-actions"><button data-action="delete">DELETE</button><button data-action="kick">REMOVE USER</button></div>` : "";

    article.innerHTML = `${message.chatBackground ? '<div class="chat-message-background" aria-hidden="true"></div>' : ''}${message.effect === 'angelic-praise' ? '<div class="angelic-message-aura" aria-hidden="true"></div>' : ''}
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
    const enterSends = window.echoShareGetSetting ? window.echoShareGetSetting("enterSend") !== false : true;
    if (enterSends && event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatSendButton.click();
    }
});
chatMediaButton?.addEventListener('click',()=>chatMediaInput?.click());
chatMediaInput?.addEventListener('change',()=>{const f=chatMediaInput.files?.[0];handleChatMediaFile(f);chatMediaInput.value='';});
chatReactionFileInput?.addEventListener('change',()=>{const f=chatReactionFileInput.files?.[0];handleReactionFile(f);chatReactionFileInput.value='';});
chatAvatarUploadButton?.addEventListener('click',()=>chatAvatarFileInput?.click());
chatBadgeUploadButton?.addEventListener('click',()=>chatBadgeFileInput?.click());
chatAvatarFileInput?.addEventListener('change',()=>{const f=chatAvatarFileInput.files?.[0];handleAvatarFile(f);chatAvatarFileInput.value='';});
chatBadgeFileInput?.addEventListener('change',()=>{const f=chatBadgeFileInput.files?.[0];handleBadgeFile(f);chatBadgeFileInput.value='';});


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
  ["red-pulse","Red Pulse"],["angelic-praise","ANGELIC PRAISE • INK ONLY"],["star-mid","STAR-MID • Starlight Aura"],["you-and-i-forever","YOU AND I FOREVER • MALFUNCTION"],["blood-glitch","Blood Glitch"],["crimson-flare","Crimson Flare"],
  ["inferno","Inferno"],["blood-moon","Blood Moon"],["hellfire","Hellfire"],["void-rift","Void Rift"],["soul-burn","Soul Burn"],["demon-aura","Demon Aura"],["red-lightning","Red Lightning"],
  ["nightmare","Nightmare"],["omega-red","Omega Red"],["red-singularity","Red Singularity"],["cursed-crown","Cursed Crown"],["apocalypse","Apocalypse"],["scarlet-storm","Scarlet Storm"],["crimson-rain","Crimson Rain"],["blood-surge","Blood Surge"],["hell-gate","Hell Gate"],["abyssal-glow","Abyssal Glow"],
  ["dark-flame","Dark Flame"],["soul-shatter","Soul Shatter"],["phantom-red","Phantom Red"],["executioner","Executioner"],["war-drum","War Drum"],["berserker","Berserker"],["rage-core","Rage Core"],["devil-mark","Devil Mark"],["red-curse","Red Curse"],["grave-light","Grave Light"],
  ["dead-star","Dead Star"],["red-eclipse","Red Eclipse"],["blood-orbit","Blood Orbit"],["chaos-ripple","Chaos Ripple"],["hell-wave","Hell Wave"],["infernal-runes","Infernal Runes"],["crimson-ghost","Crimson Ghost"],["soul-chain","Soul Chain"],["dark-matter-red","Dark Matter"],["warped-reality","Warped Reality"],
  ["red-aurora","Red Aurora"],["cursed-static","Cursed Static"],["dragon-blood","Dragon Blood"],["demon-heart","Demon Heart"],["fatal-error","Fatal Error"],["scarlet-void","Scarlet Void"],["apex-blood","Apex Blood"],["king-of-hell","King of Hell"],["last-breath","Last Breath"],["endless-night","Endless Night"]
];

const SEASON_CODES = {
  "SSML-RULES": [["halloween-pumpkin","PUMPKIN CURSE"],["halloween-fog","GRAVEYARD FOG"],["halloween-candy","CANDY GORE"]],
  "SSML-HALLOW-NIGHTS": [["halloween-jack","JACK-O-LANTERN"],["halloween-ghosts","GHOST PARADE"],["halloween-witchfire","WITCHFIRE"]],
  "SSML-NO-COMPANY": [["halloween-static","HAUNTED STATIC"],["halloween-reaper","REAPER BELL"],["halloween-harvest","BLOOD HARVEST"]]
};
const SEASON_EFFECT_MAP=Object.fromEntries(Object.values(SEASON_CODES).flat());
function getUnlockedSeasonEffects(){try{return JSON.parse(localStorage.getItem('echoShareSeasonEffects')||'[]')}catch(_){return []}}
function saveUnlockedSeasonEffects(v){localStorage.setItem('echoShareSeasonEffects',JSON.stringify([...new Set(v)]))}
function initSeasonCodes(){
 const input=document.getElementById('seasonCodeInput'),btn=document.getElementById('seasonCodeRedeem'),status=document.getElementById('seasonCodeStatus'),list=document.getElementById('seasonUnlockedList'); if(!input||!btn)return;
 function draw(){const u=getUnlockedSeasonEffects();list.innerHTML=u.length?`<span class="season-unlocked-label">UNLOCKED:</span> ${u.map(k=>`<span class="season-chip">${escapeText(SEASON_EFFECT_MAP[k]||k)}</span>`).join('')}`:'<span class="season-unlocked-label">No seasonal effects unlocked yet.</span>'}
 function redeem(){const code=input.value.trim().toUpperCase(),effects=SEASON_CODES[code];if(!effects){status.textContent='CODE INVALID OR NOT AVAILABLE.';status.className='code-redeem-status bad';return}const unlocked=getUnlockedSeasonEffects(),added=effects.map(x=>x[0]).filter(x=>!unlocked.includes(x));if(!added.length){status.textContent='THIS CODE IS ALREADY REDEEMED IN THIS BROWSER.';status.className='code-redeem-status';return}saveUnlockedSeasonEffects([...unlocked,...added]);status.textContent=`CODE ACCEPTED — ${added.length} HALLOW NIGHT EFFECTS UNLOCKED.`;status.className='code-redeem-status good';input.value='';draw();fillSpecialEffects()}
 btn.addEventListener('click',redeem);input.addEventListener('keydown',e=>{if(e.key==='Enter')redeem()});draw();
}

function fillSpecialEffects(){
  if(!chatEffectInput) return;
  const current=chatEffectInput.value;
  const unlocked=getUnlockedSeasonEffects(); const effects=CHAT_EFFECTS_50.filter(x=>x[0]!=="you-and-i-forever" || isMalfunctionAccess()).concat(unlocked.map(k=>[k,SEASON_EFFECT_MAP[k]||k]).filter(x=>!CHAT_EFFECTS_50.some(e=>e[0]===x[0])));
  chatEffectInput.innerHTML=effects.map(([v,n])=>`<option value="${v}">${n}</option>`).join("");
  chatEffectInput.value=effects.some(x=>x[0]===current)?current:(isMalfunctionAccess()?"you-and-i-forever":"red-pulse");
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
  const password=window.chat90Password || (getChatProfile()?.access === "malfunction" ? CHAT_MALFUNCTION_PASSWORD : getChatProfile()?.access === "special" ? CHAT_SPECIAL_PASSWORD : CHAT_NORMAL_PASSWORD);
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
      chatAccessLevel=packet.malfunction?"malfunction":packet.special?"special":"normal";
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
      if(packet.message && packet.message.username!==getChatProfile()?.username && !packet.message.bot){
        showChatNotification(packet.message.username, packet.message.text || (packet.message.mediaType==="video"?"sent a video":packet.message.mediaType==="gif"?"sent a GIF":"sent an image"), packet.message.glow);
        playChatNotificationSound();
      }
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

    if(packet.type==="profileUpdated"){
      if(packet.profile){const name=packet.profile.username;const oldName=packet.previousUsername;chatOnlineProfiles=chatOnlineProfiles.map(p=>(p.username===name||p.username===oldName)?{...p,...packet.profile}:p);chatServerMessages=chatServerMessages.map(m=>(m.username===name||m.username===oldName)?{...m,...packet.profile}:m);if(getChatProfile()?.username===name)saveChatProfile({...getChatProfile(),...packet.profile});renderGlobalChat(false);}return;
    }
    if(packet.type==="reaction"){const msg=chatServerMessages.find(m=>m.id===packet.messageId);if(msg)msg.reactions=packet.reactions||[];renderGlobalChat(false);return;}

    if(packet.type==="malfunctionBroadcast"){
      if(packet.media) playMalfunctionBroadcast({data:packet.media,type:packet.mediaType||'video',name:packet.name||'MALFUNCTION'},true);
      return;
    }

    if(packet.type==="deleted"){
      chatServerMessages=chatServerMessages.filter(x=>x.id!==packet.id);
      renderGlobalChat();
      return;
    }

    if(packet.type==="friends"){
      window.chatFriends=Array.isArray(packet.friends)?packet.friends:[];
      renderSocialPanel();
      return;
    }
    if(packet.type==="friendNotice"){
      showChatNotification(packet.username, packet.added ? "added you as a friend" : "removed you from friends");
      try{playChatNotificationSound();}catch(_){}
      return;
    }
    if(packet.type==="dm"){
      if(packet.message) {
        if(!window.chatDMHistory) window.chatDMHistory=[];
        window.chatDMHistory.push(packet.message);
        window.chatDMHistory=window.chatDMHistory.slice(-200);
        if(window.chatDMTarget && (packet.message.from===window.chatDMTarget || packet.message.to===window.chatDMTarget)) renderDMHistory();
        if(packet.message.from!==getChatProfile()?.username) { showChatNotification(packet.message.from,"sent you a private message"); playChatNotificationSound(); }
      }
      return;
    }
    if(packet.type==="dmHistory"){
      window.chatDMTarget=packet.with;
      window.chatDMHistory=Array.isArray(packet.messages)?packet.messages:[];
      renderDMHistory();
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
  if(password!==CHAT_NORMAL_PASSWORD && password!==CHAT_SPECIAL_PASSWORD && password!==CHAT_MALFUNCTION_PASSWORD){ chatAuthMessage.textContent='ACCESS DENIED — INVALID PASSWORD.'; chatPasswordInput.value=''; chatPasswordInput.focus(); return; }
  window.chat90Password=password;
  chatAccessLevel=password===CHAT_MALFUNCTION_PASSWORD?'malfunction':password===CHAT_SPECIAL_PASSWORD?'special':'normal';
  chatSpecialOptions.hidden=!isElevatedAccess(); chatMalfunctionOptions.hidden=!isMalfunctionAccess(); if(malfunctionAnnoyButton)malfunctionAnnoyButton.hidden=!isMalfunctionAccess();
  fillSpecialEffects();
  const rememberProfile = window.echoShareGetSetting ? window.echoShareGetSetting("remember") !== false : true;
  const existing=rememberProfile ? getChatProfile() : null;
  if(existing){ existing.access=chatAccessLevel; existing.role=roleForAccess(chatAccessLevel); if(chatAccessLevel==='malfunction' && (!existing.effect||existing.effect==='normal')) existing.effect='you-and-i-forever'; existing.malfunctionTools ||= defaultMalfunctionTools(); saveChatProfile(existing); openChat(); return; }
  chatEditing=false; chatUsernameInput.value=''; chatAvatarInput.value=''; chatBioInput.value=''; chatTagsInput.value=''; chatGlowInput.value='#ff2d2d'; chatBadgeInput.value=''; chatBackgroundInput.value=''; chatEffectInput.value=chatAccessLevel==='malfunction'?'you-and-i-forever':'red-pulse'; renderMalfunctionTools({malfunctionTools:defaultMalfunctionTools()}); showOnly(chatSetupPage); chatUsernameInput.focus();
}
function enterChat(){
  const username=chatUsernameInput.value.trim(); if(!username) return chatUsernameInput.focus();
  const profile={username:username.slice(0,24),avatar:chatAvatarInput.value.trim()||CHAT_DEFAULT_AVATAR,bio:chatBioInput.value.trim().slice(0,160),tags:chatTagsInput.value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12),access:chatAccessLevel,role:roleForAccess(chatAccessLevel),glow:isElevatedAccess()?(chatGlowInput.value.trim()||'#ff2d2d'):'#39ff88',badge:chatBadgeInput.value.trim(),effect:(isMalfunctionAccess()||chatEffectInput.value!=='angelic-praise')&&isElevatedAccess()?chatEffectInput.value:'normal',chatBackground:normalizeChatImageInput(chatBackgroundInput?.value.trim()||''),malfunctionTools:isMalfunctionAccess()?defaultMalfunctionTools():{}};
  saveChatProfile(profile); chatEditing=false; openChat();
}
function openChat(){
  const profile=getChatProfile();
  if(!profile) return openChatAuth();
  chatManualClose=false;
  chatAccessLevel=profile.access==='malfunction'?'malfunction':profile.access==='special'?'special':'normal';
  showOnly(chatPage);
  renderMe(profile);
  chatMessages.innerHTML='';
  window.chat90Password=window.chat90Password || (profile.access==='malfunction'?CHAT_MALFUNCTION_PASSWORD:profile.access==='special'?CHAT_SPECIAL_PASSWORD:CHAT_NORMAL_PASSWORD);
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

function renderGlobalChat(forceBottom=false){
  if(chatPage.hidden) return;
  const wasNearBottom=chatMessages.scrollHeight-chatMessages.scrollTop-chatMessages.clientHeight<80;
  renderGlobalUsers(); renderMe(getChatProfile()||{}); chatMessages.innerHTML=''; chatServerMessages.forEach(renderMessage);
  if(forceBottom||wasNearBottom) chatMessages.scrollTop=chatMessages.scrollHeight;
}

function renderMessage(message){
  const article=document.createElement('article');
  const isSpecialMessage=String(message.role||'').toUpperCase().includes('SPECIAL')||String(message.role||'').toUpperCase().includes('MALFUNCTION')||(message.effect&&message.effect!=='normal');
  const malfunctionClasses=message.malfunctionTools&&typeof message.malfunctionTools==='object'?Object.keys(message.malfunctionTools).filter(k=>message.malfunctionTools[k]).map(k=>'mf-'+k).join(' '):'';
  article.className=`chat-message ${message.bot?'bot':''} ${isSpecialMessage?'special-message':''} ${message.effect||''} ${malfunctionClasses}`; article.dataset.effect=message.effect||'normal'; article.style.setProperty('--chat-glow',message.glow||'#ff3030'); article.dataset.messageId=message.id||'';
  const badge=message.badge?`<img class="chat-badge" src="${escapeText(message.badge)}" alt="badge">`:''; const angelic=message.effect==='angelic-praise'&&String(message.role||'').toUpperCase().includes('MALFUNCTION');
  const manage=isElevatedAccess()&&!message.bot?`<div class="chat-message-actions"><button data-action="delete">DELETE</button><button data-action="kick">REMOVE USER</button></div>`:'';
  const reply=message.replyTo?`<div class="chat-reply-preview"><b>↪ ${escapeText(message.replyTo.username||'USER')}</b><span>${escapeText(message.replyTo.text||'[MEDIA]')}</span></div>`:'';
  const media=message.media?`<div class="chat-message-media">${message.mediaType==='video'?`<video controls preload="metadata" ${window.echoShareGetSetting?.('autoplay')!==false?'autoplay':''} playsinline src="${escapeText(message.media)}"></video>`:`<img src="${escapeText(message.media)}" alt="Shared media" loading="lazy">`}</div>`:'';
  const legacyImage=message.image?`<img class="chat-message-image" src="${escapeText(message.image)}" alt="Chat image" loading="lazy">`:''; const legacyGif=message.gif?`<img class="chat-message-image" src="${escapeText(message.gif)}" alt="GIF" loading="lazy">`:'';
  const reactions=Array.isArray(message.reactions)?message.reactions:[]; const reactionThumb=reactions.length?`<span class="chat-reaction-count"><img src="${escapeText(reactions[reactions.length-1].url)}" alt=""> ${reactions.length}</span>`:''; const miniStar=message.effect==='star-mid'?'<span class="message-mini-star" aria-hidden="true">★</span>':message.effect==='you-and-i-forever'?'<span class="message-mini-eye" aria-hidden="true">◉</span>':''; const cardBackground=message.chatBackground?`<div class="chat-message-background" style="background-image:url('${escapeText(message.chatBackground)}')"></div>`:'';
  article.innerHTML=`${cardBackground}${angelic?'<div class="angelic-message-aura" aria-hidden="true"></div>':''}<div class="chat-message-head"><button class="chat-message-identity" type="button"><img class="chat-message-avatar" src="${escapeText(message.avatar||CHAT_DEFAULT_AVATAR)}" alt=""><span class="chat-message-name">${escapeText(message.username)}</span></button>${badge}<span class="chat-message-role">${escapeText(message.role||'MEMBER')}</span><span class="chat-message-time">${escapeText(new Date(message.time||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}</span></div>${reply}<div class="chat-message-body">${escapeText(message.text||'')}${miniStar}</div>${media}${legacyImage}${legacyGif}<div class="chat-message-tools"><button class="chat-tool-button" data-action="reply">↩ REPLY</button><button class="chat-tool-button" data-action="react">☆ GIF REACT</button>${reactionThumb}</div>${manage}`;
  article.querySelector('.chat-message-identity').addEventListener('click',()=>showViewedProfile(chatOnlineProfiles.find(p=>p.username===message.username)||{username:message.username,avatar:message.avatar,role:message.role,glow:message.glow,badge:message.badge,effect:message.effect,chatBackground:message.chatBackground,tags:[],bio:'',joined:''})); article.querySelector('[data-action="reply"]')?.addEventListener('click',()=>startChatReply(message)); article.querySelector('[data-action="react"]')?.addEventListener('click',()=>openReactionPicker(message.id)); article.querySelector('[data-action="delete"]')?.addEventListener('click',()=>wsSend({type:'delete',id:message.id})); article.querySelector('[data-action="kick"]')?.addEventListener('click',()=>wsSend({type:'kick',username:message.username})); chatMessages.appendChild(article);
}

function sendChatMessage(text,extra={}){
  const p=getChatProfile(); if(!p)return; const cleanText=String(text||'').trim(); const packet={type:'message',text:cleanText,...extra}; if(chatReplyTarget)packet.replyTo={id:chatReplyTarget.id,username:chatReplyTarget.username,text:chatReplyTarget.text||'[MEDIA]'}; if(!cleanText&&!extra.image&&!extra.gif&&!extra.media)return; wsSend(packet); clearChatReply();
}
function deleteChatMessage(id){wsSend({type:'delete',id});}
function kickCurrentUser(username){wsSend({type:'kick',username:username||getChatProfile()?.username});}
function sendImagePrompt(){chatMediaInput?.click();}
function sendGifPrompt(){chatMediaInput?.click();}
function startChatReply(message){chatReplyTarget=message;if(chatReplyBar){chatReplyBar.hidden=false;chatReplyBar.innerHTML=`<span>↩ Replying to <b>${escapeText(message.username)}</b>: ${escapeText(message.text||'[MEDIA]')}</span><button type="button" id="cancelChatReply">×</button>`;document.getElementById('cancelChatReply')?.addEventListener('click',clearChatReply);}chatMessageInput.focus();}
function clearChatReply(){chatReplyTarget=null;if(chatReplyBar){chatReplyBar.hidden=true;chatReplyBar.innerHTML='';}}
function openReactionPicker(id){chatReactionTargetId=id;chatReactionFileInput?.click();}
function readFileAsDataURL(file,maxBytes){return new Promise((resolve,reject)=>{if(!file)return reject(new Error('No file'));if(file.size>maxBytes)return reject(new Error('File too large'));const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('File read failed'));r.readAsDataURL(file);});}
async function handleChatMediaFile(file){if(!file)return;try{const data=await readFileAsDataURL(file,8*1024*1024);const isVideo=file.type.startsWith('video/');const isGif=file.type==='image/gif'||file.name.toLowerCase().endsWith('.gif');sendChatMessage('',{media:data,mediaType:isVideo?'video':(isGif?'gif':'image')});}catch(e){alert(e.message==='File too large'?'MEDIA FILE IS TOO LARGE — 8 MB MAX.':'Could not read that file.');}}
async function handleReactionFile(file){if(!file||!chatReactionTargetId)return;try{const data=await readFileAsDataURL(file,4*1024*1024);wsSend({type:'reaction',messageId:chatReactionTargetId,url:data});}catch(e){alert(e.message==='File too large'?'REACTION GIF IS TOO LARGE — 4 MB MAX.':'Could not read that GIF.');}chatReactionTargetId=null;}
let malfunctionPendingMedia=null; let malfunctionOverlayTimer=null;
async function handleMalfunctionMediaFile(file){if(!file||!isMalfunctionAccess())return;try{const data=await readFileAsDataURL(file,15*1024*1024);const type=file.type.startsWith('video/')?'video':'image';malfunctionPendingMedia={data,type,name:file.name};showMalfunctionMediaOverlay(false);}catch(e){alert(e.message==='File too large'?'MALFUNCTION MEDIA IS TOO LARGE — 15 MB MAX.':'Could not read that media.');}}
function closeMalfunctionMedia(){clearMalfunctionBroadcastState();}
function showMalfunctionMediaOverlay(blockChat=true){if(!malfunctionPendingMedia||!malfunctionMediaOverlay)return;malfunctionMediaOverlay.hidden=false;malfunctionMediaTitle.textContent=malfunctionPendingMedia.type==='video'?'VIDEO LOADED':'IMAGE LOADED';malfunctionMediaPreview.innerHTML=malfunctionPendingMedia.type==='video'?`<video id="malfunctionPreviewVideo" controls autoplay playsinline src="${escapeText(malfunctionPendingMedia.data)}"></video>`:`<img src="${escapeText(malfunctionPendingMedia.data)}" alt="Malfunction media preview">`;malfunctionMediaOverlay.dataset.blockChat=blockChat?'1':'0';}
function clearMalfunctionBroadcastState(){clearTimeout(malfunctionOverlayTimer);chatPage?.classList.remove('malfunction-playing');if(malfunctionMediaOverlay){malfunctionMediaOverlay.hidden=true;malfunctionMediaOverlay.dataset.blockChat='0';}if(malfunctionMediaPreview)malfunctionMediaPreview.innerHTML='';malfunctionPendingMedia=null;}
function playMalfunctionBroadcast(media,remote=false){if(!media?.data||!malfunctionMediaOverlay)return;clearMalfunctionBroadcastState();malfunctionPendingMedia={data:media.data,type:media.type||'video',name:media.name||'MALFUNCTION'};malfunctionMediaOverlay.hidden=false;malfunctionMediaOverlay.dataset.blockChat=remote?'1':'0';malfunctionMediaTitle.textContent=remote?'MALFUNCTION BROADCAST':'TEST PLAYBACK';malfunctionMediaPreview.innerHTML=malfunctionPendingMedia.type==='video'?`<video id="malfunctionPreviewVideo" autoplay controls playsinline preload="auto" src="${escapeText(malfunctionPendingMedia.data)}"></video>`:`<img src="${escapeText(malfunctionPendingMedia.data)}" alt="Malfunction broadcast">`;if(remote)chatPage.classList.add('malfunction-playing');const v=document.getElementById('malfunctionPreviewVideo');if(v){const finish=()=>clearMalfunctionBroadcastState();v.addEventListener('ended',finish,{once:true});v.addEventListener('error',finish,{once:true});v.addEventListener('abort',finish,{once:true});v.addEventListener('emptied',finish,{once:true});const attempt=v.play();if(attempt?.catch)attempt.catch(()=>{if(remote)clearMalfunctionBroadcastState();});}else{malfunctionOverlayTimer=setTimeout(clearMalfunctionBroadcastState,5000);}}
malfunctionMediaButton?.addEventListener('click',()=>malfunctionMediaInput?.click());
malfunctionMediaInput?.addEventListener('change',()=>{const f=malfunctionMediaInput.files?.[0];handleMalfunctionMediaFile(f);malfunctionMediaInput.value='';});
malfunctionCancelButton?.addEventListener('click',closeMalfunctionMedia);
malfunctionTestButton?.addEventListener('click',()=>{if(malfunctionPendingMedia)playMalfunctionBroadcast(malfunctionPendingMedia,false);});
malfunctionAnnoyButton?.addEventListener('click',()=>{if(malfunctionPendingMedia){wsSend({type:'malfunctionBroadcast',media:malfunctionPendingMedia.data,mediaType:malfunctionPendingMedia.type,name:malfunctionPendingMedia.name});playMalfunctionBroadcast(malfunctionPendingMedia,true);}});

async function handleAvatarFile(file){if(!file)return;try{chatAvatarInput.value=await readFileAsDataURL(file,3*1024*1024);saveProfileFromForm(true);}catch(e){alert(e.message==='File too large'?'PROFILE IMAGE IS TOO LARGE — 3 MB MAX.':'Could not read that image.');}}
async function handleBadgeFile(file){if(!file)return;try{chatBadgeInput.value=await readFileAsDataURL(file,2*1024*1024);saveProfileFromForm(true);}catch(e){alert(e.message==='File too large'?'BADGE IS TOO LARGE — 2 MB MAX.':'Could not read that image.');}}
function normalizeChatImageInput(value){
  const v=String(value||'').trim();
  if(!v)return '';
  if(/^\d+$/.test(v)) return `https://www.roblox.com/asset-thumbnail/image?assetId=${v}&width=1024&height=576&format=png`;
  return v;
}
function saveProfileFromForm(silent=false){const username=chatUsernameInput.value.trim();if(!username)return;const old=getChatProfile()||{};const profile={username:username.slice(0,24),avatar:chatAvatarInput.value.trim()||CHAT_DEFAULT_AVATAR,bio:chatBioInput.value.trim().slice(0,160),tags:chatTagsInput.value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12),access:chatAccessLevel,role:roleForAccess(chatAccessLevel),glow:isElevatedAccess()?(chatGlowInput.value.trim()||'#ff2d2d'):'#39ff88',badge:chatBadgeInput.value.trim(),chatBackground:normalizeChatImageInput(chatBackgroundInput?.value.trim()||''),effect:isElevatedAccess()?(isMalfunctionAccess()?chatEffectInput.value:(chatEffectInput.value==='angelic-praise'?'red-pulse':chatEffectInput.value)):'normal',malfunctionTools:isMalfunctionAccess()?(old.malfunctionTools||defaultMalfunctionTools()):{}};saveChatProfile(profile);window.chat90Password=profile.access==='malfunction'?CHAT_MALFUNCTION_PASSWORD:profile.access==='special'?CHAT_SPECIAL_PASSWORD:CHAT_NORMAL_PASSWORD;if(chatAuthenticated)wsSend({...profile,type:'profile',tags:profile.tags});if(!silent)openChat();}

let chatProfileSaveTimer=null;
function scheduleProfileAutosave(){
  if(!chatEditing||!isElevatedAccess()) return;
  clearTimeout(chatProfileSaveTimer);
  chatProfileSaveTimer=setTimeout(()=>saveProfileFromForm(true),450);
}
[chatGlowInput,chatBadgeInput,chatBackgroundInput,chatAvatarInput,chatBioInput,chatTagsInput,chatEffectInput].filter(Boolean).forEach(el=>{
  el.addEventListener('input',scheduleProfileAutosave);
  el.addEventListener('change',scheduleProfileAutosave);
});
chatUsernameInput?.addEventListener('change',scheduleProfileAutosave);

function showViewedProfile(profile){
  if(!profile) return;
  const history=chatServerMessages.filter(m=>!m.bot&&m.username===profile.username).slice(-30).reverse();
  chatViewedProfile.innerHTML=`<div class="viewed-profile-hero ${profile.access==='malfunction'?'malfunction-profile-hero ':''}${profile.effect==='angelic-praise'&&profile.access==='malfunction'?'angelic-profile-hero':''}" style="--chat-glow:${escapeText(profile.glow||'#ff3030')}"><img src="${escapeText(profile.avatar||CHAT_DEFAULT_AVATAR)}" alt=""><div><h2>${escapeText(profile.username)} ${profile.badge?`<img class="chat-badge" src="${escapeText(profile.badge)}">`:''}</h2><div class="viewed-role">${escapeText(profile.role||'MEMBER')}</div></div></div><div class="viewed-profile-bio">${escapeText(profile.bio||'No bio added.')}</div><div class="side-title">TAGS</div><div class="tags">${(profile.tags||[]).map(t=>`<span class="tag">${escapeText(t)}</span>`).join('')||'<span class="tag">NO TAGS</span>'}</div><div class="side-title viewed-history-title">CHAT HISTORY</div><div class="viewed-history">${history.length?history.map(m=>`<div class="viewed-history-row"><span>${escapeText(m.text|| (m.gif?'[GIF]':'[IMAGE]'))}</span><small>${escapeText(new Date(m.time||Date.now()).toLocaleString())}</small></div>`).join(''):'<div class="viewed-empty">No messages yet.</div>'}</div>`;
  chatProfileModal.hidden=false;
}

chatProfileClose.addEventListener('click',()=>chatProfileModal.hidden=true);
chatProfileModal.addEventListener('click',e=>{if(e.target===chatProfileModal) chatProfileModal.hidden=true;});


/* CHAT_90 MEDIA CLEANUP GUARD — prevents ended/failed media from locking the composer. */
document.addEventListener('ended',e=>{const el=e.target;if(el instanceof HTMLMediaElement){chatPage?.classList.remove('soundboard-playing');chatPage?.classList.remove('malfunction-playing');chatMain?.style.removeProperty('pointer-events');}},true);
document.addEventListener('error',e=>{const el=e.target;if(el instanceof HTMLMediaElement){chatPage?.classList.remove('soundboard-playing');chatPage?.classList.remove('malfunction-playing');chatMain?.style.removeProperty('pointer-events');}},true);

/* ===========================
   CHAT_90 SOCIAL / NOTIFICATION EXPERIENCE
   =========================== */
window.chatFriends = window.chatFriends || [];
window.chatDMTarget = null;
window.chatDMHistory = window.chatDMHistory || [];

const chatNotificationStack = document.getElementById("chatNotificationStack");
const chatNotificationSound = document.getElementById("chatNotificationSound");
  if (chatNotificationSound) chatNotificationSound.src = "sounds/chat-notification.mp3.mp3";
const chatDMModal = document.getElementById("chatDMModal");
const chatDMTitle = document.getElementById("chatDMTitle");
const chatDMMessages = document.getElementById("chatDMMessages");
const chatDMInput = document.getElementById("chatDMInput");
const chatDMSend = document.getElementById("chatDMSend");
const chatDMClose = document.getElementById("chatDMClose");
const chatFriendsButton = document.getElementById("chatFriendsButton");
const chatDMButton = document.getElementById("chatDMButton");
const chatSocialCard = document.getElementById("chatSocialCard");
const chatSocialList = document.getElementById("chatSocialList");

function playChatNotificationSound(){
  try{
    const st=window.echoShareGetSetting?window.echoShareGetSetting('notification'):70;
    const master=window.echoShareGetSetting?window.echoShareGetSetting('master'):100;
    if(st<=0 || master<=0) return;
    if(chatNotificationSound){ chatNotificationSound.volume=(st/100)*(master/100); chatNotificationSound.currentTime=0; const p=chatNotificationSound.play(); if(p?.catch)p.catch(()=>{}); }
    if(window.echoShareGetSetting?.('desktop') && 'Notification' in window && Notification.permission==='granted'){ new Notification('CHAT_90',{body:'New message received.'}); }
    return;
  }catch(_){}
}
function showChatNotification(username,text,glow){
  if(!chatNotificationStack)return;
  const n=document.createElement("div");n.className="chat-notification";n.style.setProperty("--n-glow",glow||"#39ff88");
  n.innerHTML=`<i class="n-dot"></i><div><b>${escapeText(username)}</b><br><span>${escapeText(text)}</span></div>`;
  chatNotificationStack.appendChild(n);setTimeout(()=>n.remove(),5200);
}
function requestFriends(){
  wsSend({type:"getFriends"});
  chatSocialCard.hidden=false; renderSocialPanel();
}
function renderSocialPanel(){
  if(!chatSocialList)return;
  const names=window.chatFriends||[];
  chatSocialList.innerHTML=names.length?names.map(n=>`<div class="chat-social-item"><b>${escapeText(n)}</b><br><button type="button" data-dm="${escapeText(n)}">MESSAGE</button><button type="button" data-friend-remove="${escapeText(n)}">REMOVE</button></div>`).join(""):'<div class="chat-social-item">No friends yet.</div>';
  chatSocialList.querySelectorAll("[data-dm]").forEach(b=>b.onclick=()=>openDM(b.dataset.dm));
  chatSocialList.querySelectorAll("[data-friend-remove]").forEach(b=>b.onclick=()=>wsSend({type:"friendToggle",username:b.dataset.friendRemove}));
}
function openDM(username){
  if(!username || username===getChatProfile()?.username)return;
  window.chatDMTarget=username; chatDMTitle.textContent=`DIRECT SIGNAL // ${username}`; chatDMModal.hidden=false;
  wsSend({type:"dmHistory",with:username}); chatDMInput.focus();
}
function renderDMHistory(){
  if(!chatDMMessages)return;
  const me=getChatProfile()?.username;
  chatDMMessages.innerHTML=(window.chatDMHistory||[]).map(m=>`<div class="chat-dm-line" style="--chat-glow:${escapeText(m.from===me?(getChatProfile()?.glow||"#39ff88"):"#8a63ff")}"><b>${escapeText(m.from)}</b><div>${escapeText(m.text)}</div><small>${escapeText(new Date(m.time).toLocaleString())}</small></div>`).join("")||'<div class="viewed-empty">No private messages yet.</div>';
  chatDMMessages.scrollTop=chatDMMessages.scrollHeight;
}
function sendDM(){
  const text=chatDMInput.value.trim(); if(!text||!window.chatDMTarget)return;
  wsSend({type:"dmSend",to:window.chatDMTarget,text});chatDMInput.value="";chatDMInput.focus();
}
chatFriendsButton?.addEventListener("click",requestFriends);
chatDMButton?.addEventListener("click",()=>{chatSocialCard.hidden=false;requestFriends();});
chatDMClose?.addEventListener("click",()=>chatDMModal.hidden=true);
chatDMModal?.addEventListener("click",e=>{if(e.target===chatDMModal)chatDMModal.hidden=true});
chatDMSend?.addEventListener("click",sendDM);
chatDMInput?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();sendDM();}});

/* High-quality profile modal: social controls + full visual hierarchy. */
showViewedProfile = function(profile){
  if(!profile)return;
  const me=getChatProfile();
  const isMe=me?.username===profile.username;
  const isFriend=(window.chatFriends||[]).includes(profile.username);
  const history=chatServerMessages.filter(m=>!m.bot&&m.username===profile.username).slice(-30).reverse();
  chatViewedProfile.innerHTML=`<div class="viewed-profile-hero ${profile.effect==='angelic-praise'&&profile.access==='malfunction'?'angelic-profile-hero':''}" style="--chat-glow:${escapeText(profile.glow||"#ff3030")}"><img src="${escapeText(profile.avatar||CHAT_DEFAULT_AVATAR)}" alt=""><div><h2>${escapeText(profile.username)} ${profile.badge?`<img class="chat-badge" src="${escapeText(profile.badge)}">`:''}</h2><div class="viewed-role">${escapeText(profile.role||'MEMBER')}</div><div class="viewed-status">${profile.effect&&profile.effect!=='normal'?`✦ ${escapeText(profile.effect)}`:'ACTIVE ON CHAT_90'}</div></div></div><div class="viewed-profile-actions">${!isMe?`<button type="button" id="viewDM">MESSAGE</button><button type="button" id="viewFriend">${isFriend?'REMOVE FRIEND':'ADD FRIEND'}</button>`:'<span>THIS IS YOUR PROFILE</span>'}</div><div class="viewed-profile-bio">${escapeText(profile.bio||'No bio added.')}</div><div class="side-title">TAGS</div><div class="tags">${(profile.tags||[]).map(t=>`<span class="tag">${escapeText(t)}</span>`).join('')||'<span class="tag">NO TAGS</span>'}</div><div class="side-title viewed-history-title">CHAT HISTORY</div><div class="viewed-history">${history.length?history.map(m=>`<div class="viewed-history-row"><span>${escapeText(m.text|| (m.mediaType==='video'?'[VIDEO]':m.gif?'[GIF]':'[MEDIA]'))}</span><small>${escapeText(new Date(m.time||Date.now()).toLocaleString())}</small></div>`).join(''):'<div class="viewed-empty">No messages yet.</div>'}</div>`;
  chatProfileModal.hidden=false;
  document.getElementById("viewDM")?.addEventListener("click",()=>{chatProfileModal.hidden=true;openDM(profile.username)});
  document.getElementById("viewFriend")?.addEventListener("click",()=>{wsSend({type:"friendToggle",username:profile.username});document.getElementById("viewFriend").textContent=isFriend?'ADD FRIEND':'REMOVE FRIEND';});
};

/* ===========================
   ECHO//SHARE UNIVERSAL SETTINGS
   =========================== */
(function initUniversalSettings(){
  const modal=document.getElementById('siteSettingsModal');
  const openers=[document.getElementById('siteSettingsButton'),document.getElementById('chatSettingsButton')].filter(Boolean);
  const close=document.getElementById('siteSettingsClose');
  if(!modal)return;
  const defaults={master:100,background:5,notification:70,click:65,animations:true,timestamps:true,autoplay:true,enterSend:true,desktop:false,profileAnimations:true,remember:true,compact:false,reduceMotion:false,backgroundOn:true};
  let settings={...defaults};
  try{settings={...defaults,...JSON.parse(localStorage.getItem('echoShareSettings')||'{}')}}catch(_){ }
  const bg=document.getElementById('backgroundNoise');
  const notif=document.getElementById('chatNotificationSound');
  const click=document.getElementById('clickSound');

  function apply(){
    const master=Math.max(0,Math.min(100,Number(settings.master)||0))/100;
    const background=Math.max(0,Math.min(100,Number(settings.background)||0))/100;
    const notification=Math.max(0,Math.min(100,Number(settings.notification)||0))/100;
    const clickVolume=Math.max(0,Math.min(100,Number(settings.click)||0))/100;
    if(bg){
      bg.loop=true;
      bg.volume=master*background;
      if(!settings.backgroundOn || bg.volume<=0){
        bg.pause();
      }else if(bg.paused){
        bg.play().then(()=>{backgroundNoiseStarted=true}).catch(()=>{});
      }
    }
    if(notif)notif.volume=master*notification;
    if(click)click.volume=master*clickVolume;
    document.body.classList.toggle('settings-compact',!!settings.compact);
    document.body.classList.toggle('settings-no-motion',!!settings.reduceMotion||!settings.profileAnimations);
    document.body.classList.toggle('settings-no-vfx',!settings.animations);
    document.body.classList.toggle('settings-no-timestamps',!settings.timestamps);
    document.body.classList.toggle('settings-no-autoplay',!settings.autoplay);
    document.body.classList.toggle('settings-no-enter-send',!settings.enterSend);
    const toggle=document.getElementById('settingToggleBackground');
    if(toggle)toggle.textContent=settings.backgroundOn?'🔊 BACKGROUND SOUND: ON':'🔇 BACKGROUND SOUND: OFF';
    [
      ['settingMasterVolume',settings.master],
      ['settingBackgroundVolume',settings.background],
      ['settingNotificationVolume',settings.notification],
      ['settingClickVolume',settings.click]
    ].forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.setAttribute('aria-valuenow',String(val));});
  }
  function save(){
    localStorage.setItem('echoShareSettings',JSON.stringify(settings));
    apply();
  }
  function syncUI(){
    const map={settingMasterVolume:'master',settingBackgroundVolume:'background',settingNotificationVolume:'notification',settingClickVolume:'click',settingAnimations:'animations',settingTimestamps:'timestamps',settingAutoplayMedia:'autoplay',settingEnterSend:'enterSend',settingDesktopNotifications:'desktop',settingProfileAnimations:'profileAnimations',settingRememberProfile:'remember',settingCompact:'compact',settingReduceMotion:'reduceMotion'};
    Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(!el)return;if(el.type==='range')el.value=settings[key];else el.checked=!!settings[key]});
    apply();
  }
  function unlockAudio(){
    apply();
    if(bg&&settings.backgroundOn&&settings.background>0)bg.play().then(()=>{backgroundNoiseStarted=true}).catch(()=>{});
  }
  document.addEventListener('pointerdown',unlockAudio,{passive:true});
  document.addEventListener('keydown',unlockAudio,{passive:true});
  openers.forEach(b=>b.addEventListener('click',()=>{syncUI();modal.hidden=false;apply()}));
  close?.addEventListener('click',()=>modal.hidden=true);
  modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
  const map={settingMasterVolume:'master',settingBackgroundVolume:'background',settingNotificationVolume:'notification',settingClickVolume:'click',settingAnimations:'animations',settingTimestamps:'timestamps',settingAutoplayMedia:'autoplay',settingEnterSend:'enterSend',settingDesktopNotifications:'desktop',settingProfileAnimations:'profileAnimations',settingRememberProfile:'remember',settingCompact:'compact',settingReduceMotion:'reduceMotion'};
  Object.entries(map).forEach(([id,key])=>{
    const el=document.getElementById(id); if(!el)return;
    const eventName=el.type==='range'?'input':'change';
    el.addEventListener(eventName,e=>{
      settings[key]=el.type==='range'?Math.max(0,Math.min(100,Number(e.target.value)||0)):e.target.checked;
      save();
      syncUI();
      if(key==='remember' && settings.remember===false) localStorage.removeItem('echoChatProfile');
    });
  });
  document.getElementById('settingToggleBackground')?.addEventListener('click',()=>{
    settings.backgroundOn=!settings.backgroundOn;
    save();
    syncUI();
  });
  document.getElementById('settingTestNotification')?.addEventListener('click',()=>{
    unlockAudio();
    if(notif && Number(settings.master)>0 && Number(settings.notification)>0){notif.volume=(Number(settings.master)/100)*(Number(settings.notification)/100);notif.currentTime=0;notif.play().catch(()=>{})}
  });
  document.getElementById('settingTestClick')?.addEventListener('click',()=>{unlockAudio();playGoodjobClick();});
  document.getElementById('settingRequestNotifications')?.addEventListener('click',async()=>{
    if('Notification' in window){try{const p=await Notification.requestPermission();settings.desktop=p==='granted';save();syncUI()}catch(_){}}
  });
  document.getElementById('settingReset')?.addEventListener('click',()=>{settings={...defaults};save();syncUI()});
  window.echoShareSettings=settings;
  window.echoShareGetSetting=k=>settings[k];
  apply();
  syncUI();
})();

initSeasonCodes();
