#!/usr/bin/env node
/**
 * Build all games that have client-src (Vite/TS or other build pipeline).
 * Scans games/* for client-src/package.json with a "build" script;
 * runs npm ci + npm run build; expects output in ../client (see docs/ARCHITECTURE.md).
 */

import { readdir, access, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const gamesDir = join(repoRoot, "games");

function run(cwd, command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
}

/** Returns { id, clientSrcPath } if game has client-src/package.json with scripts.build. */
async function getBuildableGames() {
  const entries = await readdir(gamesDir, { withFileTypes: true });
  const gameDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const toBuild = [];

  for (const id of gameDirs) {
    const gamePath = join(gamesDir, id);
    const pkgPath = join(gamePath, "client-src", "package.json");
    let raw;
    try {
      raw = await readFile(pkgPath, "utf-8");
    } catch {
      continue;
    }
    let pkg;
    try {
      pkg = JSON.parse(raw);
    } catch {
      console.warn("build-games: " + id + " — client-src/package.json invalid JSON; skipping.");
      continue;
    }
    if (!pkg.scripts || typeof pkg.scripts.build !== "string") {
      console.warn("build-games: " + id + " — client-src/package.json missing scripts.build; skipping. Add \"scripts\": { \"build\": \"vite build\" } (or similar).");
      continue;
    }
    toBuild.push({ id, clientSrcPath: join(gamePath, "client-src") });
  }

  return toBuild;
}

async function main() {
  const toBuild = await getBuildableGames();

  if (toBuild.length === 0) {
    console.log("build-games: no games with client-src and scripts.build found. Nothing to build.");
    return;
  }

  console.log("");
  console.log("  OpenArcade — building games with client-src");
  console.log("  —");
  const results = [];

  for (const { id, clientSrcPath } of toBuild) {
    console.log("  Building " + id + " …");
    try {
      await run(clientSrcPath, "npm", ["ci"]);
      await run(clientSrcPath, "npm", ["run", "build"]);
      const clientIndex = join(clientSrcPath, "..", "client", "index.html");
      try {
        await access(clientIndex);
      } catch {
        console.warn("  " + id + " — build completed but client/index.html not found. Ensure outDir is ../client (e.g. Vite base: \"./\", outDir: \"../client\").");
      }
      results.push({ id, ok: true });
      console.log("  " + id + " ✓");
    } catch (err) {
      const msg = err.message || String(err);
      results.push({ id, ok: false, error: msg });
      console.log("  " + id + " ✗ " + msg);
    }
  }

  console.log("  —");
  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.log("  Failed: " + failed.map((r) => r.id).join(", "));
    process.exit(1);
  }
  console.log("  Built " + results.length + " game(s).");
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
