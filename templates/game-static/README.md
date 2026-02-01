# Static game template

Copy this folder into `games/<your-game-id>/` and edit:

- **manifest.json** — Set `id` (must match folder name), `name`, `description`, `author`, etc.
- **client/index.html** — Your game markup.
- **client/style.css** — Your styles (OpenArcade dark theme vars provided).
- **client/main.js** — Your game logic.

The hub serves `client/` at `/game/<id>/`. No build step; static files only. For multiplayer, add `server/index.js` (see CONTRIBUTING.md).
