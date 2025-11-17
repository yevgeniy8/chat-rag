/**
 * Thesis Note: TailwindCSS config stabilizes a utility-first design system, ensuring repeatable UI setups
 * across experiments and enabling precise documentation of layout and color choices in evaluation.
 */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rag: {
          on: "#22c55e",
          off: "#9ca3af"
        }
      }
    }
  },
  plugins: []
};
