# OpenArcade Website

This is a static site intended for GitHub Pages. It explains how to host,
play, and contribute to OpenArcade.

## Deployment

The site is deployed automatically via GitHub Actions when changes are pushed to
`main`. The workflow (`.github/workflows/pages.yml`) publishes the contents of
this `website/` folder as the site root. Enable Pages in the repo settings with
**Source: GitHub Actions** and the `github-pages` environment.

## Pages

- `index.html` Overview
- `host.html` Hosting instructions
- `play.html` How players join
- `contribute.html` Contribution guide
