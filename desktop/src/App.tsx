import { useEffect, useState, useCallback, useRef } from "react";

const TOTAL_STEPS = 5;

interface NodeCheck {
  ok: boolean;
  version: string | null;
  error: string | null;
}

interface GameManifest {
  id: string;
  name: string;
  version?: string;
  description?: string;
  author?: string;
  wip?: boolean;
}

declare global {
  interface Window {
    openarcade?: {
      checkNode: () => Promise<{ ok: boolean; version: string | null; error: string | null }>;
      getConfig: () => Promise<{ repoPath: string; port: string; shareLink: string }>;
      setRepoPath: (path: string) => Promise<unknown>;
      checkExistingRepo: () => Promise<{ found: boolean; path: string | null }>;
      chooseRepoFolder: () => Promise<{ path: string } | { error: string } | null>;
      chooseInstallLocation: () => Promise<{ path: string } | null>;
      downloadRepo: (targetDir?: string) => Promise<{ ok: boolean; path?: string; error?: string }>;
      onDownloadProgress: (cb: (ev: { phase: string; percent?: number }) => void) => void;
      installDeps: () => Promise<{ ok: boolean; error?: string }>;
      onInstallLog: (cb: (ev: { type: string; text: string }) => void) => void;
      checkPortInUse: (port: string) => Promise<{ inUse: boolean; pids: number[] }>;
      killProcessOnPort: (port: string) => Promise<{ ok: boolean; error?: string }>;
      startHub: () => Promise<{ ok: boolean; port?: string; error?: string }>;
      stopHub: () => Promise<{ ok: boolean }>;
      hubRunning: () => Promise<{ running: boolean }>;
      onHubStopped: (cb: (code: number | string, message?: string) => void) => void;
      saveConfig: (updates: { port?: string; shareLink?: string }) => Promise<unknown>;
      openExternal: (url: string) => Promise<void>;
      closeWindow: () => Promise<void>;
      setFullScreen: (flag: boolean) => Promise<void>;
      onFullScreenChange: (cb: (flag: boolean) => void) => void;
      getLogDir: () => Promise<string>;
      openLogFolder: () => Promise<string>;
      getLatestHubLog: () => Promise<string>;
      copyToClipboard: (text: string) => Promise<boolean>;
      hubApiGames: (port: string) => Promise<GameManifest[]>;
      hubApiState: (port: string) => Promise<{ activeGameId: string | null }>;
      hubApiSetActive: (port: string, gameId: string) => Promise<{ activeGameId: string }>;
    };
  }
}

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [nodeCheck, setNodeCheck] = useState<NodeCheck | null>(null);
  const [config, setConfig] = useState<{ repoPath: string; port: string; shareLink: string } | null>(null);
  const [repoPath, setRepoPathState] = useState("");
  const [downloadPhase, setDownloadPhase] = useState<"idle" | "downloading" | "extracting" | "done" | "error">("idle");
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [downloadError, setDownloadError] = useState("");
  const [installLog, setInstallLog] = useState<string[]>([]);
  const [installRunning, setInstallRunning] = useState(false);
  const [installDone, setInstallDone] = useState(false);
  const [hubRunning, setHubRunning] = useState(false);
  const [hubPort, setHubPort] = useState("3000");
  const [games, setGames] = useState<GameManifest[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [repoCheckLoading, setRepoCheckLoading] = useState(false);
  const [existingRepoPath, setExistingRepoPath] = useState<string | null>(null);
  const [hubStartError, setHubStartError] = useState<string | null>(null);
  const [hubStoppedError, setHubStoppedError] = useState<string | null>(null);
  const [portInUsePrompt, setPortInUsePrompt] = useState<string | null>(null);
  const [portKillLoading, setPortKillLoading] = useState(false);
  const installLogRef = useRef<HTMLPreElement>(null);

  const api = typeof window !== "undefined" ? window.openarcade : undefined;

  const installFailed = !installDone && !installRunning && installLog.length > 0;
  const installLogText = installLog.join("");

  const handleCopyInstallLog = async () => {
    if (!installLogText || !api) return;
    try {
      const ok = await api.copyToClipboard(installLogText);
      setCopyFeedback(!!ok);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      setCopyFeedback(false);
    }
  };

  const handleCopyHubLog = async () => {
    if (!api) return;
    try {
      const logText = await api.getLatestHubLog();
      const text = logText || "No hub log found. Open the log folder to see files.";
      const ok = await api.copyToClipboard(text);
      setCopyFeedback(!!ok);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      setCopyFeedback(false);
    }
  };

  if (!api) {
    return (
      <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-end px-4 py-3 border-b border-zinc-800">
          <button
            type="button"
            onClick={() => window.openarcade?.closeWindow?.()}
            className="w-8 h-8 rounded flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-10">
          <h1 className="text-2xl font-semibold text-zinc-100 mb-3">OpenArcade</h1>
          <p className="text-lg text-zinc-400 text-center max-w-lg leading-relaxed">
            The app could not connect to the launcher. Try closing and reopening OpenArcade.
          </p>
        </div>
      </div>
    );
  }

  const loadConfig = useCallback(async () => {
    const c = await api.getConfig();
    setConfig(c);
    setRepoPathState(c.repoPath ?? "");
  }, [api]);

  const MIN_SCAN_MS = 900;

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
    (async () => {
      const result = await api.checkNode();
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_SCAN_MS - elapsed);
      if (wait) await new Promise((r) => setTimeout(r, wait));
      if (!cancelled) {
        setNodeCheck(result);
        await loadConfig();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, loadConfig]);

  useEffect(() => {
    api.onDownloadProgress((ev) => {
      if (ev.phase === "downloading") setDownloadPhase("downloading");
      if (ev.phase === "extracting") setDownloadPhase("extracting");
      if (ev.phase === "done") {
        setDownloadPhase("done");
        loadConfig();
      }
      if (ev.percent != null) setDownloadPercent(ev.percent);
    });
  }, [api, loadConfig]);

  useEffect(() => {
    if (currentStep !== 2 || !config) return;
    let cancelled = false;
    setExistingRepoPath(null);
    setRepoCheckLoading(true);
    const start = Date.now();
    (async () => {
      await new Promise((r) => setTimeout(r, MIN_SCAN_MS));
      if (cancelled) return;
      const { found, path: p } = await api.checkExistingRepo();
      const elapsed = Date.now() - start;
      const extra = Math.max(0, MIN_SCAN_MS - elapsed);
      if (extra) await new Promise((r) => setTimeout(r, extra));
      if (!cancelled) {
        setRepoCheckLoading(false);
        if (found && p) setExistingRepoPath(p);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentStep, config?.repoPath, api]);

  useEffect(() => {
    api.onInstallLog((ev) => {
      setInstallLog((prev) => [...prev, (ev.type === "step" ? "\n→ " : "") + ev.text]);
    });
  }, [api]);

  useEffect(() => {
    if (installLogRef.current) {
      installLogRef.current.scrollTop = installLogRef.current.scrollHeight;
    }
  }, [installLog]);

  useEffect(() => {
    const check = async () => {
      const { running } = await api.hubRunning();
      setHubRunning(running);
    };
    const id = setInterval(check, 1500);
    return () => clearInterval(id);
  }, [api]);

  useEffect(() => {
    api.onHubStopped((codeOrMessage, message) => {
      setHubRunning(false);
      const code = typeof codeOrMessage === "number" ? codeOrMessage : null;
      const isError = code !== 0 && code !== null;
      const msg =
        message ||
        (isError
          ? "Hub stopped unexpectedly. Check the log folder for details."
          : typeof codeOrMessage === "string" && codeOrMessage
            ? codeOrMessage
            : null);
      setHubStoppedError(msg || null);
    });
  }, [api]);

  useEffect(() => {
    if (!api?.onFullScreenChange) return;
    api.onFullScreenChange((flag) => setFullscreen(flag));
  }, [api]);

  const loadAdminData = useCallback(async () => {
    if (!api || !hubPort) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const [g, s] = await Promise.all([api.hubApiGames(hubPort), api.hubApiState(hubPort)]);
      setGames(Array.isArray(g) ? g : []);
      setActiveGameId(s?.activeGameId ?? null);
    } catch {
      setAdminError("Could not load games.");
    } finally {
      setAdminLoading(false);
    }
  }, [api, hubPort]);

  useEffect(() => {
    if (hubRunning && currentStep === 5) loadAdminData();
  }, [hubRunning, currentStep, loadAdminData]);

  const handleSetActiveGame = async (gameId: string) => {
    if (!api) return;
    try {
      await api.hubApiSetActive(hubPort, gameId);
      setActiveGameId(gameId);
    } catch {
      setAdminError("Failed to set active game.");
    }
  };

  const handleDownload = async () => {
    setDownloadPhase("downloading");
    setDownloadError("");
    const result = await api.downloadRepo();
    if (!result.ok) {
      setDownloadPhase("error");
      setDownloadError(result.error || "Download failed");
    } else if (result.path) {
      setRepoPathState(result.path);
    }
  };

  const handleChooseFolder = async () => {
    const result = await api.chooseRepoFolder();
    if (result && "path" in result) {
      setRepoPathState(result.path);
      loadConfig();
      setDownloadError("");
    } else if (result && "error" in result) {
      setDownloadError(result.error);
    }
  };

  const handleChooseInstallLocation = async () => {
    const result = await api.chooseInstallLocation();
    if (result && "path" in result) {
      setRepoPathState(result.path);
      loadConfig();
      setDownloadError("");
    }
  };

  const handleInstall = async () => {
    setInstallLog([]);
    setInstallRunning(true);
    setInstallDone(false);
    const result = await api.installDeps();
    setInstallRunning(false);
    setInstallDone(result.ok);
    if (!result.ok) {
      setInstallLog((prev) => [...prev, "\n✗ " + (result.error || "Install failed")]);
    }
  };

  const handleStartHub = async () => {
    setHubStartError(null);
    setHubStoppedError(null);
    setPortInUsePrompt(null);
    const port = config?.port?.trim() || "3000";
    const { inUse } = await api.checkPortInUse(port);
    if (inUse) {
      setPortInUsePrompt(port);
      return;
    }
    const result = await api.startHub();
    if (result.ok && result.port) {
      setHubPort(result.port);
      setHubRunning(true);
    } else {
      setHubRunning(false);
      setHubStartError(result.error || "Hub failed to start.");
    }
  };

  const handleKillPortAndStart = async () => {
    const port = portInUsePrompt || config?.port?.trim() || "3000";
    if (!port) return;
    setPortKillLoading(true);
    setHubStartError(null);
    setHubStoppedError(null);
    try {
      const killResult = await api.killProcessOnPort(port);
      if (!killResult.ok) {
        setHubStartError(killResult.error || "Failed to free port.");
        setPortInUsePrompt(null);
        setPortKillLoading(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
      const result = await api.startHub();
      setPortInUsePrompt(null);
      if (result.ok && result.port) {
        setHubPort(result.port);
        setHubRunning(true);
      } else {
        setHubStartError(result.error || "Hub failed to start.");
      }
    } finally {
      setPortKillLoading(false);
    }
  };

  const handleStopHub = async () => {
    await api.stopHub();
    setHubRunning(false);
    setHubStartError(null);
    setHubStoppedError(null);
  };

  const handleSaveShareLink = (value: string) => {
    api.saveConfig({ shareLink: value });
    setConfig((c) => (c ? { ...c, shareLink: value } : c));
  };

  const handleSavePort = (value: string) => {
    api.saveConfig({ port: value });
    setConfig((c) => (c ? { ...c, port: value } : c));
  };

  const nodeOk = nodeCheck?.ok ?? false;
  const hasRepo = !!(repoPath || config?.repoPath);
  const isDownloading =
    currentStep === 2 && (downloadPhase === "downloading" || downloadPhase === "extracting");
  const isScanning =
    (currentStep === 1 && nodeCheck == null) ||
    (currentStep === 2 && repoCheckLoading) ||
    (currentStep === 5 && hubRunning && adminLoading);
  const isInstalling = currentStep === 3 && installRunning;

  const showSuccessIcon =
    (currentStep === 1 && nodeOk) ||
    (currentStep === 2 && (downloadPhase === "done" || hasRepo)) ||
    (currentStep === 3 && installDone);

  return (
    <div className="h-screen text-zinc-100 flex flex-col overflow-hidden bg-transparent">
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md transition-colors duration-200"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100 select-none">OpenArcade</h1>
        <div style={{ WebkitAppRegion: "no-drag" }} className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const next = !fullscreen;
              setFullscreen(next);
              api.setFullScreen(next);
            }}
            className="w-9 h-9 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {fullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M4 4h8v8H4V4z M12 12h8v8h-8v-8z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M3 3h18v18H3V3z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => api.closeWindow()}
            className="w-9 h-9 rounded flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden px-6 py-5 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div key={currentStep} className="w-full max-w-md mx-auto min-h-full flex flex-col items-center justify-center gap-5 py-4 animate-step-in">
          {/* Monitor - top */}
          <div className="flex-shrink-0 flex flex-col items-center">
            {/* Monitor frame (bezel) */}
            <div
              className={`relative rounded-lg border-2 border-zinc-600 bg-zinc-700/90 shadow-xl transition-all duration-300 ${
                showSuccessIcon ? "animate-success-pop border-blue-500/40 shadow-blue-500/10" : ""
              }`}
              style={{ padding: "10px 10px 8px 10px" }}
            >
              {/* Screen area */}
              <div
                className={`relative w-40 h-28 rounded overflow-hidden flex items-center justify-center transition-all duration-300 ${
                  (currentStep === 3 && installFailed) || (currentStep === 2 && downloadError)
                    ? "bg-zinc-950 border border-amber-500/40"
                    : "bg-black/90 border border-zinc-600"
                }`}
              >
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="animate-scan-line bg-gradient-to-b from-blue-500/30 via-blue-400/50 to-blue-500/30" />
                  </div>
                )}
                {(isDownloading || isInstalling) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin-slow" />
                    {isDownloading && <span className="text-xs font-medium text-blue-400">{downloadPercent}%</span>}
                  </div>
                )}
                {!isScanning && !isInstalling && currentStep === 3 && installFailed && (
                  <span className="text-sm font-medium text-amber-400 text-center px-2">Install failed</span>
                )}
                {!isScanning && !isInstalling && currentStep === 2 && downloadError && (
                  <span className="text-sm font-medium text-amber-400 text-center px-2">Error</span>
                )}
                {!isScanning && !isInstalling && currentStep === 1 && nodeCheck != null && (
                  <span className="text-2xl">{nodeOk ? "✓" : "⬇"}</span>
                )}
                {!isScanning && !isInstalling && currentStep === 2 && (downloadPhase === "done" || hasRepo) && !downloadError && (
                  <span className="text-2xl">✓</span>
                )}
                {!isScanning && !isInstalling && currentStep === 3 && !installFailed && (
                  installDone ? <span className="text-2xl">✓</span> : <span className="text-2xl text-zinc-500">📦</span>
                )}
                {!isScanning && !isInstalling && currentStep === 4 && (
                  <span className="text-2xl">⚙</span>
                )}
                {!isScanning && !isInstalling && currentStep === 5 && (
                  <span className="text-2xl">{hubRunning ? "🎮" : "▶"}</span>
                )}
              </div>
              {/* Monitor stand */}
              <div className="flex justify-center mt-1.5">
                <div className="w-12 h-1.5 rounded-b bg-zinc-600" />
              </div>
            </div>
            {(isScanning || isDownloading || isInstalling) && (
              <p className="mt-2 text-sm text-zinc-500">
                {currentStep === 1 && "Checking for Node.js…"}
                {currentStep === 2 && (isDownloading ? (downloadPhase === "extracting" ? "Extracting…" : `Downloading… ${downloadPercent}%`) : repoCheckLoading ? "Looking for OpenArcade…" : null)}
                {currentStep === 3 && isInstalling && "Installing…"}
                {currentStep === 5 && "Loading games…"}
              </p>
            )}
          </div>

          {/* Content: heading → subtitle → progress → actions (vertical stack) */}
          <div className="w-full flex flex-col items-center text-center gap-3">
            <h2 className="text-xl font-semibold text-zinc-100">
                {currentStep === 1 && (nodeCheck == null ? "Checking Node.js…" : nodeOk ? "Node.js is ready." : "We couldn't find Node.js.")}
                {currentStep === 2 && (repoCheckLoading ? "Looking for OpenArcade…" : downloadPhase === "downloading" || downloadPhase === "extracting" ? "Getting OpenArcade…" : hasRepo ? "OpenArcade is ready." : "Get OpenArcade")}
                {currentStep === 3 && (installRunning ? "Installing…" : installDone ? "Install complete." : installFailed ? "Something went wrong." : "Install")}
                {currentStep === 4 && "Settings"}
                {currentStep === 5 && (!hubRunning ? "You're all set." : hubRunning && adminLoading ? "Loading games…" : "Pick a game.")}
            </h2>
            <p className="text-base text-zinc-500 mb-3">
              {currentStep === 1 && (nodeCheck == null ? "Checking if Node.js is installed…" : nodeOk ? "You're good to go." : "Install it first, then run this setup again.")}
              {currentStep === 2 && (repoCheckLoading ? "Checking for an existing OpenArcade folder…" : downloadPhase === "downloading" || downloadPhase === "extracting" ? "Downloading from GitHub…" : "Download from GitHub or choose a folder where you have it.")}
              {currentStep === 3 && (installRunning ? "This may take a minute." : installDone ? "Click Next to continue." : "Installs everything the hub needs.")}
              {currentStep === 4 && "Port and optional share link for friends online."}
              {currentStep === 5 && (!hubRunning ? "Start the hub, then pick a game and share the link." : "That's what players will see when they join.")}
            </p>

            {/* Actions - stacked below, full width (step 2: only after repo check is done) */}
            <div className="flex flex-col gap-4 w-full">
              {currentStep === 1 && nodeCheck != null && !nodeOk && (
                <button
                  type="button"
                  onClick={() => api.openExternal("https://nodejs.org")}
                  className="rounded-full bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-500 flex items-center justify-center gap-2 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  Node.js <span aria-hidden>→</span>
                </button>
              )}
              {currentStep === 2 && !repoCheckLoading && (
                <>
                  {existingRepoPath && (
                    <div className="w-full rounded-xl border border-blue-500/40 bg-blue-950/20 p-4 mb-3 text-center">
                      <p className="text-sm font-medium text-blue-300 mb-1">We found OpenArcade</p>
                      <p className="text-xs text-zinc-400 font-mono break-all mb-3" title={existingRepoPath}>
                        {existingRepoPath}
                      </p>
                      <p className="text-sm text-zinc-500 mb-3">Use this location or update from GitHub?</p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRepoPathState(existingRepoPath);
                            setExistingRepoPath(null);
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-all duration-200"
                        >
                          Use this location
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExistingRepoPath(null);
                            handleDownload();
                          }}
                          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-all duration-200"
                        >
                          Update from GitHub
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setExistingRepoPath(null);
                            const result = await api.chooseRepoFolder();
                            if (result && "path" in result) {
                              setRepoPathState(result.path);
                              loadConfig();
                              setDownloadError("");
                            } else if (result && "error" in result) {
                              setDownloadError(result.error);
                            }
                          }}
                          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-all duration-200"
                        >
                          Choose different folder
                        </button>
                      </div>
                    </div>
                  )}
                  {!existingRepoPath && (
                    <>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-zinc-500 mb-1">Install location</p>
                        <p className="text-sm text-zinc-300 font-mono break-all" title={repoPath || config?.repoPath || ""}>
                          {repoPath || config?.repoPath || "—"}
                        </p>
                        <button
                          type="button"
                          onClick={handleChooseInstallLocation}
                          className="mt-1.5 rounded-lg border border-zinc-600 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Change…
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloadPhase === "downloading" || downloadPhase === "extracting"}
                        className="rounded-full bg-zinc-700 px-6 py-3 text-base font-medium text-zinc-100 hover:bg-zinc-600 disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 flex items-center justify-center gap-2 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {downloadPhase === "downloading" ? `${downloadPercent}%` : downloadPhase === "extracting" ? "Extracting…" : "Download from GitHub"} <span aria-hidden>→</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleChooseFolder}
                        className="rounded-full border border-zinc-600 px-6 py-3 text-base font-medium text-zinc-400 hover:bg-zinc-800 flex items-center justify-center gap-2 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                      >
                        I already have OpenArcade here <span aria-hidden>→</span>
                      </button>
                      {hasRepo && (
                        <p className="text-sm text-emerald-500">✓ Ready</p>
                      )}
                      {downloadError && <p className="text-sm text-amber-400">{downloadError}</p>}
                    </>
                  )}
                </>
              )}
              {currentStep === 3 && (
                <>
                  {installFailed && (
                    <div className="rounded-xl border border-amber-500/50 bg-amber-950/20 flex flex-col items-center justify-center text-center gap-4 py-8 px-6 mb-1 min-h-[180px]">
                      <p className="text-base font-medium text-amber-400">Something went wrong</p>
                      <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                        Logs are saved in a log folder. Copy the log below or open the folder when asking for help.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button type="button" onClick={handleCopyInstallLog} className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                          {copyFeedback ? "Copied!" : "Copy log for support"}
                        </button>
                        <button type="button" onClick={() => api.openLogFolder()} className="rounded-lg border border-amber-500/50 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                          Open log folder
                        </button>
                      </div>
                    </div>
                  )}
                  {!installDone && (
                    <button
                      type="button"
                      onClick={handleInstall}
                      disabled={installRunning || !hasRepo}
                      className="rounded-full bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {installRunning ? "Installing…" : "Install"}
                    </button>
                  )}
                  {installLog.length > 0 && (
                    <pre
                      ref={installLogRef}
                      className={`max-h-[28vh] overflow-auto rounded-xl p-3 text-xs whitespace-pre-wrap font-mono text-left mt-2 ${
                        installFailed ? "bg-amber-950/30 border border-amber-500/30 text-amber-200/90" : "bg-zinc-900 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      {installLogText}
                    </pre>
                  )}
                </>
              )}
              {currentStep === 4 && (
                <div className="space-y-3 text-left">
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 mb-1">Port</label>
                    <input
                      type="text"
                      defaultValue={config?.port ?? "3000"}
                      onBlur={(e) => handleSavePort(e.target.value.trim() || "3000")}
                      className="w-full rounded-xl border border-zinc-600 bg-zinc-800/80 backdrop-blur-sm px-3 py-2 text-base text-zinc-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 mb-1">Share link (optional)</label>
                    <input
                      type="url"
                      placeholder="https://…"
                      defaultValue={config?.shareLink ?? ""}
                      onBlur={(e) => handleSaveShareLink(e.target.value.trim())}
                      className="w-full rounded-xl border border-zinc-600 bg-zinc-800/80 backdrop-blur-sm px-3 py-2 text-base text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-200"
                    />
                  </div>
                </div>
              )}
              {currentStep === 5 && (
                <>
                  {!hubRunning ? (
                    <>
                      <button
                        type="button"
                        onClick={handleStartHub}
                        disabled={!!portInUsePrompt || portKillLoading}
                        className="rounded-full bg-emerald-600 px-6 py-3 text-base font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {portKillLoading ? "Starting…" : "Start hub"}
                      </button>
                      {portInUsePrompt && (
                        <div className="w-full rounded-xl border border-amber-500/50 bg-amber-950/20 flex flex-col items-center justify-center text-center gap-4 py-6 px-6">
                          <p className="text-base font-medium text-amber-400">
                            Port {portInUsePrompt} is already in use
                          </p>
                          <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                            Kill the process using this port and start the hub?
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={handleKillPortAndStart}
                              disabled={portKillLoading}
                              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {portKillLoading ? "Starting…" : "Kill and start"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPortInUsePrompt(null)}
                              disabled={portKillLoading}
                              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {(hubStartError || hubStoppedError) && (
                        <div className="w-full rounded-xl border border-amber-500/50 bg-amber-950/20 flex flex-col items-center justify-center text-center gap-4 py-8 px-6 mb-1 min-h-[180px]">
                          <p className="text-base font-medium text-amber-400">Something went wrong</p>
                          <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                            {hubStartError || hubStoppedError}
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={handleCopyHubLog}
                              className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {copyFeedback ? "Copied!" : "Copy log for support"}
                            </button>
                            <button
                              type="button"
                              onClick={() => api.openLogFolder()}
                              className="rounded-lg border border-amber-500/50 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            >
                              Open log folder
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {adminError && <p className="text-sm text-amber-400">{adminError}</p>}
                      {adminLoading ? (
                        <p className="text-sm text-zinc-500">Loading games…</p>
                      ) : games.length === 0 ? (
                        <p className="text-sm text-zinc-500">No games found.</p>
                      ) : (
                        <div className="space-y-2 max-h-[30vh] overflow-auto">
                          {games.map((game, i) => (
                            <div
                              key={game.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/50 backdrop-blur-sm px-3 py-2 animate-fade-in-up transition-colors duration-200"
                              style={{ animationDelay: `${i * 45}ms` }}
                            >
                              <span className="text-sm font-medium text-zinc-200">{game.name}</span>
                              <button
                                type="button"
                                onClick={() => handleSetActiveGame(game.id)}
                                className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-200 ${activeGameId === game.id ? "bg-emerald-600 text-white" : "bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:scale-[1.02] active:scale-[0.98]"}`}
                              >
                                {activeGameId === game.id ? "Active" : "Set active"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => api.openExternal(`http://localhost:${hubPort}/play`)}
                        className="rounded-full bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-500 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Open play page →
                      </button>
                      <button type="button" onClick={handleStopHub} className="rounded-full border border-zinc-600 px-6 py-3 text-base font-medium text-zinc-400 hover:bg-zinc-800 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]">
                        Stop hub
                      </button>
                      <p className="text-xs text-zinc-500">
                        Share: <span className="font-mono text-zinc-400">localhost:{hubPort}/play</span>
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>

      <footer className="flex-shrink-0 border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex flex-col items-center gap-4 transition-colors duration-200">
        {/* Progress: 5 steps left-to-right at bottom */}
        <div className="flex gap-2.5 w-full max-w-sm mx-auto" aria-label="Step progress">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ease-out ${
                s <= currentStep ? "bg-blue-500 shadow-sm shadow-blue-500/30" : "bg-zinc-700/80"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between gap-6 w-full max-w-sm">
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="rounded-full border border-zinc-600 px-6 py-3 text-base font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none disabled:hover:scale-100 disabled:active:scale-100 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            Back
          </button>
          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={currentStep === 2 && !hasRepo && downloadPhase !== "done"}
              className="rounded-full bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 disabled:active:scale-100 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
            >
              Next →
            </button>
          ) : (
            <span className="text-base text-zinc-500 py-3">Done</span>
          )}
        </div>
      </footer>
    </div>
  );
}
