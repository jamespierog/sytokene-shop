/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'Space Mono'", "monospace"],
        display: ["'VT323'", "monospace"],
      },
      colors: {
        brand: {
          red: "#c0392b",
          gold: "#f39c12",
          cyan: "#7ec8d9",
          dark: "#0a0a0a",
          panel: "#141414",
          surface: "#1c1c1c",
          border: "#2a2a2a",
          muted: "#666",
          green: "#4ade80",
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
      },
      keyframes: {
        blink: { "50%": { opacity: "0" } },
      },
    },
  },
  plugins: [],
};
