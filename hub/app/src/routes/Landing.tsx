import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Settings, ExternalLink } from "lucide-react";
import { PageTransition } from "../components/PageTransition";
import { Layout } from "../components/Layout";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StatPill } from "../components/StatPill";
import { CopyButton } from "../components/CopyButton";
import { text, spacing } from "../styles/tokens";
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
        <Layout className="relative py-20 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className={text.heroTitle}>
              OpenArcade Hub
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-400 max-w-2xl mx-auto">
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
        </Layout>
      </div>

      {/* How it works */}
      <Layout className="py-16 sm:py-20">
        <h2 className={`text-center ${text.title}`}>
          How it works
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-6 grid gap-6 sm:grid-cols-3"
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
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 mb-3">
                  <span className="text-sm font-semibold">{block.step}</span>
                </div>
                <h3 className={text.cardTitle}>
                  {block.title}
                </h3>
                <p className={`mt-2 ${text.cardDesc}`}>
                  {block.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Layout>

      {/* Quick actions */}
      <Layout className={`${spacing.section} pb-20 sm:pb-24`}>
        <Card noHover className="p-6 sm:p-8">
          <h2 className={text.title}>
            Quick actions
          </h2>
          <p className={`mt-2 ${text.cardDesc}`}>
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
      </Layout>
    </PageTransition>
  );
}
