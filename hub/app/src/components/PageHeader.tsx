import { ReactNode } from "react";
import { text } from "../styles/tokens";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className = "" }: PageHeaderProps) {
  return (
    <div className={`mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`.trim()}>
      <div>
        <h1 className={text.title}>{title}</h1>
        {subtitle && <p className={text.headerSubtitle}>{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
