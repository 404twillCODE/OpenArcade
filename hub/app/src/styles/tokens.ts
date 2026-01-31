/**
 * Hub UI design tokens — single source of truth for layout and surface styles.
 * Use these in components/pages to keep the design system consistent.
 */

export const layout = {
  /** Page container: max width + horizontal padding */
  container: "mx-auto max-w-6xl px-5 sm:px-8",
  /** Full viewport background */
  pageBg: "min-h-screen bg-zinc-950",
} as const;

export const surface = {
  /** Card: rounded, border, background */
  card: "rounded-2xl border border-zinc-800/60 bg-zinc-900",
  /** Card hover shadow (use with transition-shadow) */
  cardHover: "hover:shadow-card-hover",
  /** Muted surface (e.g. active game panel) */
  cardMuted: "rounded-2xl border border-zinc-800/80 bg-zinc-900/60",
} as const;

export const text = {
  primary: "text-zinc-100",
  secondary: "text-zinc-400",
  muted: "text-zinc-500",
  /** Section label (uppercase, small) */
  label: "text-xs font-semibold uppercase tracking-wider text-zinc-500",
  /** Page title */
  title: "text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl",
  /** Page subtitle (hero, etc.) */
  subtitle: "text-base text-zinc-500 sm:text-lg",
  /** Header subtitle (smaller, e.g. PageHeader) */
  headerSubtitle: "mt-1 text-sm text-zinc-500",
} as const;

export const spacing = {
  /** Section vertical rhythm */
  section: "py-10 sm:py-12",
  /** Block gap */
  block: "mt-8",
  /** Inline gap between controls */
  gap: "gap-3",
} as const;

export const border = {
  /** Default border for bars, dividers */
  bar: "border-b border-zinc-800",
  /** Bar background (e.g. PlayBar) */
  barBg: "bg-zinc-900/95 backdrop-blur-sm",
  /** Iframe/game container border */
  frame: "border border-zinc-800/60",
} as const;

export const motion = {
  /** Page transition: fade + slight y (use with Framer Motion) */
  pageTransition: { duration: 0.2, ease: "easeOut" as const },
  /** Card hover lift in px */
  cardLift: -2,
  /** Button tap scale */
  buttonTap: 0.98,
} as const;
