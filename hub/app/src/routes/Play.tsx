import { Link } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCw, AlertTriangle, Settings } from "lucide-react";
import { PageTransition } from "../components/PageTransition";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { PlayBar } from "../components/PlayBar";
import { EmptyState } from "../components/EmptyState";
import { border } from "../styles/tokens";
import { fetchGames, fetchState, type GameManifest } from "../api";

export function Play() {
  const [games, setGames] = useState<GameManifest[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setIframeError(false);
    Promise.all([fetchGames(), fetchState()])
      .then(([g, s]) => {
        setGames(g);
        setActiveGameId(s.activeGameId);
      })
      .catch(() => setIframeError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeGame = games.find((g) => g.id === activeGameId);
  const gameClientUrl = activeGameId ? `/game/${activeGameId}/` : "";
  const shareLink = typeof window !== "undefined" ? `${window.location.origin}/play` : "";

  // Timeout: if iframe never fires onLoad (e.g. 404), show error after 15s
  useEffect(() => {
    if (!activeGameId || !gameClientUrl) return;
    const t = setTimeout(() => {
      setIframeLoaded((loaded) => {
        if (!loaded) setIframeError(true);
        return loaded;
      });
    }, 15000);
    return () => clearTimeout(t);
  }, [activeGameId, gameClientUrl]);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        el.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const handleReload = useCallback(() => {
    setIframeLoaded(false);
    setIframeError(false);
    const iframe = iframeRef.current;
    if (iframe && gameClientUrl) {
      iframe.src = gameClientUrl;
    }
  }, [gameClientUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 py-16">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500"
            aria-hidden
          />
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
      </PageTransition>
    );
  }

  if (!activeGameId || !activeGame) {
    return (
      <PageTransition>
        <Layout className="flex min-h-[50vh] flex-col items-center justify-center py-16">
          <EmptyState
            icon={AlertTriangle}
            title="No active game set"
            description="Choose an active game in Admin so players can load a game."
            actions={
              <Link to="/admin">
                <Button variant="primary" className="gap-2">
                  <Settings className="h-4 w-4" aria-hidden />
                  Go to Admin
                </Button>
              </Link>
            }
          />
        </Layout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div
        ref={containerRef}
        className="flex h-[100vh] flex-col bg-zinc-950"
      >
        <PlayBar
          gameName={activeGame.name}
          shareUrl={shareLink}
          onFullscreen={handleFullscreen}
          onReload={handleReload}
        />

        <div className="relative min-h-0 flex-1 p-2 sm:p-4">
          {/* Iframe container: rounded + border on desktop, near edge-to-edge on mobile */}
          <div className={`relative h-full w-full overflow-hidden rounded-lg ${border.frame} bg-zinc-950 sm:rounded-2xl`}>
            {/* Loading overlay */}
            {!iframeLoaded && !iframeError && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-zinc-950"
              >
                <div
                  className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500"
                  aria-hidden
                />
                <p className="text-sm text-zinc-500">Loading game…</p>
              </motion.div>
            )}

            {/* Error state */}
            {iframeError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950 px-4"
              >
                <EmptyState
                  icon={AlertTriangle}
                  title="Game failed to load"
                  description="The game client could not be loaded. Try reloading or choose another game in Admin."
                  actions={
                    <>
                      <Button
                        variant="primary"
                        onClick={handleReload}
                        className="gap-2"
                      >
                        <RotateCw className="h-4 w-4" aria-hidden />
                        Retry
                      </Button>
                      <Link to="/admin">
                        <Button variant="secondary" className="gap-2">
                          <Settings className="h-4 w-4" aria-hidden />
                          Go to Admin
                        </Button>
                      </Link>
                    </>
                  }
                />
              </motion.div>
            )}

            {/* Iframe */}
            {!iframeError && (
              <iframe
                ref={iframeRef}
                title={activeGame.name}
                src={gameClientUrl}
                onLoad={() => setIframeLoaded(true)}
                onError={() => setIframeError(true)}
                className="absolute inset-0 h-full w-full border-0 bg-zinc-950"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
