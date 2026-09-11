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
    const profile = findProfile(query);

    searchMessage.textContent = "";

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
