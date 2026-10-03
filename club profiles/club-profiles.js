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
    }
};

const ECHO_CLUB_ALIASES = {};
