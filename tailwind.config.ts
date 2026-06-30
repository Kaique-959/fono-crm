import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#fbf6ee",
        surface: "#fffdf8",
        "surface-warm": "#f1e3cf",
        fg: "#201914",
        "fg-2": "#4c4037",
        muted: "#7a6d63",
        meta: "#9b5b32",
        border: "#ded2c3",
        "border-soft": "#eee4d7",
        accent: "#9b5b32",
        "accent-on": "#ffffff",
        "accent-hover": "#8a4f2a",
        "accent-soft": "rgba(155,91,50,0.08)",
        success: "#4f8a4f",
        warn: "#c9822f",
        danger: "#b33a3a",
      },
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '10px',
        md: '16px',
        lg: '24px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
export default config
