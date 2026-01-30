# OpenArcade

OpenArcade is a GitHub-first open source arcade. It includes a local "hub"
that hosts an admin UI and serves playable games, plus a simple website that
can be published via GitHub Pages.

## Monorepo

- `website/` Static website for GitHub Pages
- `hub/` Local Node.js host hub
- `games/` Plugin-style game folders

## Quick start (hub)

```bash
cd hub
npm install
npm start
```

You will see terminal output with Admin and Player URLs.

## Adding a new game

1. Create a folder in `games/` using the game id as the folder name.
2. Add `manifest.json` and a `client/` folder with `index.html`, `style.css`,
   and `main.js`.
3. Keep the game client lightweight and free to run.

Manifest example:

```json
{
  "id": "blackjack",
  "name": "Blackjack",
  "version": "0.1.0",
  "description": "A simple card game. (WIP)",
  "author": "OpenArcade Contributors",
  "wip": true
}
```

## GitHub Pages deploy

The static site in `website/` is deployed automatically to GitHub Pages when
you push to `main`. The workflow (`.github/workflows/pages.yml`) uses the
official Pages actions: `configure-pages`, `upload-pages-artifact`, and
`deploy-pages`. The artifact is the contents of `website/`, which become the
site root.

**Enabling Pages:** In your repo go to **Settings → Pages**. Under "Build and
deployment", set **Source** to "GitHub Actions" and use the `github-pages`
environment. After the first push to `main`, the workflow will run and publish
the site.

## CI checks

On every push to `main` and on pull requests, the CI workflow
(`.github/workflows/ci.yml`) runs on `ubuntu-latest` with Node.js LTS (20.x). It:

- Installs hub dependencies with `npm ci` (from `hub/`)
- Runs a Node syntax check on `hub/src/index.js`
- Runs `npm run validate:manifests` to validate game manifests

The manifest validator (`hub/scripts/validateManifests.js`) scans `games/` for
`manifest.json` files and ensures: required keys (`id`, `name`, `version`,
`description`, `author`, `wip`), `manifest.id` matches the folder name, and
`wip` is a boolean. Invalid manifests cause CI to fail with clear error output.

## Project links

- Website docs: `website/README.md`
- Hub docs: `hub/README.md` (optional future)
- Sample game: `games/blackjack/README.md`
