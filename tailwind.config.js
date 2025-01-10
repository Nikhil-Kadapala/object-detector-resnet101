/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: {
    enabled: true,
    content: ['./src/**/*.html', './src/**/*.js'],
    options: {
      safelist: [],
    },
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
    variants: {
        extend: {},
    },
    plugins: [
      require('@tailwindcss/forms'),
      require('@tailwindcss/typography'),
      require('@tailwindcss/aspect-ratio'),
    ],

    // Add your custom colors here
    colors: {
      primary: '#3490dc',
      secondary: '#ffcc00',
      tertiary: '#e74c3c',
      quaternary: '#2ecc71',
      quinary: '#9b59b6',
      black: '#212121',
      white: '#ffffff',
    },
}
const defaultTheme = require('tailwindcss/defaultTheme')