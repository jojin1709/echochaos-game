/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./game/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stage: {
          DEFAULT: "#0B1B4D",
          deep: "#060F30",
          panel: "#132868",
          line: "#24397D",
        },
        action: {
          yellow: "#FFC93C",
          yellowDark: "#E8AD11",
        },
        success: {
          DEFAULT: "#2FD180",
          dark: "#1FA866",
        },
        record: {
          DEFAULT: "#FF4D6D",
          dark: "#E5324F",
        },
        cream: "#FFF6E9",
        character: {
          pink: "#FF6FA5",
          blue: "#4CC3FF",
          yellow: "#FFD65C",
          green: "#5CE0A0",
          purple: "#B78CFF",
          orange: "#FF9F5C",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.75rem",
        pill: "999px",
      },
      boxShadow: {
        stage: "0 20px 60px -15px rgba(6, 15, 48, 0.7)",
        panel: "0 10px 0 0 rgba(0,0,0,0.15)",
        yellow: "0 8px 0 0 #C98D08",
        record: "0 8px 0 0 #B01F39",
        success: "0 8px 0 0 #157A48",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        popIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        confettiFall: {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(360deg)", opacity: "0.9" },
        },
      },
      animation: {
        float: "float 3.5s ease-in-out infinite",
        pulseRing: "pulseRing 1.4s ease-out infinite",
        popIn: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        confetti: "confettiFall linear forwards",
      },
    },
  },
  plugins: [],
};
