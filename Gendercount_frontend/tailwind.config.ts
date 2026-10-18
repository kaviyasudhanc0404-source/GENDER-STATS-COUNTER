import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          end: "hsl(var(--primary-end))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: "hsl(var(--accent))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "slide-from-right": { from: { opacity: "0", transform: "translateX(24px)" }, to: { opacity: "1", transform: "none" } },
        "slide-from-left": { from: { opacity: "0", transform: "translateX(-24px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        "slide-from-right": "slide-from-right 0.3s ease-out",
        "slide-from-left": "slide-from-left 0.3s ease-out",
      },
    },
  },
} satisfies Config;
