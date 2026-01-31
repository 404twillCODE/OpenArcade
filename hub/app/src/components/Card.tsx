import { motion } from "framer-motion";
import { surface, motion as motionTokens } from "../styles/tokens";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noHover?: boolean;
}

export function Card({
  children,
  className = "",
  noHover = false,
}: CardProps) {
  return (
    <motion.div
      initial={false}
      whileHover={noHover ? undefined : { y: motionTokens.cardLift }}
      transition={motionTokens.pageTransition}
      className={`
        ${surface.card}
        shadow-card transition-shadow
        ${noHover ? "" : surface.cardHover}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
