/*
    ECHO//SHARE PROFILE DATABASE

    Add more profiles inside the ECHO_PROFILES object.
    The search matches the profile name OR the profile id.

    Replace image URLs with your own direct image addresses.
*/

const ECHO_PROFILES = {
    ArchTarken: {
        name: "ArchTarken",
        id: "ES-ARCH-001",
        image: "Yhttps://images-ext-1.discordapp.net/external/W1bD5iKJFWfHr2NAM8PcqS4baeWciKtI9fNE4fmc5Rk/%3Fsize%3D1280/https/cdn.discordapp.com/avatars/1545845460575457385/b178255208daafc8669b875f7f4f7a8f.webp?format=webp",
        tagline: "An archived subject preserved inside the ECHO//SHARE network.",
        birthDate: "April 18, 2004",
        joined: "September 10, 2026",
        readers: "2M",
        support: "6B",
        status: "ACTIVE",
        tags: [
            "ARCHIVE",
            "PROFILE",
            "DOCUMENTED",
            "ECHO RECORD"
        ],
        articleTitle: "About ArchTarken",

        /*
            EDIT THIS ARTICLE YOURSELF.
            Every letter is automatically wrapped by script.js so each
            individual character can glow bright white + green on hover.
        */
        article: [
            {
                heading: "Overview",
                paragraphs: [
                    "ArchTarken is a documented record within the ECHO//SHARE archive. This is your editable article area. Replace this paragraph with whatever information, lore, history, biography, or documentation you want displayed on the profile.",
                    "The page is designed to feel like a premium digital wiki while keeping the information easy to read. You can add as many paragraphs and sections as you want."
                ]
            },
            {
                heading: "History",
                paragraphs: [
                    "Write the history of ArchTarken here. The text can be as long as you need, and every individual letter will react when a reader moves their mouse over it.",
                    "You can continue expanding this section with more information, events, discoveries, records, quotes, or anything else you want the archive to contain."
                ]
            },
            {
                heading: "Archive Notes",
                paragraphs: [
                    "This final section can contain additional notes, references, secrets, or anything else you want readers to know."
                ]
            }
        ]
    }
};
