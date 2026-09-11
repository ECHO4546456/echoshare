/*
    ECHO//SHARE PROFILE DATABASE

    Add more profiles inside the ECHO_PROFILES object.
    The search matches the profile name OR the profile id.

    Replace image URLs with your own direct image addresses.
*/

const ECHO_PROFILES = {
    UPDATE: {
        name: "UPDATE",
        id: "ES-UPDATE-001",
        image: "YOUR-ARCHTARKEN-IMAGE-URI-HERE",
        tagline: "An archived subject preserved inside the ECHO//SHARE network.",
        birthDate: "Not here.",
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
        articleTitle: "ABOUT THE UPDATE",

        /*
            EDIT THIS ARTICLE YOURSELF.
            Every letter is automatically wrapped by script.js so each
            individual character can glow bright white + green on hover.
        */
        article: [
            {
                heading: "Overview",
                paragraphs: [
                    "The Lost Hour. In the old town of Oakhaven, Silas worked in a tiny shop filled with ticking clocks. He spent his days fixing gears and cleaning springs.",
                    
                ]
            },

            {
                heading: "History",
                paragraphs: [
                    "This is another long paragraph.",
                    "Another paragraph goes here.",
                    "Another paragraph goes here."
                ]
            }
        ]
    }
};