/*
   ECHO//SHARE CLUB PROFILE DATABASE
   ---------------------------------
   Add/edit clubs here. Search them with:
     club/your-club-name
     club your-club-name

   Every club can have its own:
   - profile ID
   - profile image
   - custom background
   - custom music from the main sounds/ folder
   - followers/supports
   - tags
   - bio
   - optional badge

   Set badge: "" or null when a club should NOT have a badge.
*/

const ECHO_CLUBS = {
    "V*PER": {
        name: "V*PER",
        id: "CLUB-V*PER-001",
        image: "pngs/spider.gif",
        background: "pngs/tokyo-ghoul-rize.gif",
        music: "sounds/Vipermusic.mp3",
        followers: "1M",
        supports: "1.9B",
        badge: "pngs/SSML.webp",
        tags: ["P,N", "Dream core"],
        bio: "I want to ruin you so completely that every other touch you ever feel for the rest of your life will taste like a pale ghost of me.",
        status: "CLUB",
        glow: "#ff4039"
    },
    "Harnsoi_Kinzo": {
        name: "Harnsoi_Kinzo",
        id: "CLUB-Harnsoi_Kinzo-001",
        image: "pngs/markspfp2.gif",
        background: "pngs/markpfp.gif",
        music: "sounds/I ᐸ3 Wealth.mp3",
        followers: "None",
        supports: "None",
        badge: "",
        tags: ["#Hexxercising", "#Doublehexxed", "#Ascended", "#Occultism","#Cultism" ],
        bio: "† ₮ⱧɆ ⱧłɆⱤ₳Ɽ₵ⱧɎ ł₴ ₳ ₴₳₵Ɽł₣ł₵Ɇ. † Tyrants bleed. Kings burn. Queens rot. Opposers face total erasure. We invoke the end of the crown. ⛧ 𝖓𝖔 𝖒𝖊𝖗𝖈𝖞 𝖋𝖔𝖗 𝖙𝖍𝖊 𝖍𝖎𝖌𝖍-𝖇𝖔𝖗𝖓 ⛧",
        status: "Cult",
        glow: "#ff4039"
    },
};

const ECHO_CLUB_ALIASES = {};
