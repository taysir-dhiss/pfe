/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff0f3",
          100: "#ffe0e8",
          200: "#ffc0cb", // baby pink
          300: "#ff99b3",
          400: "#ff6699",
          500: "#e84393",
          600: "#c71585", // breast cancer ribbon
          700: "#9d1068",
          800: "#730b4c",
          900: "#4a0730",
        },
      },
    },
  },
  plugins: [],
};

