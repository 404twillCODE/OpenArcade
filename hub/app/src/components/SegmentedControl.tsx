import { motion } from "framer-motion";

export type FilterValue = "all" | "wip" | "ready";

interface SegmentedControlProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  "aria-label"?: string;
}

const options: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ready", label: "Ready" },
  { value: "wip", label: "WIP" },
];

export function SegmentedControl({
  value,
  onChange,
  "aria-label": ariaLabel = "Filter games",
}: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-0.5"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`
              relative rounded-lg px-3 py-2 text-xs font-medium
              ${active ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}
            `}
          >
            {active && (
              <motion.span
                layoutId="segmented-bg"
                className="absolute inset-0 rounded-lg bg-zinc-700/80"
                transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
