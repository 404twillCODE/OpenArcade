const { app, BrowserWindow, ipcMain, shell, dialog, protocol, net, clipboard } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const { spawn, execSync } = require("child_process");
const os = require("os");
const { pathToFileURL } = require("url");
const { URL } = require("url");

const REPO_ZIP = "https://github.com/404twillCODE/OpenArcade/archive/refs/heads/main.zip";
// Only load Vite dev server when explicitly requested (e.g. npm run dev:live). Otherwise use built files.
const useViteServer = process.env.ELECTRON_LOAD_VITE === "1" && !app.isPackaged;

let mainWindow = null;
let hubProcess = null;
let hubStopRequested = false;
let repoPath = null;
let isFullScreen = false;

const configPath = () => path.join(app.getPath("userData"), "openarcade-config.json");
const logDir = () => path.join(app.getPath("userData"), "OpenArcade", "logs");

function ensureLogDir() {
  const dir = logDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function logToFile(filename, text) {
  try {
    const dir = ensureLogDir();
    const file = path.join(dir, filename);
    const line = `[${new Date().toISOString()}] ${text}\n`;
    fs.appendFileSync(file, line);
  } catch (e) {
    console.error("Log write failed:", e.message);
  }
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(configPath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return { repoPath: null, port: "3000", shareLink: "" };
  }
}

function saveConfig(config) {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2));
}

function getDefaultRepoPath() {
  return path.join(app.getPath("desktop"), "OpenArcade");
}

/** Move contents of dir/OpenArcade-main up into dir so repo root is dir (one folder). */
function flattenExtract(dir) {
  const inner = path.join(dir, "OpenArcade-main");
  if (!fs.existsSync(inner)) return;
  const entries = fs.readdirSync(inner, { withFileTypes: true });
  for (const e of entries) {
    const src = path.join(inner, e.name);
    const dest = path.join(dir, e.name);
    if (fs.existsSync(dest)) {
      if (e.isDirectory()) fs.rmSync(dest, { recursive: true });
      else fs.unlinkSync(dest);
    }
    fs.renameSync(src, dest);
  }
  fs.rmSync(inner, { recursive: true });
}

function registerAppProtocol() {
  const distDir = path.join(__dirname, "..", "dist");
  protocol.handle("app", (request) => {
    const u = new URL(request.url);
    let p = u.pathname.replace(/^\/+/, "").replace(/%2f/gi, "/") || "index.html";
    if (p === "" || p.endsWith("/")) p += "index.html";
    const filePath = path.join(distDir, p);
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.js");
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    frame: false,
    fullscreenable: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "OpenArcade",
    show: false,
  });

  if (useViteServer) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL("app://./index.html");
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
  });
  mainWindow.on("maximize", () => {
    isFullScreen = true;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("fullscreen-changed", true);
  });
  mainWindow.on("unmaximize", () => {
    isFullScreen = false;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("fullscreen-changed", false);
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
    stopHub();
  });
}

/** Kill the hub process and its entire tree so the port and install folder are released. */
function stopHub() {
  if (!hubProcess) return;
  const proc = hubProcess;
  hubProcess = null;
  try {
    if (os.platform() === "win32") {
      execSync(`taskkill /PID ${proc.pid} /T /F`, { windowsHide: true, stdio: "ignore" });
    } else {
      proc.kill("SIGTERM");
    }
  } catch (_) {
    try {
      proc.kill("SIGKILL");
    } catch (_) {}
  }
}

// ---- Prerequisites ----
ipcMain.handle("check-node", async () => {
  return new Promise((resolve) => {
    const proc = spawn("node", ["-v"], { shell: true, windowsHide: true });
    let out = "";
    let err = "";
    proc.stdout?.on("data", (d) => { out += d; });
    proc.stderr?.on("data", (d) => { err += d; });
    proc.on("close", (code) => {
      const version = (out || err).trim().replace(/^v/, "");
      resolve({ ok: code === 0, version: version || null, error: code !== 0 ? (err || "Node not found") : null });
    });
    proc.on("error", (e) => resolve({ ok: false, version: null, error: e.message }));
  });
});

