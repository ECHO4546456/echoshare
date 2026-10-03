# ECHO//SHARE — CHAT_90 VFX BUILD

This build keeps the ECHO//SHARE archive structure and upgrades the visual/audio layer without replacing the site's core flow.

## Audio
- `sounds/background-noise.mp3.mp3` — CHAT_90 / site background sound
- `sounds/Goodjob!.mp3` — search + archive-card click sound
- `sounds/chat-notification.mp3.mp3` — CHAT_90 incoming notification sound
- Audio is loaded from the `sounds/` folder; the old embedded base64 audio has been removed.
- Settings control master, background, notification, and click/search volume independently and save instantly.

## CHAT_90
- Stronger glass/neon VFX for the lobby, password screen, setup screen, settings, profile cards, composer, and chat messages.
- Message card backgrounds remain supported.
- Profile-banner feature is removed; use the message/card background instead.
- Message effects are organized under `message effects/<effect>/effect.css`.
- `message-effects.css` imports every effect folder.
- After more than 10 non-bot messages, CHAT_90 removes the oldest 6 messages and ECHO BOT posts: `Cleaned up 6 Messages <3`.
- The cleanup is synchronized to connected users with a history sync packet.

## Access codes
- Member: `56789`
- Special/Admin: `9!GAG`
- Malfunction: `Ink`

## Deploy
Upload/replace the project files in the same GitHub repository and Render service used by ECHO//SHARE. Render starts the backend with `npm start` / `node server.js`.


## CHAT_90 current build
- Member password: `56789`
- Admin console: press `Ctrl+I` inside the site, then enter PIN `7879`.
- GIF vault reads the files listed in `gif-library.js` from `gifs_emojis/gifs_emojis/`.
- Image/video upload is the `＋` button beside GIF.
- Admin tools live in `admin panel/`.
- Active message effects are organized under `message effects/<effect>/effect.css`; older loose effect files are in `message effects/archive/`.
- Audio is loaded from `sounds/Goodjob!.mp3`, `sounds/background-noise.mp3.mp3`, and `sounds/chat-notification.mp3.mp3`.
- CHAT_90 automatically removes the six oldest non-system messages after the shared history passes ten user messages, then posts `Cleaned up 6 Messages <3`.


CHAT_90 fixes: same-origin Render WebSocket support, restored creator message, persistent audio settings, GIF API fallback, admin console PIN 7879, member password 56789.
