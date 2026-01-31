/**
 * Validates game package layout: client-src must have package.json;
 * client/ must exist and contain index.html (entry or Vite output).
 * Run after validate:manifests and build:games in CI.
 * Run from hub/ (e.g. npm run validate:games).
 */
const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "..", "..", "games");

function validateGamePackages() {
  if (!fs.existsSync(gamesDir)) {
    console.error(`[validateGamePackages] Games directory not found: ${gamesDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(gamesDir, { withFileTypes: true });
  const errors = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const manifestPath = path.join(gamesDir, entry.name, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;

    const gameId = entry.name;
    const clientSrcPath = path.join(gamesDir, gameId, "client-src");
    const clientPath = path.join(gamesDir, gameId, "client");
    const clientIndexPath = path.join(clientPath, "index.html");

    if (fs.existsSync(clientSrcPath)) {
      const pkgPath = path.join(clientSrcPath, "package.json");
      if (!fs.existsSync(pkgPath)) {
        errors.push(`${gameId}: client-src/ exists but client-src/package.json is missing`);
      }
    }

    if (!fs.existsSync(clientPath)) {
      errors.push(`${gameId}: client/ folder is missing (required for /game/<id>/)`);
    } else if (!fs.existsSync(clientIndexPath)) {
      errors.push(`${gameId}: client/index.html is missing (required entry)`);
    }
  }

  if (errors.length > 0) {
    console.error("[validateGamePackages] Validation failed:\n");
    errors.forEach((err) => console.error("  -", err));
    process.exit(1);
  }

  console.log("[validateGamePackages] All game packages valid.");
}

validateGamePackages();
