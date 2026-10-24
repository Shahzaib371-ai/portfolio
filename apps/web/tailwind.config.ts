import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Charcoal workshop palette (Alexander Wang-inspired): deep charcoal
        // surfaces with a warm peach accent. Amber tokens are re-mapped to the
        // peach scale so existing amber-* classes render in the new theme.
        ink: {
          950: "#131313",
          900: "#1b1b1b",
          800: "#242424",
          700: "#333333",
          600: "#454545",
        },
        amber: {
          100: "#ffead9",
          200: "#ffdcc2",
          300: "#fec298",
          400: "#fc9867",
          500: "#fa7d43",
          600: "#e86424",
        },
      },
      fontFamily: {
        sans: ["Raleway", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
        display: ["Raleway", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
