module.exports = {
  content: ["./src/**/*.{js,jsx,jsx,ts,tsx,css}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        blueprimary: "#4AAAD6",
        redprimary: "#E14E54",
        yellowprimary: "#FAB700",
        greenprimary: "#153D39",
      },
      animation: {
        bounce200: "bounce 1s infinite 200ms",
        bounce400: "bounce 1s infinite 400ms",
      },
    },
  },
  plugins: [
    require("tailwindcss-rtl"),
    function ({ addUtilities }) {
      const newUtilities = {
        ".flex-center": {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      };

      addUtilities(newUtilities);
    },
  ],
};
