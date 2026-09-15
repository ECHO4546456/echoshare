ECHO//SHARE CHAT_90 — MALFUNCTION UPDATE

Added:
- Upload buttons for profile image, badge, and banner for member/special/malfunction accounts.
- New MALFUNCTION access code: Ink.
- MALFUNCTION role/tag and 34 experimental controls.
- YOU AND I FOREVER message effect with contained VFX and eye symbol.
- MALFUNCTION MEDIA: upload image/video, test locally, or ANNOY ALL broadcast.
- Broadcast media overlay blocks CHAT_90 until video playback ends, then fades away.
- Instant profile/effect/tool synchronization remains server-backed.
- Background audio elements are loaded before script execution so the existing audio system can find them.

Codes:
- Member: 56789
- Special/Admin: 9!GAG
- Malfunction: Ink

Replace the frontend and backend files in the same GitHub repository/branch used by Render. Do not upload the ZIP itself as a website file.


## Embedded audio
This build embeds the background-noise and chat-notification MP3 data directly into `script.js`.
You do NOT need an `audio/` folder for those two sounds in this build. The HTML audio elements are populated by the script at runtime.

## CHAT_90 stability pass — September 14, 2026
- Reduced message VFX to a smaller reliable set while preserving ANGELIC PRAISE / INK, YOU AND I FOREVER, and all HALLOW NIGHT effects.
- Seasonal effects can be used by normal MEMBER profiles after browser redemption.
- CHAT_90 access profiles are stored separately for normal / special / malfunction codes.
- Removed duplicate CHAT_90 control/login bindings from the frontend.
- Added typewriter rendering for newly received text messages.
- Shared chat videos no longer autoplay.
- Added server-side live-room pruning after every 12 user messages: the oldest 9 live messages are archived out of the room.
- Improved sender identity frames, composer, profile modal, upload controls, seasonal VFX, lobby polish, Wiki readability, and Custom/Villanueva profile contrast.
