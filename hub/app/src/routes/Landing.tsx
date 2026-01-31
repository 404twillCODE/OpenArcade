import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Settings, ExternalLink } from "lucide-react";
import { PageTransition } from "../components/PageTransition";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StatPill } from "../components/StatPill";
import { CopyButton } from "../components/CopyButton";
import { fetchGames, fetchState, type GameManifest } from "../api";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function Landing() {
  const [games, setGames] = useState<GameManifest[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchGames(), fetchState()])
      .then(([g, s]) => {
        setGames(g);
        setActiveGameId(s.activeGameId);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeGame = games.find((g) => g.id === activeGameId);
  const playerLink = typeof window !== "undefined" ? `${window.location.origin}/play` : "";
  const adminLink = typeof window !== "undefined" ? `${window.location.origin}/admin` : "";

  return (
    <PageTransition>
      {/* Hero with subtle dark gradient + faint highlight */}
      <div className="relative overflow-hidden">
        <div className="vignette absolute inset-0 pointer-events-none" aria-hidden />
        <div className="container-page relative py-20 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
              OpenArcade Hub
            </h1>
            <p className="mt-4 text-base text-zinc-500 sm:text-lg">
              Local-first game hub. Pick a game, share a link, and play.
            </p>

            {/* Status row */}
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              <StatPill label="Hub" value="Online" variant="success" />
              <StatPill
                label="Active game"
                value={loading ? "…" : activeGame ? activeGame.name : "None"}
                variant={activeGame ? "default" : "muted"}
              />
              <StatPill label="Share link" value="/play" variant="muted" />
            </div>

            {/* CTAs */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link to="/play">
                <Button variant="primary" className="gap-2">
                  <Play className="h-4 w-4" aria-hidden />
                  Play Now
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="secondary" className="gap-2">
                  <Settings className="h-4 w-4" aria-hidden />
                  Open Admin
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* How it works */}
      <div className="container-page py-16 sm:py-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-zinc-500">
          How it works
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-10 grid gap-6 sm:grid-cols-3"
        >
          {[
            {
              step: "1",
              title: "Host runs hub",
              desc: "Start the OpenArcade Hub on your machine. Players use your URL.",
            },
            {
              step: "2",
              title: "Pick a game in Admin",
              desc: "In Admin, choose which game is live for everyone.",
            },
            {
              step: "3",
              title: "Share /play link",
              desc: "Copy the player link and share it. Everyone opens /play to play.",
            },
          ].map((block) => (
            <motion.div key={block.step} variants={item}>
              <Card noHover className="p-6 sm:p-8">
                <span className="text-xs font-medium text-zinc-500">
                  Step {block.step}
                </span>
                <h3 className="mt-3 text-base font-semibold text-zinc-100">
                  {block.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {block.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Quick actions */}
      <div className="container-page pb-20 sm:pb-24">
        <Card noHover className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-zinc-100">
            Quick actions
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Copy links or open pages.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <CopyButton
              text={playerLink}
              label="Copy player link"
              className="gap-2"
            />
            <CopyButton
              text={adminLink}
              label="Copy admin link"
              className="gap-2"
            />
            <Link to="/play">
              <Button variant="secondary" className="gap-2">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Open Play
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="ghost" className="gap-2">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Open Admin
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
