import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#22c55e",
          dark: "#16a34a",
        },
        secondary: "#3b82f6",
        danger: "#ef4444",
        warning: "#f59e0b",
        success: "#10b981",
        surface: {
          DEFAULT: "#ffffff",
          dark: "#1e293b",
        },
        muted: "#64748b",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        playfair: ["Playfair Display", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "gradient-shift": "gradient-shift 5s ease-in-out infinite alternate",
        "pulse-slow": "pulse-slow 4s ease-in-out infinite",
        "float-indicator": "float-indicator 2.5s ease-in-out infinite",
      },
      keyframes: {
        "gradient-shift": {
          "0%": { "background-position": "0% center" },
          "100%": { "background-position": "100% center" },
        },
        "pulse-slow": {
          "0%, 100%": { transform: "scale(0.98)" },
          "50%": { transform: "scale(1.02)" },
        },
        "float-indicator": {
          "0%, 100%": { transform: "translateY(0) translateX(-50%)" },
          "50%": { transform: "translateY(6px) translateX(-50%)" },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
