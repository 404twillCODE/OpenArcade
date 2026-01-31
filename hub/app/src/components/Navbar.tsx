import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { layout } from "../styles/tokens";

export function Navbar() {
  const location = useLocation();

  const links = [
    { to: "/", label: "Hub" },
    { to: "/admin", label: "Admin" },
    { to: "/play", label: "Play" },
  ];

  return (
    <nav
      className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md"
      role="navigation"
      aria-label="Main"
    >
      <div className={`${layout.container} flex h-14 items-center justify-between gap-4`}>
        <Link
          to="/"
          className="flex items-center gap-2 text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-lg"
        >
          <Gamepad2 className="h-5 w-5 text-blue-500" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">
            OpenArcade
          </span>
        </Link>
        <ul className="flex gap-0.5">
          {links.map(({ to, label }) => {
            const active = location.pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`
                    relative rounded-lg px-3 py-2.5 text-sm font-medium
                    ${active ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
                  `}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="navbar-underline"
                      className="absolute inset-0 -z-10 rounded-lg bg-zinc-800/80"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
