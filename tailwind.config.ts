import type { Config } from "tailwindcss";

// Theme tokens in src/styles.css are full oklch() colours, so map them directly
// and apply opacity modifiers via color-mix.
const c = (name: string) => `color-mix(in oklch, var(--${name}) calc(<alpha-value> * 100%), transparent)`;

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./*.{ts,tsx,js,jsx,html}",
    "./index.html",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: c("border"),
        input: c("input"),
        ring: c("ring"),
        background: c("background"),
        foreground: c("foreground"),
        primary: { DEFAULT: c("primary"), foreground: c("primary-foreground") },
        secondary: { DEFAULT: c("muted"), foreground: c("foreground") },
        destructive: { DEFAULT: c("destructive"), foreground: c("destructive-foreground") },
        muted: { DEFAULT: c("muted"), foreground: c("muted-foreground") },
        accent: { DEFAULT: c("accent"), foreground: c("accent-foreground") },
        popover: { DEFAULT: c("card"), foreground: c("card-foreground") },
        card: { DEFAULT: c("card"), foreground: c("card-foreground") },
        success: c("success"),
        "brand-violet": c("brand-violet"),
        "brand-magenta": c("brand-magenta"),
        "brand-coral": c("brand-coral"),
        "brand-saffron": c("brand-saffron"),
        "cat-health": c("cat-health"),
        "cat-education": c("cat-education"),
        "cat-housing": c("cat-housing"),
        "cat-utilities": c("cat-utilities"),
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
