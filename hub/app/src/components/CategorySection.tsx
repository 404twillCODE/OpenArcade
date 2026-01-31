import { motion } from "framer-motion";
import { text } from "../styles/tokens";

interface CategorySectionProps {
  label: string;
  children: React.ReactNode;
}

export function CategorySection({ label, children }: CategorySectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-10 first:mt-0"
    >
      <h2 className={`mb-4 ${text.label}`}>
        {label}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </motion.section>
  );
}
