import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'Press Start 2P'", "ui-monospace", "monospace"],
      },
      colors: {
        gb: {
          screen: "#9bbc0f",
          light: "#8bac0f",
          mid: "#306230",
          dark: "#0f380f",
        },
      },
      boxShadow: {
        pixel: "4px 4px 0 #000",
        "pixel-sm": "2px 2px 0 #000",
        "pixel-inset": "inset 2px 2px 0 #000",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        pulse_slow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out infinite",
        pulse_slow: "pulse_slow 2s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};

export default config;
