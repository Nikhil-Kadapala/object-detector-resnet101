/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      'darkblue' : '#161cbb',
      'discblue' : '#0D2A81',
      'discblue-gradient' : '#3F49C2',
      'white' : colors.white,
      'black' : colors.black,
      'gray' : colors.gray,
      'green' : colors.green,
      'blue' : colors.blue,
      'red' : colors.red,
      'yellow' : colors.yellow,
      'slate' : colors.slate,
      'pink-gradient' : '#4E4C8B',
      'alpha' : {
        100: '#091066',
        200: '#01063B',
        300: '#000435',
      },
      'beta' : {
        100: '#091066',
        200: '#030845',
        300: '#000435',
      },
      'skills': '#03438B',
      'dark-button': '#161cbb',
      'light-button': '#7289da',
      'contact': '#20269a',

    },
    extend: {},
  },
  plugins: [],
}

