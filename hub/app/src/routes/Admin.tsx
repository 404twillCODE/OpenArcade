import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Gamepad2 } from "lucide-react";
import { PageTransition } from "../components/PageTransition";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input } from "../components/Input";
import { SegmentedControl, type FilterValue } from "../components/SegmentedControl";
import { SkeletonCard } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { Toast, type ToastType } from "../components/Toast";
import {
  fetchGames,
  fetchState,
  setActiveGame,
  type GameManifest,
} from "../api";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function Admin() {
  const [games, setGames] = useState<GameManifest[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  const load = () => {
    setLoading(true);
    Promise.all([fetchGames(), fetchState()])
      .then(([g, s]) => {
        setGames(g);
        setActiveGameId(s.activeGameId);
      })
      .catch(() => setToast({ message: "Failed to load games", type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filteredGames = useMemo(() => {
    let list = games;
    if (filter === "wip") list = list.filter((g) => g.wip);
    if (filter === "ready") list = list.filter((g) => !g.wip);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.id.toLowerCase().includes(q) ||
          (g.description && g.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [games, filter, search]);

  const handleSetActive = (gameId: string) => {
    setActiveGame(gameId)
      .then((s) => {
        setActiveGameId(s.activeGameId);
        setToast({ message: "Active game updated", type: "success" });
      })
      .catch((err) => {
        setToast({
          message: err instanceof Error ? err.message : "Failed to set active game",
          type: "error",
        });
      });
  };

  const activeGame = games.find((g) => g.id === activeGameId);

  return (
    <PageTransition>
      <div className="container-page py-10 sm:py-12">
        <PageHeader
          title="Admin"
          subtitle="Manage games and choose what players see."
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={search}
                onChange={setSearch}
                placeholder="Search games…"
                aria-label="Search games"
                className="w-48 sm:w-56"
              />
              <SegmentedControl value={filter} onChange={setFilter} />
            </div>
          }
        />

        {/* Active game highlight panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-10"
        >
          <Card noHover className="border-zinc-800/80 bg-zinc-900/60 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Active game
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {activeGameId
                    ? activeGame?.name ?? activeGameId
                    : "None set"}
                </p>
                {activeGame?.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {activeGame.description}
                  </p>
                )}
                {activeGame && (
                  <div className="mt-3">
                    {activeGame.wip ? (
                      <Badge variant="wip">WIP</Badge>
                    ) : (
                      <Badge variant="ready">Ready</Badge>
                    )}
                  </div>
                )}
              </div>
              {activeGameId && (
                <Link to="/play">
                  <Button variant="primary" className="gap-2 shrink-0">
                    <Play className="h-4 w-4" aria-hidden />
                    Open Play
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Games grid */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-zinc-500">Games</h2>

          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredGames.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-8"
            >
              <EmptyState
                icon={Gamepad2}
                title={games.length === 0 ? "No games installed" : "No games match your search"}
                description={
                  games.length === 0
                    ? "Add games to the /games folder with a manifest.json."
                    : "Try a different search or filter."
                }
                actions={
                  games.length === 0 ? (
                    <Link to="/">
                      <Button variant="secondary">Go to Hub</Button>
                    </Link>
                  ) : undefined
                }
              />
            </motion.div>
          ) : (
            <motion.ul
              variants={container}
              initial="hidden"
              animate="show"
              className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredGames.map((game) => (
                  <motion.li key={game.id} variants={item} layout>
                    <Card className="p-6">
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-zinc-100">
                              {game.name}
                            </span>
                            {game.version && (
                              <span className="text-xs text-zinc-500">
                                v{game.version}
                              </span>
                            )}
                            {game.wip ? (
                              <Badge variant="wip">WIP</Badge>
                            ) : (
                              <Badge variant="ready">Ready</Badge>
                            )}
                          </div>
                          {game.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                              {game.description}
                            </p>
                          )}
                          {game.author && (
                            <p className="mt-2 text-xs text-zinc-500">
                              {game.author}
                            </p>
                          )}
                        </div>
                        <Button
                          variant={activeGameId === game.id ? "primary" : "secondary"}
                          onClick={() => handleSetActive(game.id)}
                          disabled={activeGameId === game.id}
                          className="w-full gap-2"
                        >
                          {activeGameId === game.id ? (
                            "Active"
                          ) : (
                            <>
                              <Play className="h-4 w-4" aria-hidden />
                              Set active
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </div>

      <Toast
        message={toast?.message ?? ""}
        type={toast?.type ?? "info"}
        visible={!!toast}
        onClose={() => setToast(null)}
      />
    </PageTransition>
  );
}
