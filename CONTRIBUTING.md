# Contributing to OpenArcade

Thanks for your interest in OpenArcade. We welcome issues, feature requests,
and new game submissions.

## Quick steps

1. Fork the repo and create a feature branch.
2. Make your changes and keep them focused.
3. Open a pull request with a clear description.

## Adding a new game

Create a folder in `games/<gameId>/` with:

- `manifest.json` (required)
- `client/index.html`
- `client/style.css`
- `client/main.js`
- `README.md`

Required manifest fields:

- `id`, `name`, `version`, `description`, `author`, `wip`

## Local testing

```bash
cd hub
npm install
npm start
```

Then open the Admin and Player URLs printed in the terminal.

## Code of Conduct

This project follows `CODE_OF_CONDUCT.md`.
