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


  <button class="featured-card AnotherCharacter-card" data-profile="AnotherCharacter">
    <div class="featured-glow"></div>
    <div class="featured-image-wrap">
        <img src="https://media.discordapp.net/attachments/1535460677525700659/1547827601920499852/Z.png?ex=6aa4d649&is=6aa384c9&hm=193f3131ebd5c887dd176efd5420227802689ac9232e6238a53d5162be30489c&=&format=webp&quality=lossless" alt="AnotherCharacter">
    </div>
    <div class="featured-info">
        <span class="record-tag">PROFILE RECORD</span>
        <h2>AnotherCharacter</h2>
        <p>Open the archived profile and read the full document.</p>
    </div>
    <span class="featured-arrow">↗</span>
</button>
