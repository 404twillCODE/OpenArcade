import { Terminal, ArrowRight, Globe } from "lucide-react";
import Card from "../components/Card";
import CodeBlock from "../components/CodeBlock";
import Section from "../components/Section";

export default function Host() {
  return (
    <div className="container-page">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          Host a server
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-400">
          Run the OpenArcade hub on your machine and choose which game is live for players.
        </p>
      </div>

      <Section title="Install and run" className="mt-12">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Terminal className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-2 font-medium text-zinc-200">
                Desktop app (Windows, easiest)
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Run the OpenArcade desktop app from <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300">desktop/</code>. It can download the repo (or use an existing folder), install dependencies, build the hub UI, and start the server. Use the in-app Admin to set the active game and copy the Play link.
              </p>
              <p className="mb-2 font-medium text-zinc-200">
                Windows (hub from repo)
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Download the repo (ZIP or clone), extract, then <strong>double-click <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300">start.bat</code></strong> in the repo root.
              </p>
              <p className="mb-2 font-medium text-zinc-200">
                macOS
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Download the repo, extract, then <strong>double-click <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300">start.command</code></strong> (or in Terminal run <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300">./start.sh</code> from the repo root). First time, you may need to right‑click <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300">start.command</code> → Open.
              </p>
              <p className="mb-2 font-medium text-zinc-200">
                Linux
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Download the repo, extract, then in a terminal run <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300">./start.sh</code> from the repo root. If needed, run <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300">chmod +x start.sh start-dev.sh start.command</code> first.
              </p>
              <p className="mb-2 font-medium text-zinc-200">
                What happens next
              </p>
              <ul className="mb-4 list-inside list-disc space-y-1 text-zinc-400">
                <li>Installs dependencies (first run)</li>
                <li>Builds the Hub UI (first run)</li>
                <li>Starts the hub</li>
                <li>Shows URLs: Landing, Admin, Play</li>
              </ul>
              <CodeBlock>
{`# Clone (or download ZIP and extract)
git clone https://github.com/404twillcode/OpenArcade.git
cd OpenArcade

# Windows: double-click start.bat
# macOS: double-click start.command or run ./start.sh
# Linux: ./start.sh`}
              </CodeBlock>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Activate a game" className="mt-12">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <ArrowRight className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="leading-relaxed text-zinc-400">
                Open the <strong>Admin</strong> URL in your browser (on the host machine only — Admin is localhost-only for security). Click “Set Active” for the game you want. Share the <strong>Play</strong> URL with players; they use <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300">/play</code> to join. Admin is host-only; players should use the Play link.
              </p>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Contributors" className="mt-12">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Globe className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="leading-relaxed text-zinc-400">
                Contributors can add games via pull request. Both static games (hand-authored <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300">client/</code>) and built games (Vite + TypeScript via <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300">client-src/</code>) are supported. See the{" "}
                <a
                  href="https://github.com/404twillcode/OpenArcade/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  contributing guide on GitHub
                </a>{" "}
                for details.
              </p>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Tunnel (remote players)" className="mt-12">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Globe className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="leading-relaxed text-zinc-400">
                By default the hub listens on{" "}
                <code className="rounded-lg bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-zinc-300">
                  localhost
                </code>
                . To let friends on the internet join, use a tunnel such as{" "}
                <a
                  href="https://ngrok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  ngrok
                </a>{" "}
                or{" "}
                <a
                  href="https://localhost.run"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  localhost.run
                </a>
                . Point the tunnel at your hub port (default 3000).
              </p>
            </div>
          </div>
        </Card>
      </Section>
    </div>
  );
}
