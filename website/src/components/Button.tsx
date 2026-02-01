import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Link, type To } from "react-router-dom";
import { motion } from "framer-motion";
import { useReducedMotion } from "../hooks/useReducedMotion";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  as?: "button" | "a";
  href?: string;
  to?: To;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-blue-500 text-white shadow-sm hover:bg-blue-400 focus:ring-blue-500/80",
  secondary:
    "bg-transparent text-zinc-100 border border-zinc-700 hover:bg-zinc-800/60 hover:border-zinc-600 focus:ring-zinc-500",
};

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = "primary", className = "", as = "button", href, to, children, ...props }, ref) => {
    const reduced = useReducedMotion();
    const base =
      "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50";
    const combined = `${base} ${variantStyles[variant]} ${className}`.trim();

    const tapScale = reduced ? {} : { scale: 0.98 };

    if (to != null) {
      return (
        <motion.div whileTap={tapScale} className="inline-block">
          <Link ref={ref as React.Ref<HTMLAnchorElement>} to={to} className={combined}>
            {children}
          </Link>
        </motion.div>
      );
    }

    if (as === "a" && href) {
      return (
        <motion.a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={combined}
          whileTap={tapScale}
          {...props}
        >
          {children}
        </motion.a>
      );
    }

    return (
      <motion.div whileTap={tapScale} className="inline-block">
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={combined}
          {...props}
        >
          {children}
        </button>
      </motion.div>
    );
  }
);

Button.displayName = "Button";

export default Button;
