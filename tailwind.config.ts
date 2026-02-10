import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-slow": "float-slow 20s ease-in-out infinite",
        "float-medium": "float-medium 15s ease-in-out infinite",
        gradient: "gradient-shift 6s ease infinite",
        "slide-up": "slide-up 0.5s ease-out both",
        "scale-in": "scale-in 0.35s ease-out both",
        "recording-pulse": "recording-pulse 1.5s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out both",
        "spin-slow": "spin-slow 3s linear infinite",
        shimmer: "shimmer 2s infinite",
      },
      colors: {
        surface: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
