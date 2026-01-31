import { defineConfig } from "vite";

// Served under /game/<id>/ — use relative base so assets resolve correctly.
export default defineConfig({
  base: "./",
  build: {
    outDir: "../client",
    emptyOutDir: true,
  },
});