// ---- Config ----
ipcMain.handle("get-config", () => {
  const cfg = loadConfig();
  repoPath = cfg.repoPath || getDefaultRepoPath();
  return { ...cfg, repoPath: repoPath || getDefaultRepoPath() };
});

ipcMain.handle("set-repo-path", (_e, newPath) => {
  const cfg = loadConfig();
  cfg.repoPath = newPath || getDefaultRepoPath();
  saveConfig(cfg);
  repoPath = cfg.repoPath;
  return cfg;
});

/** Returns { found: boolean, path: string | null } if repo path exists and has hub/package.json */
ipcMain.handle("check-existing-repo", () => {
  const cfg = loadConfig();
  const dir = cfg.repoPath || getDefaultRepoPath();
  if (!dir || !fs.existsSync(dir)) return { found: false, path: null };
  const hubPkg = path.join(dir, "hub", "package.json");
  if (!fs.existsSync(hubPkg)) return { found: false, path: null };
  return { found: true, path: dir };
});

ipcMain.handle("choose-repo-folder", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select OpenArcade folder (folder that contains hub and games)",
  });
  if (canceled || !filePaths.length) return null;
  const chosen = filePaths[0];
  const hubDir = path.join(chosen, "hub");
  if (!fs.existsSync(hubDir)) {
    return { error: "This folder doesn't contain a hub. Choose the OpenArcade repo root." };
  }
  const cfg = loadConfig();
  cfg.repoPath = chosen;
  saveConfig(cfg);
  repoPath = chosen;
  return { path: chosen };
});

/** Choose where to install OpenArcade (for download). Folder can be empty. */
ipcMain.handle("choose-install-location", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"],
    title: "Choose where to install OpenArcade",
    buttonLabel: "Select folder",
  });
  if (canceled || !filePaths.length) return null;
  const chosen = filePaths[0];
  const cfg = loadConfig();
  cfg.repoPath = chosen;
  saveConfig(cfg);
  repoPath = chosen;
  return { path: chosen };
});

// ---- Download ----
ipcMain.handle("download-repo", async (_e, targetDir) => {
  const cfg = loadConfig();
  const dir = targetDir || cfg.repoPath || getDefaultRepoPath();
  const zipPath = path.join(app.getPath("temp"), "OpenArcade-main.zip");

  return new Promise((resolve, reject) => {
    function fail(msg) {
      resolve({ ok: false, error: msg });
    }
    function send(ev) {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("download-progress", ev);
    }

    send({ phase: "downloading" });
    const file = fs.createWriteStream(zipPath);

    function doFetch(url, redirectCount) {
      const maxRedirects = 5;
      if (redirectCount > maxRedirects) {
        file.close();
        fs.unlink(zipPath, () => {});
        return fail("Too many redirects");
      }
      const parsed = new URL(url);
      const lib = parsed.protocol === "https:" ? https : http;
      const req = lib.get(url, { headers: { "User-Agent": "OpenArcade-Desktop/1.0" } }, (res) => {
        const code = res.statusCode;
        if (code >= 300 && code < 400 && res.headers.location) {
          res.resume();
          const next = new URL(res.headers.location, url).toString();
          return doFetch(next, redirectCount + 1);
        }
        if (code !== 200) {
          file.close();
          fs.unlink(zipPath, () => {});
          return fail(`Download failed: HTTP ${code}`);
        }
        const total = parseInt(res.headers["content-length"], 10) || 0;
        let done = 0;
        res.on("data", (chunk) => {
          done += chunk.length;
          if (total) send({ phase: "downloading", percent: Math.round((100 * done) / total) });
        });
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          send({ phase: "extracting" });
          extractZip(zipPath, dir)
            .then(() => {
              flattenExtract(dir);
              fs.unlink(zipPath, () => {});
              send({ phase: "done" });
              const repoRoot = dir;
              const cfg = loadConfig();
              cfg.repoPath = repoRoot;
              saveConfig(cfg);
              repoPath = repoRoot;
              logToFile("download.log", `Downloaded and extracted to ${repoRoot}`);
              resolve({ ok: true, path: repoRoot });
            })
            .catch((err) => {
              fs.unlink(zipPath, () => {});
              logToFile("errors.log", `Download failed: ${err.message}`);
              fail(err.message || "Extract failed");
            });
        });
      });
      req.on("error", (err) => {
        file.close();
        fs.unlink(zipPath, () => {});
        logToFile("errors.log", `Download failed: ${err.message}`);
        fail(err.message);
      });
    }

    doFetch(REPO_ZIP, 0);
  });
});

