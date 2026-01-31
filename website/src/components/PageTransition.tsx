import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface PageTransitionProps {
  children: ReactNode;
}

const fadeY = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] },
};

const reducedTransition = { duration: 0 };

export default function PageTransition({ children }: PageTransitionProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={fadeY.initial}
      animate={fadeY.animate}
      exit={fadeY.exit}
      transition={reduced ? reducedTransition : fadeY.transition}
    >
      {children}
    </motion.div>
  );
}
