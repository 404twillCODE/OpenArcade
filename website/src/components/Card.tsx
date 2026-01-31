import { type HTMLAttributes } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className = "", children, ...props }: CardProps) {
  const reduced = useReducedMotion();

  const hover = reduced
    ? {}
    : {
        y: -2,
        boxShadow:
          "0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      };

  return (
    <motion.div
      className="rounded-2xl"
      whileHover={hover}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        className={`rounded-2xl border border-zinc-800/60 bg-zinc-900 p-6 sm:p-8 shadow-card ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    </motion.div>
  );
}
