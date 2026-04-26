/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff0f5",
          100: "#ffe0eb",
          200: "#ffc0cb",
          300: "#ff99b5",
          400: "#ff6699",
          500: "#e84393",
          600: "#c71585",
          700: "#9d1068",
          800: "#730b4c",
          900: "#4a0730",
        },
        rose: {
          glass: "rgba(255,192,203,0.18)",
        }
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Playfair Display'", "Georgia", "serif"],
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease both",
        "slide-up":   "slideUp 0.4s ease both",
        "slide-down": "slideDown 0.3s ease both",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "bell-ring":  "bellRing 0.6s ease",
        "bounce-in":  "bounceIn 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both",
        "badge-pop":  "badgePop 0.4s cubic-bezier(0.36,0.07,0.19,0.97) both",
        "modal-in":   "modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
        "modal-out":  "modalOut 0.2s ease both",
        "overlay-in": "overlayIn 0.2s ease both",
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 },                       to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideDown: { from: { opacity: 0, transform: "translateY(-10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        pulseSoft: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.6 } },
        bellRing:  {
          "0%":   { transform: "rotate(0) scale(1)" },
          "15%":  { transform: "rotate(-18deg) scale(1.15)" },
          "30%":  { transform: "rotate(16deg) scale(1.15)" },
          "45%":  { transform: "rotate(-12deg) scale(1.1)" },
          "60%":  { transform: "rotate(10deg) scale(1.05)" },
          "75%":  { transform: "rotate(-6deg) scale(1)" },
          "100%": { transform: "rotate(0) scale(1)" },
        },
        bounceIn: {
          "0%":   { opacity: 0, transform: "scale(0.3)" },
          "50%":  { opacity: 1, transform: "scale(1.1)" },
          "70%":  { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)" },
        },
        modalIn: {
          "0%":   { opacity: 0, transform: "scale(0.92) translateY(12px)" },
          "100%": { opacity: 1, transform: "scale(1) translateY(0)" },
        },
        modalOut: {
          "0%":   { opacity: 1, transform: "scale(1) translateY(0)" },
          "100%": { opacity: 0, transform: "scale(0.94) translateY(8px)" },
        },
        overlayIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
        badgePop: {
          "0%":   { transform: "scale(0)" },
          "60%":  { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        glass: "0 8px 32px rgba(199,21,133,0.08)",
        card:  "0 2px 16px rgba(199,21,133,0.07)",
        "card-hover": "0 8px 32px rgba(199,21,133,0.15)",
      },
      borderRadius: { "3xl": "1.5rem", "4xl": "2rem" },
    },
  },
  plugins: [],
};
