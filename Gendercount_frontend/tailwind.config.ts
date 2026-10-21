import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // `xs` separates very small phones (320–359 px, e.g. iPhone SE) from regular ones. It must come first,
    // so it is listed before the default breakpoints instead of being added through `extend`.
    screens: { xs: "360px", ...defaultTheme.screens },
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
        success: "hsl(var(--success))",
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
