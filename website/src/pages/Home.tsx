import { Link } from "react-router-dom";
import { Server, Code2, Zap, ArrowRight, Download } from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import Section from "../components/Section";
import { motion } from "framer-motion";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { DOWNLOAD_WINDOWS_URL } from "../config";

const features = [
  {
    title: "Host locally",
    description: "Run the hub on your machine. No cloud required.",
    icon: Server,
  },
  {
    title: "One active game",
    description: "Pick a game for the lobby. Players open one link.",
    icon: Zap,
  },
  {
    title: "Open source",
    description: "Games are plugins. Add yours via pull request.",
    icon: Code2,
  },
];

const steps = [
  "Windows: use the desktop app (easiest) or double-click start.bat in the repo root. Other: clone the repo, cd hub, npm install, npm start.",
  "Open the Admin URL (or in-app Admin) and set the active game.",
  "Share the Play URL. Everyone opens the same game.",
];

export default function Home() {
  const reduced = useReducedMotion();
  const reveal = reduced
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24 } };

  return (
    <div className="container-page">
      <motion.section
        className="py-16 text-center sm:py-24"
        {...reveal}
      >
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl sm:leading-tight">
          OpenArcade
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
          Host local game nights with a simple hub. Contribute games via pull requests.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button
            as="a"
            href={DOWNLOAD_WINDOWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            className="gap-2"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download for Windows (.exe)
          </Button>
          <Button to="/host" variant="secondary" className="gap-2">
            <Server className="h-4 w-4" aria-hidden />
            Host a Server
          </Button>
          <Button to="/contribute" variant="secondary" className="gap-2">
            <Code2 className="h-4 w-4" aria-hidden />
            Contribute a Game
          </Button>
        </div>
      </motion.section>

      <Section title="How it works" subtitle="Run the hub, pick a game, share the link.">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <Card key={title}>
              <div className="flex flex-col gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-semibold text-zinc-100">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Quick start" subtitle="Three steps to get going." className="mt-16">
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-400">
                {i + 1}
              </span>
              <p className="pt-0.5 leading-relaxed text-zinc-400">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Link
            to="/host"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Full hosting guide
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Section>

      <motion.section
        className="mt-20 rounded-2xl border border-zinc-800/60 bg-zinc-900 p-8 text-center shadow-card sm:p-12"
        {...(reduced
          ? {}
          : {
              initial: { opacity: 0, y: 12 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.24 },
            })}
      >
        <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">
          Ready to host or contribute?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-zinc-400">
          On Windows, use the desktop app or double-click start.bat to run the hub. Otherwise use the terminal. Or add a new game to the collection.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button to="/host" variant="primary">
            Host a Server
          </Button>
          <Button to="/contribute" variant="secondary">
            Contribute a Game
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
