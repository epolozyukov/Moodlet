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
          screen: "#c4e07a",
          light: "#a8c85a",
          mid: "#3a6e3a",
          dark: "#0f380f",
        },
      },
      boxShadow: {
        pixel: "4px 4px 0 #0f380f",
        "pixel-sm": "2px 2px 0 #0f380f",
        "pixel-inset": "inset 2px 2px 0 #0f380f",
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
        bounceAction: {
          "0%":   { transform: "translateY(0) scale(1)" },
          "35%":  { transform: "translateY(-14px) scale(1.1)" },
          "65%":  { transform: "translateY(-6px) scale(1.05)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out infinite",
        pulse_slow: "pulse_slow 2s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
        "bounce-action": "bounceAction 0.45s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
