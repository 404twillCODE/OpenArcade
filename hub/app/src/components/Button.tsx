import { motion } from "framer-motion";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white border-transparent hover:bg-accent-hover shadow-soft",
  secondary:
    "bg-zinc-800 text-zinc-100 border-zinc-600 hover:bg-zinc-700 hover:border-zinc-500",
  ghost:
    "bg-transparent text-zinc-300 border-transparent hover:bg-zinc-800 hover:text-zinc-100",
}

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  disabled,
  onClick,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5
        text-sm font-medium transition-colors
        disabled:pointer-events-none disabled:opacity-50
        ${variantClasses[variant]} ${className}
      `}
    >
      {children}
    </motion.button>
  );
}
