/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    ".views.ejs",
    "./public/**/*. {html,js}",
    // "./node_modules/tw-elements/dist/js/**/*.min.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter"],
  },
  // plugins: [require('daisyui'), require('tw-elements/dist/plugin')],
}
