
const searchInput = document.getElementById("profileSearch");
const searchButton = document.getElementById("searchButton");
const searchMessage = document.getElementById("searchMessage");

const homePage = document.getElementById("homePage");
const profilePage = document.getElementById("profilePage");
const clubPage = document.getElementById("clubPage");
const clubBackButton = document.getElementById("clubBackButton");
const clubTransition = document.getElementById("clubTransition");
const clubTransitionName = document.getElementById("clubTransitionName");
let clubMusic = null;
let clubTransitionTimer = null;

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

function normalizeClubSearch(value) {
    return String(value || "")
        .trim()
        .replace(/^club\s*[:\/]?\s*/i, "")
        .toLowerCase()
        .replace(/[_\s]+/g, "-")
        .replace(/-+/g, "-");
}

function findClub(query) {
    if (typeof ECHO_CLUBS === "undefined") return null;
    const key = normalizeClubSearch(query);
    const alias = typeof ECHO_CLUB_ALIASES !== "undefined" ? ECHO_CLUB_ALIASES[key] : null;
    const target = alias || key;
    const entries = Object.entries(ECHO_CLUBS);
    const direct = entries.find(([id, club]) => {
        const names = [id, club.name, club.id].map(normalizeClubSearch);
        return names.includes(target);
    });
    return direct ? direct[1] : null;
}

function stopClubMusic() {
    if (!clubMusic) return;
    try { clubMusic.pause(); clubMusic.currentTime = 0; } catch (_) {}
    clubMusic = null;
}

function closeClubPage() {
    clearTimeout(clubTransitionTimer);
    stopClubMusic();
    if (backgroundNoise && backgroundNoise.volume > 0) backgroundNoise.play().catch(() => {});
    if (clubPage) clubPage.hidden = true;
    if (homePage) homePage.hidden = false;
    window.scrollTo({ top: 0, behavior: "instant" });
}

function playClubMusic(club) {
    stopClubMusic();
    if (!club?.music) return;
    clubMusic = new Audio(club.music);
    clubMusic.preload = "auto";
    clubMusic.loop = true;
    clubMusic.volume = 0.62;
    const promise = clubMusic.play();
    if (promise?.catch) {
        promise.catch(() => {
            const unlock = () => {
                clubMusic?.play().catch(() => {});
                document.removeEventListener("pointerdown", unlock);
                document.removeEventListener("keydown", unlock);
            };
            document.addEventListener("pointerdown", unlock, { once: true });
            document.addEventListener("keydown", unlock, { once: true });
        });
    }
}

function openClub(club) {
    if (!club || !clubPage) return;
    const glow = club.glow || "#39ffb0";
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value ?? ""; };
    const image = document.getElementById("clubImage");
    const badge = document.getElementById("clubBadge");
    const bg = document.getElementById("clubBackground");
    const hero = document.getElementById("clubHero");
    if (hero) hero.style.setProperty("--club-glow", glow);
    if (image) { image.src = club.image || "pngs/Echo.webp"; image.alt = club.name || "Club"; }
    if (bg) bg.style.backgroundImage = `url("${String(club.background || "pngs/Background image.jpg").replace(/\"/g, "")}")`;
    if (badge) {
        const badgeUrl = String(club.badge || "").trim();
        badge.hidden = !badgeUrl;
        badge.src = badgeUrl || "";
        badge.alt = badgeUrl ? `${club.name || "Club"} badge` : "";
    }
    set("clubName", club.name || "UNKNOWN CLUB");
    set("clubPath", String(club.name || "UNKNOWN").toUpperCase());
    set("clubId", club.id || "CLUB-UNKNOWN");
    set("clubFollowers", club.followers || "0");
    set("clubSupports", club.supports || "0");
    set("clubStatus", club.status || "ACTIVE");
    set("clubBio", club.bio || "No club bio has been added.");
    set("clubMusicStatus", club.music ? "CUSTOM CLUB SIGNAL // READY" : "NO CLUB MUSIC ASSIGNED");
    const tags = document.getElementById("clubTags");
    if (tags) tags.innerHTML = (Array.isArray(club.tags) ? club.tags : []).map(tag => `<span>${escapeText(tag)}</span>`).join("") || `<span>NO TAGS</span>`;

    homePage.hidden = true;
    profilePage.hidden = true;
    clubPage.hidden = false;
    if (backgroundNoise) backgroundNoise.pause();
    window.scrollTo({ top: 0, behavior: "instant" });
    playClubMusic(club);
}

