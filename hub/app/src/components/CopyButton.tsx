import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
  label?: string;
  className?: string;
}

export function CopyButton({
  text,
  onCopy,
  label = "Copy link",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onCopy?.();
    }
  };

  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={handleCopy}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center gap-2 rounded-xl border border-zinc-700/80
        bg-zinc-900/80 px-3 py-2 text-sm font-medium text-zinc-300
        transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
        ${className}
      `}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-400" aria-hidden />
      ) : (
        <Copy className="h-4 w-4" aria-hidden />
      )}
      <span>{copied ? "Copied" : "Copy"}</span>
    </motion.button>
  );
}
