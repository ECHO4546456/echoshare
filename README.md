# ECHO//SHARE

A neon green + white archive/wiki website.

## Files

- `index.html` — page structure
- `style.css` — complete visual design
- `script.js` — search, loading screen, sound, wiki rendering
- `profiles.js` — editable profile database

## Add another profile

Open `profiles.js` and add another entry inside `ECHO_PROFILES`.

The search supports either the profile `name` or its `id`.

## Image addresses

Replace:

- `YOUR-ECHO-IMAGE-URI-HERE`
- `YOUR-ARCHTARKEN-IMAGE-URI-HERE`
- `YOUR-PROFILE-BACKGROUND-IMAGE-URI-HERE`

with direct image URLs.

## Edit the article

The ArchTarken article is inside `profiles.js` under `article`.
Add/remove sections and paragraphs there. Individual letters automatically glow white + green when hovered.

## GitHub Pages

Upload all four files to the same repository/folder, then enable GitHub Pages for the repository.

















CHAT_90 integration: search for CHAT_90 from the home page to open the protected chat area. Normal password: 56789. Special password: 9!GAG. CHAT_90 now includes clickable user profiles (bio + tags), GIF/image sharing, live join/leave presence, cross-tab live message syncing, and 50 special-password message effects.

Important: because this build is still a static website, its live presence/message bridge works between open CHAT_90 tabs/windows on the same site/browser using BroadcastChannel + localStorage. For people on different devices/browsers to see each other over the public internet, the site needs a real hosted backend/database or WebSocket server.
