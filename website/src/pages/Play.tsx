import { Link2, Users } from "lucide-react";
import Card from "../components/Card";
import CodeBlock from "../components/CodeBlock";
import Section from "../components/Section";

export default function Play() {
  return (
    <div className="container-page">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          Join a game
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-400">
          The host runs the hub (desktop app or terminal) and shares a link. Open it in your browser to play the active game.
        </p>
      </div>

      <Section title="What you’ll see" className="mt-12">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Link2 className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-4 leading-relaxed text-zinc-400">
                The host will give you a URL like:
              </p>
              <CodeBlock>http://localhost:3000/</CodeBlock>
              <p className="mt-4 leading-relaxed text-zinc-400">
                Or, if they’re using a tunnel, something like{" "}
                <code className="rounded-lg bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-zinc-300">
                  https://abc123.ngrok.io
                </code>
                . Open that link to land on the lobby, then open the game to play.
              </p>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Same network" className="mt-12">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="leading-relaxed text-zinc-400">
                If you’re in the same place as the host, use the same Wi‑Fi. For remote play, the host must use a tunnel and share that URL.
              </p>
            </div>
          </div>
        </Card>
      </Section>
    </div>
  );
}
