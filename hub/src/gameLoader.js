const fs = require("fs/promises");
const path = require("path");

const gamesRoot = path.join(__dirname, "..", "..", "games");

async function loadGames() {
  const entries = await fs.readdir(gamesRoot, { withFileTypes: true });
  const games = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifestPath = path.join(gamesRoot, entry.name, "manifest.json");
    try {
      const raw = await fs.readFile(manifestPath, "utf-8");
      const manifest = JSON.parse(raw);
      games.push(manifest);
    } catch {
      // Ignore folders without a valid manifest.json
    }
  }

  return games;
}

module.exports = {
  loadGames,
  gamesRoot,
};
