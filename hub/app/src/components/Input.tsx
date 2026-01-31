import { Search } from "lucide-react";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
}

export function Input({
  value,
  onChange,
  placeholder = "Search…",
  "aria-label": ariaLabel = "Search",
  className = "",
}: InputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`
          w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80
          py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500
          transition-colors
          focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-zinc-950
        `}
      />
    </div>
  );
}