/** Path to the node executable (for spawning hub without shell so we can kill it cleanly). */
function getNodePath() {
  try {
    const nodeDir = execSync('node -p "path.dirname(process.execPath)"', {
      encoding: "utf8",
      windowsHide: true,
    }).trim();
    if (nodeDir) {
      return path.join(nodeDir, process.platform === "win32" ? "node.exe" : "node");
    }
  } catch (_) {
    if (process.platform === "win32") {
      try {
        const out = execSync("where node", { encoding: "utf8", windowsHide: true, shell: true });
        const first = out.split("\n")[0].trim();
        if (first) return first;
      } catch (_) {}
    }
  }
  return "node";
}

/** Get env with Node/npm directory prepended to PATH so spawned npm finds node. */
function getInstallEnv() {
  const base = { ...process.env };
  let nodeDir = null;
  try {
    nodeDir = execSync('node -p "path.dirname(process.execPath)"', {
      encoding: "utf8",
      windowsHide: true,
    }).trim();
  } catch (_) {
    if (process.platform === "win32") {
      try {
        const out = execSync("where node", {
          encoding: "utf8",
          windowsHide: true,
          shell: true,
        });
        const first = out.split("\n")[0].trim();
        if (first) nodeDir = path.dirname(first);
      } catch (_) {}
    }
  }
  if (nodeDir) {
    const sep = process.platform === "win32" ? ";" : ":";
    const pathValue = nodeDir + sep + (base.PATH || base.Path || "");
    base.PATH = pathValue;
    if (process.platform === "win32") base.Path = pathValue;
  }
  return base;
}

