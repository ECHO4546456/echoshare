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
        image: "ARCHTARKEN-IMAGE-URL",
        tagline: "An archived subject preserved inside the ECHO//SHARE network.",
        birthDate: "April 18, 2004",
        joined: "September 10, 2026",
        readers: "2M",
        support: "6B",
        status: "ACTIVE",

        tags: [
            "ARCHIVE",
            "PROFILE",
            "DOCUMENTED"
        ],

        articleTitle: "About ArchTarken",

        article: [
            {
                heading: "Overview",
                paragraphs: [
                    "Your ArchTarken article goes here."
                ]
            }
        ]
    },


    AnotherCharacter: {
        name: "AnotherCharacter",
        id: "ES-CHAR-002",
        image: "ANOTHER-CHARACTER-IMAGE-URL",
        tagline: "Description of the new character.",
        birthDate: "January 12, 2005",
        joined: "September 11, 2026",
        readers: "850K",
        support: "3B",
        status: "ACTIVE",

        tags: [
            "CHARACTER",
            "ARCHIVE",
            "DOCUMENTED"
        ],

        articleTitle: "About AnotherCharacter",

        article: [
            {
                heading: "Overview",
                paragraphs: [
                    "Write the new character's article here."
                ]
            },
            {
                heading: "History",
                paragraphs: [
                    "Write their history here."
                ]
            }
        ]
    }

};