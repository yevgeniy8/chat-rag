/**
 * Thesis Note: PostCSS pipeline activates Tailwind's utility compiler and autoprefixing to keep styles reproducible
 * across browsers, ensuring evaluation participants see identical interfaces.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
