import { type ReactNode } from "react";
import { MotionConfig as FramerMotionConfig } from "framer-motion";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface AppMotionConfigProps {
  children: ReactNode;
}

export default function AppMotionConfig({ children }: AppMotionConfigProps) {
  const reduced = useReducedMotion();

  return (
    <FramerMotionConfig
      reducedMotion={reduced ? "always" : "user"}
      transition={{ duration: reduced ? 0 : 0.22, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </FramerMotionConfig>
  );
}
