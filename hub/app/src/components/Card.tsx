import { motion } from "framer-motion";

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
      whileHover={noHover ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
      className={`
        rounded-2xl border border-zinc-800/60 bg-zinc-900
        shadow-card transition-shadow
        ${noHover ? "" : "hover:shadow-card-hover"}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