function extractZip(zipPath, outDir) {
  return new Promise((resolve, reject) => {
    const AdmZip = require("adm-zip");
    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(outDir, true);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

// ---- Install ----
ipcMain.handle("install-deps", async () => {
  const cfg = loadConfig();
  const root = cfg.repoPath || getDefaultRepoPath();
  const hubDir = path.join(root, "hub");
  const appDir = path.join(root, "hub", "app");
  if (!fs.existsSync(hubDir)) {
    return { ok: false, error: "Hub folder not found. Download OpenArcade first." };
  }

  const installLogPath = path.join(ensureLogDir(), `install-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
  function appendInstallLog(text) {
    try {
      fs.appendFileSync(installLogPath, text);
    } catch (_) {}
  }

  const installEnv = getInstallEnv();

  function run(cwd, cmd, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, { cwd, shell: true, windowsHide: true, env: installEnv });
      let out = "";
      let err = "";
      proc.stdout?.on("data", (d) => {
        const s = d.toString();
        out += s;
        appendInstallLog(s);
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("install-log", { type: "stdout", text: s });
      });
      proc.stderr?.on("data", (d) => {
        const s = d.toString();
        err += s;
        appendInstallLog(s);
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("install-log", { type: "stderr", text: s });
      });
      proc.on("close", (code) => {
        if (code !== 0) reject(new Error(err || out || `Exit ${code}`));
        else resolve();
      });
      proc.on("error", (e) => reject(e));
    });
  }

  try {
    appendInstallLog(`\n--- Install started at ${new Date().toISOString()} (cwd: ${root}) ---\n`);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("install-log", { type: "step", text: "Installing hub dependencies..." });
    appendInstallLog("Installing hub dependencies (--ignore-scripts to avoid PATH issues)...\n");
    await run(hubDir, "npm", ["install", "--ignore-scripts"]);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("install-log", { type: "step", text: "Installing UI dependencies..." });
    appendInstallLog("Installing UI dependencies...\n");
    await run(appDir, "npm", ["install"]);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("install-log", { type: "step", text: "Building UI..." });
    appendInstallLog("Building UI...\n");
    await run(hubDir, "npm", ["run", "build:ui"]);
    appendInstallLog("Install completed successfully.\n");
    repoPath = root;
    const config = loadConfig();
    config.repoPath = repoPath;
    saveConfig(config);
    return { ok: true };
  } catch (e) {
    appendInstallLog(`\nInstall FAILED: ${e.message}\n`);
    logToFile("errors.log", `Install failed: ${e.message}`);
    return { ok: false, error: e.message || "Install failed" };
  }
});

/** Get PIDs of processes listening on the given port. */
function getPidsOnPort(port) {
  const portNum = parseInt(port, 10);
  if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) return [];
  const pids = new Set();
  try {
    if (os.platform() === "win32") {
      const out = execSync("netstat -ano", { encoding: "utf8", windowsHide: true });
      for (const line of out.split("\n")) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 5 || parts[3] !== "LISTENING") continue;
        const localAddr = parts[1];
        if (!localAddr.endsWith(":" + portNum)) continue;
        const pid = parseInt(parts[parts.length - 1], 10);
        if (Number.isInteger(pid) && pid > 0) pids.add(pid);
      }
    } else {
      const out = execSync(`lsof -i :${portNum} -t`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
      for (const s of out.trim().split(/\s+/)) {
        const pid = parseInt(s, 10);
        if (Number.isInteger(pid) && pid > 0) pids.add(pid);
      }
    }
  } catch (_) {
    return [];
  }
  return [...pids];
}

// ---- Hub process ----
ipcMain.handle("check-port-in-use", (_e, port) => {
  const pids = getPidsOnPort(port);
  return { inUse: pids.length > 0, pids };
});

ipcMain.handle("kill-process-on-port", (_e, port) => {
  const pids = getPidsOnPort(port);
  if (pids.length === 0) return { ok: true };
  try {
    if (os.platform() === "win32") {
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /T /F`, { windowsHide: true, stdio: "ignore" });
      }
    } else {
      for (const pid of pids) {
        process.kill(pid, "SIGTERM");
      }
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || "Failed to kill process" };
  }
});

