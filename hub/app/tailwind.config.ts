import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#3b82f6",
          hover: "#60a5fa",
          muted: "rgba(59, 130, 246, 0.15)",
        },
      },
      maxWidth: {
        "6xl": "72rem",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.2)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.15), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "card-hover":
          "0 8px 24px -4px rgb(0 0 0 / 0.25), 0 4px 8px -2px rgb(0 0 0 / 0.15)",
      },
    },
  },
  plugins: [],
} satisfies Config;
