const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("openarcade", {
  checkNode: () => ipcRenderer.invoke("check-node"),
  getConfig: () => ipcRenderer.invoke("get-config"),
  setRepoPath: (path) => ipcRenderer.invoke("set-repo-path", path),
  checkExistingRepo: () => ipcRenderer.invoke("check-existing-repo"),
  chooseRepoFolder: () => ipcRenderer.invoke("choose-repo-folder"),
  chooseInstallLocation: () => ipcRenderer.invoke("choose-install-location"),
  downloadRepo: (targetDir) => ipcRenderer.invoke("download-repo", targetDir),
  onDownloadProgress: (cb) => {
    ipcRenderer.on("download-progress", (_e, ev) => cb(ev));
  },
  installDeps: () => ipcRenderer.invoke("install-deps"),
  onInstallLog: (cb) => {
    ipcRenderer.on("install-log", (_e, ev) => cb(ev));
  },
  checkPortInUse: (port) => ipcRenderer.invoke("check-port-in-use", port),
  killProcessOnPort: (port) => ipcRenderer.invoke("kill-process-on-port", port),
  startHub: () => ipcRenderer.invoke("start-hub"),
  stopHub: () => ipcRenderer.invoke("stop-hub"),
  hubRunning: () => ipcRenderer.invoke("hub-running"),
  onHubStopped: (cb) => {
    ipcRenderer.on("hub-stopped", (_e, code, message) => cb(code, message));
  },
  saveConfig: (updates) => ipcRenderer.invoke("save-config", updates),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  setFullScreen: (flag) => ipcRenderer.invoke("set-fullscreen", flag),
  onFullScreenChange: (cb) => {
    ipcRenderer.on("fullscreen-changed", (_e, flag) => cb(flag));
  },
  getLogDir: () => ipcRenderer.invoke("get-log-dir"),
  openLogFolder: () => ipcRenderer.invoke("open-log-folder"),
  getLatestHubLog: () => ipcRenderer.invoke("get-latest-hub-log"),
  copyToClipboard: (text) => ipcRenderer.invoke("copy-to-clipboard", text),
  hubApiGames: (port) => ipcRenderer.invoke("hub-api-games", port),
  hubApiState: (port) => ipcRenderer.invoke("hub-api-state", port),
  hubApiSetActive: (port, gameId) => ipcRenderer.invoke("hub-api-set-active", port, gameId),
});
