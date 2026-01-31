import { Gamepad2, Info } from "lucide-react";
import Card from "../components/Card";
import Section from "../components/Section";

const placeholderGames = [
  { id: "blackjack", name: "Blackjack", description: "A simple card game. (WIP)", wip: true },
];

export default function Games() {
  return (
    <div className="container-page">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          Games
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-400">
          Games available in the OpenArcade hub. This list will be auto-generated from the repo soon.
        </p>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
        <Info className="h-5 w-5 shrink-0 text-blue-400" aria-hidden />
        <span>
          This page shows a placeholder. The list will be populated from{" "}
          <code className="rounded-lg bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-300">
            games/
          </code>{" "}
          manifests (e.g. at build time or via API) soon.
        </span>
      </div>

      <Section title="Available games" className="mt-12">
        <div className="grid gap-6 sm:grid-cols-2">
          {placeholderGames.map((game) => (
            <Card key={game.id}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <Gamepad2 className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-100">{game.name}</h3>
                    {game.wip && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                        WIP
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{game.description}</p>
                  <p className="mt-2 font-mono text-xs text-zinc-500">{game.id}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
