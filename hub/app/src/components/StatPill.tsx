import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatPillProps {
  label: string;
  value: string;
  variant?: "default" | "success" | "muted";
  icon?: LucideIcon;
}

const variantStyles = {
  default:
    "border-zinc-700/80 bg-zinc-900/80 text-zinc-300",
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  muted:
    "border-zinc-800 bg-zinc-900/60 text-zinc-500",
};

export function StatPill({
  label,
  value,
  variant = "default",
  icon: Icon,
}: StatPillProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        inline-flex items-center gap-2 rounded-xl border px-3 py-1.5
        text-xs font-medium
        ${variantStyles[variant]}
      `}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />}
      <span className="text-zinc-500">{label}:</span>
      <span>{value}</span>
    </motion.span>
  );
}