function startClubSearch(query, club) {
    clearInterval(loadingTimer);
    clearTimeout(clubTransitionTimer);
    searchMessage.textContent = "";
    if (!clubTransition) return openClub(club);
    clubTransition.hidden = false;
    clubTransition.setAttribute("aria-hidden", "false");
    clubTransitionName.textContent = `ACCESSING ${(club.name || query).toUpperCase()}`;
    document.body.classList.add("club-searching");
    clubTransitionTimer = setTimeout(() => {
        openClub(club);
        clubTransition.hidden = true;
        clubTransition.setAttribute("aria-hidden", "true");
        document.body.classList.remove("club-searching");
    }, 1550);
}

function startSearch(query) {
    const raw = String(query || "").trim();
    const normalized = raw.toLowerCase();
    searchMessage.textContent = "";
    playLoadingSound();

    if (normalized === "chat_90") {
        openChatAuth();
        return;
    }

    if (/^club(?:\s|\/|:)/i.test(raw)) {
        const club = findClub(raw);
        if (!club) {
            searchMessage.textContent = `No club found for "${raw.replace(/^club(?:\s|\/|:)/i, "").trim()}". Check the club name and try again.`;
            return;
        }
        startClubSearch(raw, club);
        return;
    }

    const profile = findProfile(raw);

    if (!profile) {
        searchMessage.textContent =
            `No record found for "${raw}". Check the name and try again.`;
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
        "Lady_Losis_search-profile",
        "green-profile",
        "Custom-profile"
    );
if (profile.theme === "red") {
    profilePage.classList.add("red-profile");
}

if (profile.theme === "Lady_Losis_search") {
    profilePage.classList.add("Lady_Losis_search-profile");
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

clubBackButton?.addEventListener("click", () => {
    closeClubPage();
    searchInput.focus();
});

/* Allow ESC to return from the profile page. */
document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (clubPage && !clubPage.hidden) { closeClubPage(); searchInput.focus(); return; }
    if (!profilePage.hidden) backButton.click();
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

function isElevatedAccess(){ return chatAccessLevel === "admin"; }
function isMalfunctionAccess(){ return false; }
function roleForAccess(access){ return access === "admin" ? "ADMIN" : "MEMBER"; }


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
    if (password !== CHAT_NORMAL_PASSWORD) {
        chatAuthMessage.textContent = "ACCESS DENIED — INVALID MEMBER PASSWORD.";
        chatPasswordInput.value = "";
        chatPasswordInput.focus();
        return;
    }
    window.chat90Password = CHAT_NORMAL_PASSWORD;
    chatAccessLevel = "normal";
    chatAuthMessage.textContent = "ACCESS GRANTED.";
    const existing = getChatProfile();
    if (existing) { existing.access = existing.admin ? "admin" : "normal"; existing.role = existing.admin ? "ADMIN" : "MEMBER"; saveChatProfile(existing); openChat(); return; }
    chatEditing = false;
    chatUsernameInput.value = ""; chatAvatarInput.value = ""; chatBioInput.value = ""; chatTagsInput.value = ""; chatBadgeInput.value = ""; chatBackgroundInput.value = "";
    chatEffectInput.value = "normal";
    showOnly(chatSetupPage); chatUsernameInput.focus();
}

function enterChat() {
    const username = chatUsernameInput.value.trim();
    if (!username) return chatUsernameInput.focus();
    const old = getChatProfile() || {};
    const profile = { username:username.slice(0,24), avatar:chatAvatarInput.value.trim()||CHAT_DEFAULT_AVATAR, bio:chatBioInput.value.trim().slice(0,160), tags:chatTagsInput.value.split(',').map(t=>t.trim()).filter(Boolean).slice(0,12), access:old.admin?'admin':'normal', role:old.admin?'ADMIN':'MEMBER', glow:old.admin?'#ff3030':'#39ff88', badge:chatBadgeInput.value.trim(), effect:old.admin?(chatEffectInput?.value||'admin-core'):'normal', chatBackground:normalizeChatImageInput(chatBackgroundInput?.value.trim()||'') };
    saveChatProfile(profile); chatEditing=false; openChat();
}

function openChat() {
    const profile = getChatProfile();
    if (!profile) {
        openChatAuth();
        return;
    }

    chatAccessLevel = profile.admin ? "admin" : "normal";
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
  chatMeCard.className='chat-me-card '+(profile.admin?'admin-profile ':'')+String(profile.effect||'normal');
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

    const canManage = !message.bot && chatAccessLevel === "admin";
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
        <div class="chat-message-body">${escapeText(message.text || "")}${message.gif?`<img class="chat-inline-gif" src="${escapeText(message.gif)}" alt="GIF" loading="lazy">`:''}</div>
        ${imagePart}
        ${actions}`;
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
    if (!isElevatedAccess()) return;
    saveChatMessages(getChatMessages().filter(message => message.id !== id));
    renderChat();
}

function kickCurrentUser() {
    if (!isElevatedAccess()) return;
    localStorage.removeItem("echoChatProfile");
    localStorage.setItem("echoChatKicked", "1");
    returnToArchive();
    searchMessage.textContent = "CHAT_90: your session was removed by an administrator.";
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
const CHAT90_SERVER_URL = (() => {
  const host = String(location.hostname || '').toLowerCase();
  if (host.endsWith('.onrender.com')) return location.origin;
  return 'https://echoshare-0nsm.onrender.com';
})();
let chatSocket = null;
let chatConnected = false;
let chatAuthenticated = false;
let chatServerMessages = [];
let chatOnlineProfiles = [];
let chatReconnectTimer = null;
let chatReconnectDelay = 1000;
let chatPendingPackets = [];
let chatManualClose = false;

const CHAT_EFFECTS = [
  ["normal","No Effect"],["prism","PRISM ARC"],["star-mid","STAR MID"],["void-rift","VOID RIFT"],["crimson-flare","CRIMSON FLARE"],["blood-glitch","BLOOD GLITCH"],["red-lightning","RED LIGHTNING"],["nightmare","NIGHTMARE"],["singularity","SINGULARITY"],["hologram","HOLOGRAM"],["admin-core","ADMIN CORE"]
];
function fillSpecialEffects(){
  if(!chatEffectInput)return;
  const current=chatEffectInput.value||'normal';
  chatEffectInput.innerHTML=CHAT_EFFECTS.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');
  chatEffectInput.value=CHAT_EFFECTS.some(x=>x[0]===current)?current:'normal';
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
  const password=CHAT_NORMAL_PASSWORD;
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
      chatAccessLevel=packet.admin?"admin":"normal";
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

    if(packet.type==="historySync") {
      chatServerMessages=Array.isArray(packet.history)?packet.history:[];
      renderGlobalChat(true);
      if(packet.cleanupMessage) showChatNotification('ECHO BOT','Cleaned up 6 Messages <3','#9b9b9b');
      return;
    }

    if(packet.type==="adminAuthResult") {
      if(!packet.ok){ window.EchoAdminPanel?.pinResult(false,packet.message); return; }
      const p=getChatProfile()||{}; p.admin=true; p.access='admin'; p.role='ADMIN'; p.glow='#ff3030'; p.effect='admin-core'; saveChatProfile(p); chatAccessLevel='admin';
      renderGlobalChat(false); window.EchoAdminPanel?.unlockSuccess(packet.profile||p);
      sendChatProfileToServer();
      return;
    }
    if(packet.type==="adminCommandResult") { window.EchoAdminPanel?.commandResult(packet); return; }
    if(packet.type==="annoyAll") { playAnnoyAllMedia(packet); return; }

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
  if(password!==CHAT_NORMAL_PASSWORD){ chatAuthMessage.textContent='ACCESS DENIED — INVALID MEMBER PASSWORD.'; chatPasswordInput.value=''; chatPasswordInput.focus(); return; }
  window.chat90Password=CHAT_NORMAL_PASSWORD;
  chatAccessLevel='normal';
  const rememberProfile = window.echoShareGetSetting ? window.echoShareGetSetting('remember') !== false : true;
  const existing=rememberProfile ? getChatProfile() : null;
  if(existing){ existing.admin=false; existing.access='normal'; existing.role='MEMBER'; existing.glow='#39ff88'; existing.effect='normal'; saveChatProfile(existing); openChat(); return; }
  chatEditing=false; chatUsernameInput.value=''; chatAvatarInput.value=''; chatBioInput.value=''; chatTagsInput.value=''; chatBadgeInput.value=''; chatBackgroundInput.value=''; chatEffectInput.value='normal'; showOnly(chatSetupPage); chatUsernameInput.focus();
}
function openChatSetupForEdit(){
  const profile=getChatProfile();
  if(!profile) return;
  chatEditing=true;
  chatUsernameInput.value=profile.username||'';
  chatAvatarInput.value=profile.avatar||'';
  chatBioInput.value=profile.bio||'';
  chatTagsInput.value=(profile.tags||[]).join(', ');
  chatBadgeInput.value=profile.badge||'';
  if(chatBackgroundInput) chatBackgroundInput.value=profile.chatBackground||'';
  if(chatEffectInput) chatEffectInput.value=profile.effect||'normal';
  showOnly(chatSetupPage);
  chatUsernameInput.focus();
}

function enterChat(){
  const username=chatUsernameInput.value.trim(); if(!username) return chatUsernameInput.focus();
  const old=getChatProfile()||{}; const admin=!!old.admin;
  const profile={username:username.slice(0,24),avatar:chatAvatarInput.value.trim()||CHAT_DEFAULT_AVATAR,bio:chatBioInput.value.trim().slice(0,160),tags:chatTagsInput.value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12),access:admin?'admin':'normal',role:admin?'ADMIN':'MEMBER',glow:admin?'#ff3030':'#39ff88',badge:chatBadgeInput.value.trim(),effect:admin?(chatEffectInput?.value||'admin-core'):'normal',chatBackground:normalizeChatImageInput(chatBackgroundInput?.value.trim()||'')};
  saveChatProfile(profile); chatEditing=false; openChat();
}
function openChat(){
  const profile=getChatProfile();
  if(!profile) return openChatAuth();
  chatManualClose=false;
  chatAccessLevel=profile.admin?'admin':'normal';
  showOnly(chatPage);
  renderMe(profile);
  chatMessages.innerHTML='';
  window.chat90Password=CHAT_NORMAL_PASSWORD;
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
    row.type='button';
    row.className='chat-user-row chat-user-clickable';
    row.style.setProperty('--chat-glow',user.glow||'#39ff88');
    const badge=user.badge?`<img class="chat-user-badge" src="${escapeText(user.badge)}" alt="badge">`:'';
    row.innerHTML=`<span class="chat-user-dot"></span>
      <img class="chat-user-avatar" src="${escapeText(user.avatar||CHAT_DEFAULT_AVATAR)}" alt="">
      <div class="chat-user-name" style="text-shadow:0 0 8px ${escapeText(user.glow||'#39ff88')}">
        <span class="chat-user-name-line">${escapeText(user.username)} ${badge}</span>
        <span class="chat-user-role">${escapeText(user.role||'MEMBER')}</span>
      </div>`;
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
  const manage=isElevatedAccess()&&!message.bot?`<div class="chat-message-actions"><button data-action="delete">DELETE</button><button data-action="kick">KICK</button></div>`:'';
  const reply=message.replyTo?`<div class="chat-reply-preview"><b>↪ ${escapeText(message.replyTo.username||'USER')}</b><span>${escapeText(message.replyTo.text||'[MEDIA]')}</span></div>`:'';
  const media=message.media?`<div class="chat-message-media">${message.mediaType==='video'?`<video controls preload="metadata" ${window.echoShareGetSetting?.('autoplay')!==false?'autoplay':''} playsinline src="${escapeText(message.media)}"></video>`:`<img src="${escapeText(message.media)}" alt="Shared media" loading="lazy">`}</div>`:'';
  const legacyImage=message.image?`<img class="chat-message-image" src="${escapeText(message.image)}" alt="Chat image" loading="lazy">`:''; const legacyGif=message.gif?`<img class="chat-message-image" src="${escapeText(message.gif)}" alt="GIF" loading="lazy">`:'';
  const reactions=Array.isArray(message.reactions)?message.reactions:[]; const reactionThumb=reactions.length?`<span class="chat-reaction-count"><img src="${escapeText(reactions[reactions.length-1].url)}" alt=""> ${reactions.length}</span>`:''; const miniStar=message.effect==='star-mid'?'<span class="message-mini-star" aria-hidden="true">★</span>':message.effect==='you-and-i-forever'?'<span class="message-mini-eye" aria-hidden="true">◉</span>':''; const cardBackground=message.chatBackground?`<div class="chat-message-background" style="background-image:url('${escapeText(message.chatBackground)}')"></div>`:'';
  article.innerHTML=`${cardBackground}${angelic?'<div class="angelic-message-aura" aria-hidden="true"></div>':''}<div class="chat-message-head"><button class="chat-message-identity" type="button"><img class="chat-message-avatar" src="${escapeText(message.avatar||CHAT_DEFAULT_AVATAR)}" alt=""><span class="chat-message-name">${escapeText(message.username)}</span></button>${badge}<span class="chat-message-role">${escapeText(message.role||'MEMBER')}</span><span class="chat-message-time">${escapeText(new Date(message.time||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}</span></div>${reply}<div class="chat-message-body">${escapeText(message.text||'')}${message.gif?`<img class="chat-inline-gif" src="${escapeText(message.gif)}" alt="GIF" loading="lazy">`:''}${miniStar}</div>${media}${legacyImage}<div class="chat-message-tools"><button class="chat-tool-button" data-action="reply">↩ REPLY</button><button class="chat-tool-button" data-action="react">☆ GIF REACT</button>${reactionThumb}</div>${manage}`;
  article.querySelector('.chat-message-identity').addEventListener('click',()=>showViewedProfile(chatOnlineProfiles.find(p=>p.username===message.username)||{username:message.username,avatar:message.avatar,role:message.role,glow:message.glow,badge:message.badge,effect:message.effect,chatBackground:message.chatBackground,tags:[],bio:'',joined:''})); article.querySelector('[data-action="reply"]')?.addEventListener('click',()=>startChatReply(message)); article.querySelector('[data-action="react"]')?.addEventListener('click',()=>openReactionPicker(message.id)); article.querySelector('[data-action="delete"]')?.addEventListener('click',()=>wsSend({type:'adminCommand',command:'/delete '+message.id})); article.querySelector('[data-action="kick"]')?.addEventListener('click',()=>wsSend({type:'adminCommand',command:'/kick '+message.username})); chatMessages.appendChild(article);
}

function sendChatMessage(text,extra={}){
  const p=getChatProfile(); if(!p)return; const cleanText=String(text||'').trim(); const packet={type:'message',text:cleanText,...extra}; if(chatReplyTarget)packet.replyTo={id:chatReplyTarget.id,username:chatReplyTarget.username,text:chatReplyTarget.text||'[MEDIA]'}; if(!cleanText&&!extra.image&&!extra.gif&&!extra.media)return; wsSend(packet); clearChatReply();
}
function deleteChatMessage(id){wsSend({type:'adminCommand',command:'/delete '+id});}
function kickCurrentUser(username){wsSend({type:'adminCommand',command:'/kick '+(username||getChatProfile()?.username)});}
function sendImagePrompt(){chatMediaInput?.click();}
function sendGifPrompt(){chatMediaInput?.click();}
function startChatReply(message){chatReplyTarget=message;if(chatReplyBar){chatReplyBar.hidden=false;chatReplyBar.innerHTML=`<span>↩ Replying to <b>${escapeText(message.username)}</b>: ${escapeText(message.text||'[MEDIA]')}</span><button type="button" id="cancelChatReply">×</button>`;document.getElementById('cancelChatReply')?.addEventListener('click',clearChatReply);}chatMessageInput.focus();}
function clearChatReply(){chatReplyTarget=null;if(chatReplyBar){chatReplyBar.hidden=true;chatReplyBar.innerHTML='';}}
function openReactionPicker(id){chatReactionTargetId=id;chatReactionFileInput?.click();}
function readFileAsDataURL(file,maxBytes){return new Promise((resolve,reject)=>{if(!file)return reject(new Error('No file'));if(file.size>maxBytes)return reject(new Error('File too large'));const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('File read failed'));r.readAsDataURL(file);});}
async function handleChatMediaFile(file){if(!file)return;try{const data=await readFileAsDataURL(file,8*1024*1024);const isVideo=file.type.startsWith('video/');const isGif=file.type==='image/gif'||file.name.toLowerCase().endsWith('.gif');sendChatMessage('',{media:data,mediaType:isVideo?'video':(isGif?'gif':'image')});}catch(e){alert(e.message==='File too large'?'MEDIA FILE IS TOO LARGE — 8 MB MAX.':'Could not read that file.');}}
async function handleReactionFile(file){if(!file||!chatReactionTargetId)return;try{const data=await readFileAsDataURL(file,4*1024*1024);wsSend({type:'reaction',messageId:chatReactionTargetId,url:data});}catch(e){alert(e.message==='File too large'?'REACTION GIF IS TOO LARGE — 4 MB MAX.':'Could not read that GIF.');}chatReactionTargetId=null;}

function compressChatImage(file, options = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file"));
    const maxInput = options.maxInput || 12 * 1024 * 1024;
    const maxSide = options.maxSide || 512;
    const quality = options.quality ?? 0.86;
    if (file.size > maxInput) return reject(new Error("File too large"));

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext("2d", { alpha: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let data = canvas.toDataURL("image/webp", quality);
        if (!data.startsWith("data:image/webp")) data = canvas.toDataURL("image/png");
        if (data.length > (options.maxOutput || 700000)) data = canvas.toDataURL("image/jpeg", 0.72);
        resolve(data);
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}

function showChatUploadPreview(input, fileData, labelText) {
  if (!input?.parentElement || !fileData) return;
  const host = input.parentElement;
  let preview = host.querySelector(".chat-upload-preview");
  if (!preview) {
    preview = document.createElement("div");
    preview.className = "chat-upload-preview";
    host.appendChild(preview);
  }
  preview.innerHTML = `<img src="${escapeText(fileData)}" alt=""><span>${escapeText(labelText || "READY")}</span>`;
}

async function handleAvatarFile(file) {
  if (!file) return;
  try {
    const data = await compressChatImage(file, { maxSide: 640, quality: 0.88, maxOutput: 800000 });
    chatAvatarInput.value = data;
    showChatUploadPreview(chatAvatarInput, data, "PROFILE IMAGE READY");
    saveProfileFromForm(true);
  } catch (e) {
    alert(e.message === "File too large" ? "PROFILE IMAGE IS TOO LARGE — 12 MB MAX." : "Could not read that image.");
  }
}

async function handleBadgeFile(file) {
  if (!file) return;
  try {
    const data = await compressChatImage(file, { maxSide: 256, quality: 0.90, maxOutput: 450000 });
    chatBadgeInput.value = data;
    showChatUploadPreview(chatBadgeInput, data, "BADGE READY");
    saveProfileFromForm(true);
  } catch (e) {
    alert(e.message === "File too large" ? "BADGE FILE IS TOO LARGE — 12 MB MAX." : "Could not read that badge image.");
  }
}
function normalizeChatImageInput(value){
  const v=String(value||'').trim();
  if(!v)return '';
  if(/^\d+$/.test(v)) return `https://www.roblox.com/asset-thumbnail/image?assetId=${v}&width=1024&height=576&format=png`;
  return v;
}
function saveProfileFromForm(silent=false){const username=chatUsernameInput.value.trim();if(!username)return;const old=getChatProfile()||{};const admin=!!old.admin;const profile={username:username.slice(0,24),avatar:chatAvatarInput.value.trim()||CHAT_DEFAULT_AVATAR,bio:chatBioInput.value.trim().slice(0,160),tags:chatTagsInput.value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12),access:admin?'admin':'normal',role:admin?'ADMIN':'MEMBER',glow:admin?'#ff3030':'#39ff88',badge:chatBadgeInput.value.trim(),chatBackground:normalizeChatImageInput(chatBackgroundInput?.value.trim()||''),effect:admin?(chatEffectInput?.value||'admin-core'):'normal'};saveChatProfile(profile);window.chat90Password=CHAT_NORMAL_PASSWORD;if(chatAuthenticated)wsSend({...profile,type:'profile',tags:profile.tags});if(!silent)openChat();}

let chatProfileSaveTimer=null;
function scheduleProfileAutosave(){
  if(!chatEditing||!isElevatedAccess()) return;
  clearTimeout(chatProfileSaveTimer);
  chatProfileSaveTimer=setTimeout(()=>saveProfileFromForm(true),450);
}
[chatBadgeInput,chatBackgroundInput,chatAvatarInput,chatBioInput,chatTagsInput,chatEffectInput].filter(Boolean).forEach(el=>{
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

/* CHAT_90 PROFILE VIEW — stable, full-card layout */
showViewedProfile = function(profile){
  if(!profile || !chatViewedProfile || !chatProfileModal) return;
  const me=getChatProfile();
  const isMe=me?.username===profile.username;
  const isFriend=(window.chatFriends||[]).includes(profile.username);
  const history=chatServerMessages.filter(m=>!m.bot&&m.username===profile.username).slice(-40).reverse();
  const safeAvatar=profile.avatar||CHAT_DEFAULT_AVATAR;
  const badge=profile.badge?`<img class="viewed-profile-badge" src="${escapeText(profile.badge)}" alt="Badge">`:'';
  const tags=(profile.tags||[]).filter(Boolean);
  const status=profile.effect&&profile.effect!=='normal'?`✦ ${escapeText(profile.effect)}`:'ACTIVE ON CHAT_90';

  chatViewedProfile.innerHTML=`
    <div class="viewed-profile-shell" style="--chat-glow:${escapeText(profile.glow||'#39ff88')}">
      <div class="viewed-profile-hero">
        <div class="viewed-profile-avatar-wrap">
          <span class="viewed-profile-orbit" aria-hidden="true"></span>
          <img class="viewed-profile-avatar" src="${escapeText(safeAvatar)}" alt="">
          ${badge}
        </div>
        <div class="viewed-profile-heading">
          <div class="viewed-profile-kicker">CHAT_90 // IDENTITY RECORD</div>
          <h2>${escapeText(profile.username)}</h2>
          <div class="viewed-profile-role">${escapeText(profile.role||'MEMBER')}</div>
          <div class="viewed-profile-status"><span></span>${status}</div>
        </div>
      </div>
      <div class="viewed-profile-actions">
        ${!isMe?`<button type="button" id="viewDM">MESSAGE</button><button type="button" id="viewFriend">${isFriend?'REMOVE FRIEND':'ADD FRIEND'}</button>`:`<span>THIS IS YOUR PROFILE</span>`}
      </div>
      <section class="viewed-profile-section">
        <div class="viewed-profile-section-title">BIO</div>
        <div class="viewed-profile-bio">${escapeText(profile.bio||'No bio added.')}</div>
      </section>
      <section class="viewed-profile-section">
        <div class="viewed-profile-section-title">TAGS</div>
        <div class="tags">${tags.map(t=>`<span class="tag">${escapeText(t)}</span>`).join('')||'<span class="tag">NO TAGS</span>'}</div>
      </section>
      <section class="viewed-profile-section viewed-history-section">
        <div class="viewed-profile-section-title">CHAT HISTORY <small>${history.length} RECORDS</small></div>
        <div class="viewed-history">
          ${history.length?history.map(m=>{const label=m.text||(m.mediaType==='video'?'[VIDEO]':m.mediaType==='gif'||m.gif?'[GIF]':'[MEDIA]');return `<div class="viewed-history-row"><span>${escapeText(label)}</span><small>${escapeText(new Date(m.time||Date.now()).toLocaleString())}</small></div>`}).join(''):'<div class="viewed-empty">No messages yet.</div>'}
        </div>
      </section>
    </div>`;

  chatProfileModal.hidden=false;
  document.getElementById("viewDM")?.addEventListener("click",()=>{chatProfileModal.hidden=true;openDM(profile.username)});
  document.getElementById("viewFriend")?.addEventListener("click",()=>{
    wsSend({type:"friendToggle",username:profile.username});
    const button=document.getElementById("viewFriend");
    if(button) button.textContent=isFriend?'ADD FRIEND':'REMOVE FRIEND';
  });
};

/* ===========================
   CHAT_90 GIF VAULT + ADMIN CONSOLE
   =========================== */
(function initChatGifVault(){
  const modal=document.getElementById('chatGifModal'),grid=document.getElementById('chatGifGrid'),search=document.getElementById('chatGifSearch'),close=document.getElementById('chatGifClose');
  if(!modal||!grid)return;
  let files=Array.isArray(window.ECHO_GIF_LIBRARY)?window.ECHO_GIF_LIBRARY.slice():[];
  let loadedFromServer=false;

  const normalizeEntry=(entry)=>{
    if(typeof entry==='string'){
      const raw=entry.replace(/\\/g,'/');
      const parts=raw.split('/');
      const file=parts.pop()||'gif';
      return {name:decodeURIComponent(file),url:'/api/gif/'+encodeURIComponent(decodeURIComponent(file))};
    }
    if(entry&&entry.url){
      const name=entry.name||decodeURIComponent(String(entry.url).split('/').pop()||'gif');
      return {name,url:'/api/gif/'+encodeURIComponent(name)};
    }
    return null;
  };

  files=files.map(normalizeEntry).filter(Boolean);

  async function loadLibrary(){
    if(loadedFromServer)return;
    try{
      const response=await fetch('/api/gifs',{cache:'no-store'});
      if(response.ok){
        const data=await response.json();
        if(Array.isArray(data)&&data.length){files=data.map(normalizeEntry).filter(Boolean);loadedFromServer=true;}
      }
    }catch(_){}
  }

  function draw(q=''){
    const n=String(q).trim().toLowerCase();
    const list=files.filter(item=>!n||item.name.toLowerCase().includes(n));
    grid.innerHTML=list.map(item=>`
      <button class="gif-tile" type="button" data-gif="${escapeText(item.url)}" title="${escapeText(item.name)}">
        <img src="${escapeText(item.url)}" alt="${escapeText(item.name)}" loading="eager" decoding="async"
             onerror="this.closest('.gif-tile')?.classList.add('gif-missing')">
        <span>${escapeText(item.name)}</span>
      </button>`).join('')||'<div class="admin-empty">NO GIFS FOUND</div>';
    grid.querySelectorAll('[data-gif]').forEach(button=>button.addEventListener('click',()=>{sendChatMessage('',{gif:button.dataset.gif});modal.hidden=true;}));
  }

  window.EchoGifVault={
    async open(){modal.hidden=false;grid.innerHTML='<div class="gif-loading">LOADING MEDIA VAULT...</div>';await loadLibrary();draw(search?.value||'');setTimeout(()=>search?.focus(),30);},
    close(){modal.hidden=true}
  };

  document.getElementById('chatGifButton')?.addEventListener('click',()=>window.EchoGifVault.open());
  close?.addEventListener('click',()=>window.EchoGifVault.close());
  modal.addEventListener('click',e=>{if(e.target===modal)window.EchoGifVault.close()});
  search?.addEventListener('input',()=>draw(search.value));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)window.EchoGifVault.close()});
})();

function playAnnoyAllMedia(packet){
  if(!packet?.media)return;
  document.getElementById('chatAnnoyPlayback')?.remove();
  const wrap=document.createElement('div'); wrap.id='chatAnnoyPlayback'; wrap.className='chat-annoy-playback';
  const media=packet.mediaType==='video'?document.createElement('video'):document.createElement('audio');
  media.src=packet.media; media.autoplay=true; media.controls=false; media.playsInline=true; media.volume=1; media.preload='auto';
  if(media.tagName==='VIDEO'){media.className='chat-annoy-video';wrap.appendChild(media)}else{media.style.display='none';wrap.appendChild(media)}
  const label=document.createElement('div'); label.textContent=`/ANNOY ALL // ${packet.name||'MEDIA'}`; wrap.appendChild(label); document.body.appendChild(wrap);
  const finish=()=>wrap.remove(); media.addEventListener('ended',finish,{once:true}); media.addEventListener('error',finish,{once:true});
  const p=media.play(); if(p?.catch)p.catch(()=>{label.textContent='MEDIA READY — BROWSER BLOCKED AUTOPLAY';});
}

/* ===========================
   CHAT_90 ADMIN HOTKEY
   Ctrl + I opens the admin PIN from inside CHAT_90.
   =========================== */
document.addEventListener("keydown", (event) => {
  if (!event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;
  if (String(event.key).toLowerCase() !== "i") return;
  const chatOpen = chatPage && !chatPage.hidden;
  if (!chatOpen) return;
  event.preventDefault();
  event.stopPropagation();
  if (window.EchoAdminPanel?.open) {
    window.EchoAdminPanel.open();
  } else {
    const pin = document.getElementById("adminPinModal");
    if (pin) { pin.hidden = false; document.getElementById("adminPinInput")?.focus(); }
  }
}, true);

(function initAdminBridge(){
  window.EchoAdminAPI={
    unlock(pin){
      if(!chatIsSocketOpen()||!chatAuthenticated){window.EchoAdminPanel?.pinResult(false,'CHAT_90 IS STILL CONNECTING.');return;}
      chatSocket.send(JSON.stringify({type:'adminAuth',pin:String(pin)}));
    },
    command(command){wsSend({type:'adminCommand',command});},
    annoyAll(media){wsSend({type:'annoyAll',media:media.data,mediaType:media.type,name:media.name});}
  };
  document.getElementById('adminPanelClose')?.addEventListener('click',()=>window.EchoAdminPanel?.close());
})();

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
      if(key==='remember' && settings.remember===false) localStorage.removeItem('echoChatProfile');
      save();
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

// Keep audio controls synchronized even when the browser pauses an element or the page changes visibility.
['backgroundNoise','chatNotificationSound','clickSound'].forEach(id=>{
  const el=document.getElementById(id);
  el?.addEventListener('volumechange',()=>{
    if(id==='backgroundNoise' && window.echoShareSettings) el.loop=true;
  });
});
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden) unlockBackgroundNoise();
});




/* ===========================
   CHAT_90 FINAL UI / DATA STABILITY
   =========================== */
(function chat90FinalStability(){
  function refreshUploadPreviews(){
    if(chatAvatarInput?.value?.startsWith('data:image/')) showChatUploadPreview(chatAvatarInput,chatAvatarInput.value,'PROFILE IMAGE READY');
    if(chatBadgeInput?.value?.startsWith('data:image/')) showChatUploadPreview(chatBadgeInput,chatBadgeInput.value,'BADGE READY');
  }
  refreshUploadPreviews();
})();
