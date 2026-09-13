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
