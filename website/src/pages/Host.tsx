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
              <p className="mb-4 leading-relaxed text-zinc-400">
                Clone the repo, then install and start the hub. The terminal will print the Admin and Player URLs.
              </p>
              <CodeBlock>
{`git clone https://github.com/404twillcode/OpenArcade.git
cd OpenArcade/hub
npm install
npm start`}
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
                Open the Admin URL in your browser. You’ll see a list of games; click “Set Active” for the one you want. Players use the Player URL to open that game.
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
