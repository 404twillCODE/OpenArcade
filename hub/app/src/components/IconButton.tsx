import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "ghost";
  className?: string;
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = "default",
  className = "",
}: IconButtonProps) {
  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50";
  const variants =
    variant === "ghost"
      ? "border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      : "border-zinc-700/80 bg-zinc-900/80 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100";

  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.98 }}
      className={`${base} ${variants} ${className}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </motion.button>
  );
}
