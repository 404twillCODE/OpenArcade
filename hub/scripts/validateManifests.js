/**
 * Validates all game manifests under ../games.
 * Required keys: id, name, version, description, author, wip.
 * manifest.id must match the folder name.
 * Run from hub/ (e.g. npm run validate:manifests).
 */
const fs = require("fs");
const path = require("path");

const REQUIRED_KEYS = ["id", "name", "version", "description", "author", "wip"];
const gamesDir = path.join(__dirname, "..", "..", "games");

function validateManifests() {
  if (!fs.existsSync(gamesDir)) {
    console.error(`[validateManifests] Games directory not found: ${gamesDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(gamesDir, { withFileTypes: true });
  const errors = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const manifestPath = path.join(gamesDir, entry.name, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      continue; // folder without manifest is ignored (not an error)
    }

    let manifest;
    try {
      const raw = fs.readFileSync(manifestPath, "utf-8");
      manifest = JSON.parse(raw);
    } catch (e) {
      errors.push(`${entry.name}: invalid JSON in manifest.json - ${e.message}`);
      continue;
    }

    for (const key of REQUIRED_KEYS) {
      if (!(key in manifest)) {
        errors.push(`${entry.name}: manifest.json missing required key "${key}"`);
      }
    }

    if (manifest.id !== undefined && manifest.id !== entry.name) {
      errors.push(
        `${entry.name}: manifest.id "${manifest.id}" must match folder name "${entry.name}"`
      );
    }

    if (manifest.wip !== undefined && typeof manifest.wip !== "boolean") {
      errors.push(`${entry.name}: manifest.wip must be a boolean`);
    }
  }

  if (errors.length > 0) {
    console.error("[validateManifests] Validation failed:\n");
    errors.forEach((err) => console.error("  -", err));
    process.exit(1);
  }

  console.log("[validateManifests] All game manifests valid.");
}

validateManifests();
