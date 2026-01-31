import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

const typeConfig: Record<
  ToastType,
  { icon: typeof CheckCircle2; className: string }
> = {
  success: {
    icon: CheckCircle2,
    className:
      "bg-zinc-900/95 border-zinc-700/80 text-emerald-400 shadow-lg backdrop-blur-sm",
  },
  error: {
    icon: AlertTriangle,
    className:
      "bg-zinc-900/95 border-red-500/30 text-red-400 shadow-lg backdrop-blur-sm",
  },
  info: {
    icon: Info,
    className:
      "bg-zinc-900/95 border-blue-500/30 text-blue-400 shadow-lg backdrop-blur-sm",
  },
};

export function Toast({
  message,
  type,
  visible,
  onClose,
  duration = 4000,
}: ToastProps) {
  const { icon: Icon, className } = typeConfig[type];

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 24, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`
            fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl border
            px-4 py-3 text-sm font-medium backdrop-blur-md
            ${className}
          `}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          <span className="text-zinc-100">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
