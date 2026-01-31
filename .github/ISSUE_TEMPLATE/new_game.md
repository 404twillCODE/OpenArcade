---
name: New game submission
about: Submit a new game for OpenArcade (use with a pull request)
title: "[New Game] "
labels: game
assignees: ""
---

## Game

- **Game id (kebab-case):** 
- **Name:** 
- **Category (e.g. card, party, trivia):** 
- **Static or built:** Static (`client/` only) / Built (`client-src/` → `client/`)

## Description

Short description of the game and how to play.

## Screenshots / GIF

Please add a screenshot or short GIF showing the game (required for merge).

## Local test checklist

- [ ] `cd hub && npm run validate:manifests` — passed
- [ ] `npm run build:games` — passed (if built game)
- [ ] `cd hub && npm run validate:games` — passed
- [ ] Hub runs; game loads at `/game/<id>/` and in Play page
- [ ] Mobile tested (if applicable)

## PR link

Link to the pull request that adds this game.
