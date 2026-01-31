import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build output goes to hub/public/app so Express can serve it.
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "../public/app",
    emptyOutDir: true,
  },
});
