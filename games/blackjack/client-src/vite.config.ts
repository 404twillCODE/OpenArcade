import { defineConfig } from "vite";

// Served under /game/blackjack/ — use relative base so assets resolve correctly.
export default defineConfig({
  base: "./",
  build: {
    outDir: "../client",
    emptyOutDir: true,
  },
});
