/// <reference types="vite/client" />

declare global {
  interface Window {
    openarcade: {
      checkNode: () => Promise<{ ok: boolean; version: string | null; error: string | null }>;
      getConfig: () => Promise<{ repoPath: string; port: string; shareLink: string }>;
      setRepoPath: (path: string) => Promise<unknown>;
      chooseRepoFolder: () => Promise<{ path: string } | { error: string } | null>;
      downloadRepo: (targetDir?: string) => Promise<{ ok: boolean; path?: string; error?: string }>;
      onDownloadProgress: (cb: (ev: { phase: string; percent?: number }) => void) => void;
      installDeps: () => Promise<{ ok: boolean; error?: string }>;
      onInstallLog: (cb: (ev: { type: string; text: string }) => void) => void;
      startHub: () => Promise<{ ok: boolean; port?: string; error?: string }>;
      stopHub: () => Promise<{ ok: boolean }>;
      hubRunning: () => Promise<{ running: boolean }>;
      onHubStopped: (cb: (code: number | string) => void) => void;
      saveConfig: (updates: { port?: string; shareLink?: string }) => Promise<unknown>;
      openExternal: (url: string) => Promise<void>;
      getLogDir: () => Promise<string>;
      openLogFolder: () => Promise<string>;
      hubApiGames: (port: string) => Promise<{ id: string; name: string }[]>;
      hubApiState: (port: string) => Promise<{ activeGameId: string | null }>;
      hubApiSetActive: (port: string, gameId: string) => Promise<{ activeGameId: string }>;
    };
  }
}

export {};
