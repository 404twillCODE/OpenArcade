/**
 * Loads game manifests from games/. Only folders with a valid manifest are
 * included. Invalid or missing manifests are skipped and logged so authors
 * can fix them (see docs/ARCHITECTURE.md and hub scripts/validateManifests.js).
 */
const fs = require("fs/promises");
const path = require("path");

const gamesRoot = path.join(__dirname, "..", "..", "games");

const REQUIRED_KEYS = ["id", "name", "version", "description", "author", "wip"];

function validateManifest(manifest, folderName) {
  for (const key of REQUIRED_KEYS) {
    if (!(key in manifest)) return `missing required key "${key}"`;
  }
  if (manifest.id !== folderName) {
    return `manifest.id "${manifest.id}" must match folder name "${folderName}"`;
  }
  if (typeof manifest.wip !== "boolean") {
    return "wip must be a boolean";
  }
  return null;
}

async function loadGames() {
  let entries;
  try {
    entries = await fs.readdir(gamesRoot, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") {
      console.warn("[hub] Games directory not found:", gamesRoot);
      return [];
    }
    throw err;
  }

  const games = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const manifestPath = path.join(gamesRoot, entry.name, "manifest.json");
    let raw;
    try {
      raw = await fs.readFile(manifestPath, "utf-8");
    } catch (err) {
      if (err.code === "ENOENT") continue;
      console.warn("[hub] Skipping game", entry.name, "— cannot read manifest:", err.message);
      continue;
    }

    let manifest;
    try {
      manifest = JSON.parse(raw);
    } catch (err) {
      console.warn("[hub] Skipping game", entry.name, "— invalid JSON in manifest.json:", err.message);
      continue;
    }

    const validationError = validateManifest(manifest, entry.name);
    if (validationError) {
      console.warn("[hub] Skipping game", entry.name, "—", validationError);
      continue;
    }

    games.push(manifest);
  }

  return games;
}

module.exports = {
  loadGames,
  gamesRoot,
};
