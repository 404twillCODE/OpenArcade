import { type LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 py-16 px-6 text-center">
      <Icon
        className="h-12 w-12 text-zinc-500"
        aria-hidden
      />
      <h3 className="mt-4 text-sm font-medium text-zinc-400">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-xs text-zinc-500">{description}</p>
      )}
      {actions && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
