import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Gamepad2, Sparkles } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import type { GameManifest } from "../api";

interface GameCardProps {
  game: GameManifest;
  isActive: boolean;
  onSetActive: (gameId: string) => void;
}

export function GameCard({
  game,
  isActive,
  onSetActive,
}: GameCardProps) {
  const isWip = game.wip === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        noHover={isWip}
        className={`
          flex h-full flex-col overflow-hidden p-0
          ${isActive ? "ring-1 ring-blue-500/50 border-blue-500/30" : ""}
          ${isWip ? "opacity-95" : ""}
        `}
      >
        <div className="flex flex-1 flex-col p-5">
          {/* Top row: icon + Coming soon tag */}
          <div className="flex items-start justify-between gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400"
              aria-hidden
            >
              <Gamepad2 className="h-5 w-5" strokeWidth={1.5} />
            </div>
            {isWip && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400/90 border border-amber-500/20"
                aria-label="Coming soon"
              >
                <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
                Coming soon
              </span>
            )}
          </div>

          {/* Name + description */}
          <h3 className="mt-4 line-clamp-1 text-base font-semibold text-zinc-100">
            {game.name}
          </h3>
          {game.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
              {game.description}
            </p>
          )}

          {/* Spacer so footer sits at bottom */}
          <div className="min-h-4 flex-1" />

          {/* Footer: action only */}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800/50 pt-4">
            {isActive && (
              <>
                <Link to="/play">
                  <Button variant="ghost" className="gap-1.5 text-xs">
                    <Play className="h-3.5 w-3.5" aria-hidden />
                    Open Play
                  </Button>
                </Link>
                <Button variant="primary" disabled className="text-xs">
                  Active
                </Button>
              </>
            )}
            {!isWip && !isActive && (
              <Button
                variant="primary"
                className="gap-1.5 text-xs"
                onClick={() => onSetActive(game.id)}
              >
                <Play className="h-3.5 w-3.5" aria-hidden />
                Set Active
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
