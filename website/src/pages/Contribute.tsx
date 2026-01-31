import { Folder, FileJson, GitPullRequest } from "lucide-react";
import Card from "../components/Card";
import CodeBlock from "../components/CodeBlock";
import Section from "../components/Section";

export default function Contribute() {
  return (
    <div className="container-page">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          Contribute a game
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-400">
          Add a new game by opening a pull request. Each game lives in its own folder with a manifest and client.
        </p>
      </div>

      <Section title="Folder structure" className="mt-12">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Folder className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-4 leading-relaxed text-zinc-400">
                Create a folder under{" "}
                <code className="rounded-lg bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-zinc-300">
                  games/
                </code>{" "}
                using the game id as the folder name:
              </p>
              <CodeBlock>
{`games/
  your-game-id/
    manifest.json
    client/
      index.html
      style.css
      main.js
    README.md`}
              </CodeBlock>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Manifest requirements" className="mt-12">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <FileJson className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-4 leading-relaxed text-zinc-400">
                <code className="rounded-lg bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-zinc-300">
                  manifest.json
                </code>{" "}
                must include:{" "}
                <code className="rounded-lg bg-zinc-800 px-1 py-0.5 font-mono text-sm text-zinc-300">
                  id
                </code>
                ,{" "}
                <code className="rounded-lg bg-zinc-800 px-1 py-0.5 font-mono text-sm text-zinc-300">
                  name
                </code>
                ,{" "}
                <code className="rounded-lg bg-zinc-800 px-1 py-0.5 font-mono text-sm text-zinc-300">
                  version
                </code>
                ,{" "}
                <code className="rounded-lg bg-zinc-800 px-1 py-0.5 font-mono text-sm text-zinc-300">
                  description
                </code>
                ,{" "}
                <code className="rounded-lg bg-zinc-800 px-1 py-0.5 font-mono text-sm text-zinc-300">
                  author
                </code>
                , and{" "}
                <code className="rounded-lg bg-zinc-800 px-1 py-0.5 font-mono text-sm text-zinc-300">
                  wip
                </code>{" "}
                (boolean). The{" "}
                <code className="rounded-lg bg-zinc-800 px-1 py-0.5 font-mono text-sm text-zinc-300">
                  id
                </code>{" "}
                must match the folder name.
              </p>
              <CodeBlock>
{`{
  "id": "your-game-id",
  "name": "Your Game Name",
  "version": "0.1.0",
  "description": "Short description.",
  "author": "Your Name",
  "wip": true
}`}
              </CodeBlock>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Open a PR" className="mt-12">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <GitPullRequest className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="leading-relaxed text-zinc-400">
                Fork the repo, add your game folder, and open a pull request. CI will validate manifests. Include a screenshot or short description of your game in the PR.
              </p>
            </div>
          </div>
        </Card>
      </Section>
    </div>
  );
}
