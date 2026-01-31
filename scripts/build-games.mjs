#!/usr/bin/env node
/**
 * Build all games that have client-src (Vite/TS or other build pipeline).
 * Scans games/* for client-src/package.json, runs npm ci + npm run build,
 * expects each game's build to output into ../client.
 */

import { readdir, access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const gamesDir = join(repoRoot, "games");

function run(cwd, command, args, opts = {}) {
  return new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: true,
  });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
}

async function hasClientSrcPackage(gamePath) {
  const pkgPath = join(gamePath, "client-src", "package.json");
  try {
    await access(pkgPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const entries = await readdir(gamesDir, { withFileTypes: true });
  const gameDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const toBuild = [];

  for (const id of gameDirs) {
    const gamePath = join(gamesDir, id);
    if (await hasClientSrcPackage(gamePath)) {
      toBuild.push({ id, clientSrcPath: join(gamePath, "client-src") });
    }
  }

  if (toBuild.length === 0) {
    console.log("build-games: no games with client-src found. Nothing to build.");
    return;
  }

  console.log("");
  console.log("  OpenArcade — building games with client-src");
  console.log("  —");
  const results = [];

  for (const { id, clientSrcPath } of toBuild) {
    console.log(`  Building ${id} …`);
    try {
      await run(clientSrcPath, "npm", ["ci"]);
      await run(clientSrcPath, "npm", ["run", "build"]);
      results.push({ id, ok: true });
      console.log(`  ${id} ✓`);
    } catch (err) {
      results.push({ id, ok: false, error: err.message });
      console.log(`  ${id} ✗ ${err.message}`);
    }
  }

  console.log("  —");
  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.log(`  Failed: ${failed.map((r) => r.id).join(", ")}`);
    process.exit(1);
  }
  console.log(`  Built ${results.length} game(s).`);
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
