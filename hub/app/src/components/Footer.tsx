import { layout, text } from "../styles/tokens";

export function Footer() {
  return (
    <footer
      className="mt-auto border-t border-zinc-800/60 py-8"
      role="contentinfo"
    >
      <div className={`${layout.container} text-center text-xs ${text.muted}`}>
        OpenArcade Hub — local arcade host
      </div>
    </footer>
  );
}
