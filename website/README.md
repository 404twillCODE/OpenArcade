# OpenArcade Website

A modern static site built with **Vite**, **React**, **TypeScript**, **Tailwind CSS**, and **React Router**. It explains how to host, play, and contribute to OpenArcade.

## Development

```bash
cd website
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173/OpenArcade/`). Use HashRouter so routes work on GitHub Pages (`#/host`, `#/play`, etc.).

## Build

```bash
npm run build
```

Output goes to `website/dist`. The build uses `base: "/OpenArcade/"` for the project site URL.

## Deployment

The site is deployed automatically via GitHub Actions when changes are pushed to `main`. The workflow (`.github/workflows/pages.yml`) runs `npm ci` and `npm run build` inside `website/`, then uploads the **contents of `website/dist`** (not the repo root). Enable Pages in the repo settings with **Source: GitHub Actions** and the `github-pages` environment.

Live URL: `https://404twillcode.github.io/OpenArcade/`

## Pages (React Router)

- `/` — Home (CTAs: Host a Server, Contribute a Game)
- `/host` — Hosting instructions
- `/play` — Join instructions
- `/contribute` — How to submit games via PRs
- `/games` — Game list (placeholder; auto-generated soon)
