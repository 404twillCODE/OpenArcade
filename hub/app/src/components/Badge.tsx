interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "wip" | "ready";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const base =
    "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium border";
  const variants =
    variant === "wip"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
      : variant === "ready"
        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
        : "bg-zinc-800/80 text-zinc-400 border-zinc-700/80";

  return <span className={`${base} ${variants} ${className}`}>{children}</span>;
}
