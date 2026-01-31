import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

const reveal = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: [0.25, 0.1, 0.25, 1] },
};

const reducedTransition = { duration: 0 };

export default function Section({ title, subtitle, children, className = "" }: SectionProps) {
  const reduced = useReducedMotion();

  return (
    <motion.section
      initial={reveal.initial}
      animate={reveal.animate}
      transition={reduced ? reducedTransition : reveal.transition}
      className={className}
    >
      <h2 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 max-w-2xl leading-relaxed text-zinc-400">{subtitle}</p>
      )}
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}
