/**
 * Health check: validate manifests, build UI, start server on a test port,
 * hit /api/state and /api/games, then stop. For CI or local use.
 * Run from hub/: npm run healthcheck
 */
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const HUB_ROOT = path.join(__dirname, "..");
const PORT = 3105;
const BASE = `http://127.0.0.1:${PORT}`;

function log(msg) {
  console.log(`[healthcheck] ${msg}`);
}

function fail(msg) {
  console.error(`[healthcheck] ${msg}`);
  process.exit(1);
}

// 1) Validate manifests (reuse validator)
function runValidateManifests() {
  log("Validating game manifests...");
  try {
    require("./validateManifests.js");
  } catch (e) {
    fail(`Manifest validation failed: ${e.message}`);
  }
  log("Manifests OK");
}

// 2) Build UI (assume deps installed; CI runs npm ci in hub and hub/app first)
function runBuildUi() {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "build:ui"], {
      cwd: HUB_ROOT,
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`build:ui exited with ${code}`));
    });
    child.on("error", reject);
  });
}

// 3) Start server, fetch routes, stop
async function runServerCheck() {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["src/index.js"], {
      cwd: HUB_ROOT,
      env: { ...process.env, PORT: String(PORT) },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Server did not respond in time"));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      child.kill("SIGTERM");
    }

    child.on("error", (e) => {
      cleanup();
      reject(e);
    });

    child.on("exit", (code, signal) => {
      if (code !== 0 && code !== null && !signal) {
        cleanup();
        reject(new Error(`Server exited with ${code}: ${stderr}`));
      }
    });

    // Poll until server is up, then run fetches and stop
    function tryFetch() {
      const req = http.get(`${BASE}/api/state`, (res) => {
        if (res.statusCode === 200) {
          runFetches()
            .then(() => {
              cleanup();
              resolve();
            })
            .catch((e) => {
              cleanup();
              reject(e);
            });
        } else {
          setTimeout(tryFetch, 200);
        }
      });
      req.on("error", () => setTimeout(tryFetch, 200));
      req.setTimeout(5000, () => {
        req.destroy();
        setTimeout(tryFetch, 200);
      });
    }

    // Give server a moment to bind
    setTimeout(tryFetch, 1000);
  });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) reject(new Error(`${url} returned ${res.statusCode}`));
        else {
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error(`${url} invalid JSON`));
          }
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`${url} timeout`));
    });
  });
}

async function runFetches() {
  log("Checking /api/state...");
  const state = await fetchUrl(`${BASE}/api/state`);
  if (typeof state.activeGameId !== "string" && state.activeGameId !== null) {
    throw new Error("/api/state missing activeGameId");
  }
  log("/api/state OK");

  log("Checking /api/games...");
  const games = await fetchUrl(`${BASE}/api/games`);
  if (!Array.isArray(games)) {
    throw new Error("/api/games must return an array");
  }
  log("/api/games OK");
}

async function main() {
  runValidateManifests();
  await runBuildUi();
  log("UI build OK");
  await runServerCheck();
  log("Server routes OK");
  log("Health check passed.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
