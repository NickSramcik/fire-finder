/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/*.ejs",
    "./public/**/*.{html,js}",
    "./src/*.{html,js}",
    // "./node_modules/tw-elements/dist/js/**/*.min.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        firefinder: {
          "primary": "#1EB854",
          "secondary": "#fef2e6",
          "accent": "#D99330",
          "neutral": "#110E0E",
          "base-100": "#171212",
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",
        },
      },
    ],
  },
  // plugins: [require('daisyui'), require('tw-elements/dist/plugin')],
}