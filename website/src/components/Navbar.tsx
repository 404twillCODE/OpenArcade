import { Link, useLocation } from "react-router-dom";
import { Gamepad2 } from "lucide-react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/host", label: "Host" },
  { to: "/play", label: "Play" },
  { to: "/contribute", label: "Contribute" },
  { to: "/games", label: "Games" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/70 backdrop-blur-md">
      <nav className="container-page flex h-14 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-zinc-100 transition-opacity hover:opacity-90"
        >
          <Gamepad2 className="h-5 w-5 text-blue-500" aria-hidden />
          OpenArcade
        </Link>
        <ul className="flex items-center gap-1 sm:gap-0.5">
          {navLinks.map(({ to, label }) => {
            const isActive = location.pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-blue-400 underline decoration-blue-400/60 underline-offset-4"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
