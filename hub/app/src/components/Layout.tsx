import { layout } from "../styles/tokens";

interface LayoutProps {
  children: React.ReactNode;
  /** Optional extra class on the container */
  className?: string;
}

/**
 * Standard page layout: container width + padding. Use for Landing and Admin.
 * Play uses its own immersive layout (no Navbar/Footer, full-height iframe).
 */
export function Layout({ children, className = "" }: LayoutProps) {
  return (
    <div className={`${layout.container} ${className}`.trim()}>
      {children}
    </div>
  );
}
