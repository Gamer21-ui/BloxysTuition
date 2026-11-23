import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        surface2: v("surface2"),
        ink: v("ink"),
        muted: v("muted"),
        line: v("line"),
        primary: v("primary"),
        "primary-ink": v("primary-ink"),
        accent: v("accent"),
        good: v("good"),
        bad: v("bad"),
        warn: v("warn"),
        xp: v("xp"),
        coin: v("coin"),
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
        mono: "var(--font-mono)",
      },
      borderRadius: { theme: "var(--radius)" },
      boxShadow: { chunky: "var(--shadow-chunky)", soft: "var(--shadow-soft)" },
    },
  },
  plugins: [],
} satisfies Config;