ipcMain.handle("start-hub", async () => {
  const cfg = loadConfig();
  const root = cfg.repoPath || getDefaultRepoPath();
  const hubDir = path.join(root, "hub");
  const hubIndex = path.join(hubDir, "src", "index.js");
  if (!fs.existsSync(hubDir)) {
    return { ok: false, error: "Hub folder not found. Run the Install step first." };
  }
  if (!fs.existsSync(hubIndex)) {
    return { ok: false, error: "Hub not found. Run the Install step first." };
  }

  stopHub();
  const port = (cfg.port || "3000").trim() || "3000";
  const env = { ...process.env, PORT: port };
  if (cfg.shareLink) env.PLAY_URL = cfg.shareLink;

  const hubLogPath = path.join(ensureLogDir(), `hub-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
  function appendHubLog(text) {
    try {
      fs.appendFileSync(hubLogPath, text);
    } catch (_) {}
  }
  appendHubLog(`Hub started at ${new Date().toISOString()} (port ${port}, cwd: ${hubDir})\n`);

  const scriptPath = path.join(hubDir, "src", "index.js");
  const nodePath = getNodePath();
  hubProcess = spawn(nodePath, [scriptPath], {
    cwd: hubDir,
    env,
    windowsHide: true,
  });

  let hubStderrBuffer = "";
  hubProcess.stdout?.on("data", (d) => {
    const s = d.toString();
    appendHubLog(s);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("hub-log", s);
  });
  hubProcess.stderr?.on("data", (d) => {
    const s = d.toString();
    hubStderrBuffer += s;
    if (hubStderrBuffer.length > 2000) hubStderrBuffer = hubStderrBuffer.slice(-2000);
    appendHubLog(s);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("hub-log", s);
  });
  hubProcess.on("close", (code) => {
    appendHubLog(`\nHub process exited with code ${code}\n`);
    hubProcess = null;
    if (hubStopRequested) {
      hubStopRequested = false;
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("hub-stopped", 0);
      return;
    }
    let message;
    if (code === 1 && hubStderrBuffer.includes("EADDRINUSE")) {
      message = `Port ${port} is already in use. Try a different port in Settings (step 4).`;
    }
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("hub-stopped", code, message);
  });
  hubProcess.on("error", (e) => {
    logToFile("errors.log", `Hub start failed: ${e.message}`);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("hub-stopped", e.message);
  });

  return { ok: true, port };
});

ipcMain.handle("stop-hub", () => {
  hubStopRequested = !!hubProcess;
  stopHub();
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("hub-stopped", 0);
  return { ok: true };
});

ipcMain.handle("hub-running", () => ({ running: !!hubProcess }));

ipcMain.handle("save-config", (_e, updates) => {
  const cfg = { ...loadConfig(), ...updates };
  saveConfig(cfg);
  return cfg;
});

ipcMain.handle("open-external", (_e, url) => {
  shell.openExternal(url);
});

ipcMain.handle("close-window", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});
ipcMain.handle("copy-to-clipboard", (_e, text) => {
  if (text != null && typeof text === "string") {
    clipboard.writeText(text);
    return true;
  }
  return false;
});
ipcMain.handle("set-fullscreen", (_e, flag) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const wantExpanded = !!flag;
  if (wantExpanded) {
    mainWindow.maximize();
    isFullScreen = true;
    mainWindow.webContents.send("fullscreen-changed", true);
  } else {
    mainWindow.unmaximize();
    mainWindow.setSize(1440, 960);
    isFullScreen = false;
    mainWindow.webContents.send("fullscreen-changed", false);
  }
});
ipcMain.handle("toggle-fullscreen", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    mainWindow.setSize(1440, 960);
    isFullScreen = false;
    mainWindow.webContents.send("fullscreen-changed", false);
  } else {
    mainWindow.maximize();
    isFullScreen = true;
    mainWindow.webContents.send("fullscreen-changed", true);
  }
});

ipcMain.handle("get-log-dir", () => {
  ensureLogDir();
  return logDir();
});

ipcMain.handle("open-log-folder", () => {
  shell.openPath(logDir());
});

/** Return content of the most recent hub-*.log file for copy-to-clipboard. */
ipcMain.handle("get-latest-hub-log", () => {
  try {
    const dir = logDir();
    if (!fs.existsSync(dir)) return "";
    const files = fs.readdirSync(dir)
      .filter((f) => f.startsWith("hub-") && f.endsWith(".log"))
      .map((f) => ({ name: f, path: path.join(dir, f), mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    if (files.length === 0) return "";
    return fs.readFileSync(files[0].path, "utf8");
  } catch (_) {
    return "";
  }
});

function httpGet(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function httpPost(port, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(`http://127.0.0.1:${port}${path}`);
    const opts = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error("Timeout")); });
    req.write(JSON.stringify(body));
    req.end();
  });
}

ipcMain.handle("hub-api-games", (_e, port) => {
  return httpGet(port || "3000", "/api/games").catch(() => []);
});

ipcMain.handle("hub-api-state", (_e, port) => {
  return httpGet(port || "3000", "/api/state").catch(() => ({ activeGameId: null }));
});

ipcMain.handle("hub-api-set-active", (_e, port, gameId) => {
  return httpPost(port || "3000", "/api/active-game", { gameId });
});

app.whenReady().then(() => {
  ensureLogDir();
  if (!useViteServer) registerAppProtocol();
  createWindow();
});
app.on("window-all-closed", () => { app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
