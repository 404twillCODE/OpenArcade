interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-pulse rounded-xl bg-zinc-800/80 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <Skeleton className="mb-3 h-5 w-2/3" />
      <Skeleton className="mb-4 h-4 w-full" />
      <Skeleton className="mb-4 h-4 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}
