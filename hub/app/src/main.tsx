import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import App from "./App";
import "./styles/globals.css";

// Respect prefers-reduced-motion in Framer Motion.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
        <App />
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>
);
