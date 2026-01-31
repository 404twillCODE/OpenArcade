import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { PageTransition } from "../components/PageTransition";
import { CategorySection } from "../components/CategorySection";
import { GameCard } from "../components/GameCard";
import { Button } from "../components/Button";
import { SkeletonCard } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { Toast, type ToastType } from "../components/Toast";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import {
  fetchGames,
  fetchState,
  setActiveGame,
  type GameManifest,
} from "../api";

/** Category order for display. Unknown games go to "Other". */
const CATEGORY_ORDER = ["CASINO", "PARTY", "SOCIAL", "DEBATE", "Other"] as const;

const CATEGORY_BY_ID: Record<string, string> = {
  blackjack: "CASINO",
  roulette: "CASINO",
  poker: "CASINO",
  uno: "PARTY",
  "kings-cup": "PARTY",
  charades: "PARTY",
  pictionary: "PARTY",
  "trivia-party": "PARTY",
  "would-you-rather": "DEBATE",
};

function getCategory(game: GameManifest): string {
  return CATEGORY_BY_ID[game.id] ?? "Other";
}

function groupByCategory(games: GameManifest[]): Map<string, GameManifest[]> {
  const map = new Map<string, GameManifest[]>();
  for (const game of games) {
    const cat = getCategory(game);
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(game);
  }
  return map;
}

export function Admin() {
  const [games, setGames] = useState<GameManifest[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

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

  const gamesByCategory = useMemo(() => {
    const map = groupByCategory(games);
    const ordered: { category: string; games: GameManifest[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const list = map.get(cat);
      if (list && list.length > 0) ordered.push({ category: cat, games: list });
    }
    const other = map.get("Other");
    if (other && other.length > 0 && !ordered.some((o) => o.category === "Other")) {
      ordered.push({ category: "Other", games: other });
    }
    return ordered;
  }, [games]);

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

  return (
    <PageTransition>
      <Layout className="py-10 sm:py-12">
        {/* Catalog-style header */}
        <PageHeader
          title="Pick a game to host."
          subtitle="Choose what players will see when they join your hub."
        />

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : games.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <EmptyState
              icon={Gamepad2}
              title="No games installed"
              description="Add games to the /games folder with a manifest.json."
              actions={
                <Link to="/">
                  <Button variant="secondary">Go to Hub</Button>
                </Link>
              }
            />
          </motion.div>
        ) : (
          <div className="mb-10">
            {gamesByCategory.map(({ category, games: sectionGames }) => (
            <CategorySection key={category} label={category}>
              {sectionGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  isActive={activeGameId === game.id}
                  onSetActive={handleSetActive}
                />
              ))}
            </CategorySection>
            ))}
          </div>
        )}
      </Layout>

      <Toast
        message={toast?.message ?? ""}
        type={toast?.type ?? "info"}
        visible={!!toast}
        onClose={() => setToast(null)}
      />
    </PageTransition>
  );
}
