import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  children: string;
  className?: string;
}

export default function CodeBlock({ children, className = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ${className}`.trim()}
    >
      <pre className="overflow-x-auto px-5 py-4 font-mono text-sm leading-relaxed text-zinc-300">
        <code>{children}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:ring-offset-2 focus:ring-offset-zinc-950"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-400" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
