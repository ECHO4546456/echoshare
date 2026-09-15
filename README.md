# ECHO//SHARE — CHAT_90 Clean UI + VFX Build

## Included
- Existing ECHO//SHARE lobby and Wiki preserved.
- CHAT_90 access codes are isolated by tier in local browser storage:
  - Member: `56789`
  - Special/Admin: `9!GAG`
  - Malfunction/Ink: `Ink`
- Curated message effects only, plus `ANGELIC PRAISE` and `YOU AND I FOREVER` for Ink.
- Halloween redemption effects work for normal members after redemption.
- Halloween VFX have distinct animated visual treatments.
- Messages use a profile rail, avatar frame, clean reaction controls, and a long bottom composer.
- Fresh messages type themselves letter-by-letter; old history loads instantly to avoid lag.
- Shared chat videos never autoplay.
- Profile image, badge, and banner upload controls use one reliable file-picker path each.
- Profile banners and chat-card backgrounds are propagated with the profile/message data.
- Server prunes the oldest 9 chat messages after every 12 non-bot messages and syncs the reduced history to all connected clients.
- Server rejects normal users from using elevated-only effects while allowing redeemed seasonal effects.

## Render
The backend is `server.js`. Set the Render start command to `node server.js`.
The frontend connects to the existing CHAT_90 endpoint in `script.js`.

## Note about Roblox image IDs
The profile banner and chat-card fields accept normal image URLs and Roblox numeric asset IDs through Roblox's thumbnail endpoint. If a Roblox asset has no publicly available thumbnail, the browser cannot display it; uploading the image file is the reliable option.


## CHAT_90 stability v2
- Separate remembered identities for Normal, Special/Admin, and Malfunction codes.
- Seasonal redeemed effects work for Members and are synchronized through the server profile.
- One canonical message-effect selector (duplicate selector removed).
- Profile uploads are compressed client-side before browser storage to avoid localStorage overflow.
- New messages use smooth entrance + typewriter rendering; history is rendered without replaying the typewriter.
- Videos are manual-play only.
- Server prunes 9 oldest messages after each 12-message cycle.
