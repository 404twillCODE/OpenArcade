import { motion } from "framer-motion";
import { motion as motionTokens } from "../styles/tokens";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={motionTokens.pageTransition}
    >
      {children}
    </motion.div>
  );
}
