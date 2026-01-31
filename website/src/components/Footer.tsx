import { Link } from "react-router-dom";
import { Github } from "lucide-react";

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800/60 bg-zinc-950/50">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
        <div className="flex items-center gap-6 text-sm text-zinc-500">
          <span>OpenArcade © {year}</span>
          <span>MIT License</span>
        </div>
        <a
          href="https://github.com/404twillcode/OpenArcade"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-blue-400"
        >
          <Github className="h-4 w-4" aria-hidden />
          GitHub
        </a>
        <div className="flex gap-6">
          <Link
            to="/host"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-100"
          >
            Host
          </Link>
          <Link
            to="/contribute"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-100"
          >
            Contribute
          </Link>
        </div>
      </div>
    </footer>
  );
}
