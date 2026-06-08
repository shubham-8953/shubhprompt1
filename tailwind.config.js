module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        section: "#1E293B",
        card: "#24324A",
        primary: "#7C3AED",
        secondary: "#06B6D4",
        accent: "#F59E0B",
        textMain: "#F8FAFC",
        textMuted: "#CBD5E1",
        // Anti pure-black fallback assignments
        black: "#0F172A",
        slate: {
          950: "#0F172A",
          900: "#0F172A",
          850: "#1E293B",
          800: "#1E293B",
          700: "#24324A",
        },
        gray: {
          950: "#0F172A",
          900: "#0F172A",
          850: "#1E293B",
          800: "#1E293B",
          700: "#24324A",
        },
        zinc: {
          950: "#0F172A",
          900: "#0F172A",
          850: "#1E293B",
          800: "#1E293B",
          700: "#24324A",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
