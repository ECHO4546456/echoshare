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
        followers: "1,678",
        supports: "63,678",
        badge: "pngs/SSML.webp",
        tags: ["#Hexxercising", "#Doublehexxed", "#Ascended", "#Occultism","#Cultism" ],
        bio: "† ₮ⱧɆ ⱧłɆⱤ₳Ɽ₵ⱧɎ ł₴ ₳ ₴₳₵Ɽł₣ł₵Ɇ. † Tyrants bleed. Kings burn. Queens rot. Opposers face total erasure. We invoke the end of the crown. ⛧ 𝖓𝖔 𝖒𝖊𝖗𝖈𝖞 𝖋𝖔𝖗 𝖙𝖍𝖊 𝖍𝖎𝖌𝖍-𝖇𝖔𝖗𝖓 ⛧",
        status: "Cult",
        glow: "#ff4039"
    },
    "TheHonorOne": {
        name: "TheHonorOne",
        id: "CLUB-TheHonorOne-001",
        image: "pngs/for-honor-knight.gif",
        background: "pngs/15466.gif",
        music: "sounds/Oneshot (Hardstyle).mp3",
        followers: "889K",
        supports: "8,9T",
        badge: "gifs_emojis/yousuredog.webp",
        tags: ["Knights",],
        bio: "I honor the queen with bloody hands and a sword. For there i shall take my life if it means to serve her.",
        status: "TheHonor_Family",
        glow: "#000000"
    },
    "HazelsHoneyroom_777": {
        name: "ℌ𝔞𝔷𝔢𝔩𝔰ℌ𝔬𝔫𝔢𝔶𝔯𝔬𝔬𝔪_777",
        id: "CLUB-ℌ𝔞𝔷𝔢𝔩𝔰ℌ𝔬𝔫𝔢𝔶𝔯𝔬𝔬𝔪-001",
        image: "pngs/paswg-scanty-and-kneesocks.gif",
        background: "pngs/Scanty and Kneesocks.webp",
        music: "sounds/Agora Hills (TikTok Version) - Doja Cat slowed down + without rap.mp3",
        followers: "162.3M",
        supports: "999+ EMOJI REACTS",
        badge: "gifs_emojis/cri.webp",
        tags: ["OWNER:🔱HazelsBuckerBun", "CO OWNER:@Tothetidesat12", "34 Workers"],
        bio: "Contact us for some fun boys<3",
        status: 'Sexy',
        glow: "#f73790"
    },
    "The_Hons_Family": {
        name: "The_Hons_Family",
        id: "CLUB-HonsFamily-001",
        image: "pngs/content.webp",
        background: "pngs/Redhive.gif",
        music: "",
        followers: "920,456k",
        supports: "Largest Family.",
        badge: "pngs/SSML.webp",
        tags: ["27 Mothers", "5 God mothers", "5 Lost childern", "Prime dictator: Salvatore", "60 Death knights"],
        bio: "The Godfamily",
        status: "Cult",
        glow: "#c50000"
    }
};

const ECHO_CLUB_ALIASES = {};
