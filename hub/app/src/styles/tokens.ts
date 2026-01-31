/**
 * Hub UI design tokens — single source of truth for layout and surface styles.
 * Use these in components/pages to keep the design system consistent.
 */

export const layout = {
  /** Page container: match website (72rem) */
  container: "mx-auto w-full max-w-6xl px-5 sm:px-8",
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
  /** Hero main title (match website) */
  heroTitle: "text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl sm:leading-tight",
  /** Section / page title (match website Section h2) */
  title: "text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl",
  /** Hero / section subtitle (match website) */
  subtitle: "text-lg leading-relaxed text-zinc-400",
  /** Header subtitle (e.g. PageHeader) */
  headerSubtitle: "mt-2 leading-relaxed text-zinc-400",
  /** Card title (match website) */
  cardTitle: "font-semibold text-zinc-100",
  /** Card / list description (match website) */
  cardDesc: "text-sm leading-relaxed text-zinc-400",
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
