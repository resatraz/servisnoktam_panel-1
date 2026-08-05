/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B1A1A',
        primaryDark: '#6B1414',
        primaryAccent: '#F5C4B3',
        background: '#FDF5F5',
      },
    },
  },
  plugins: [],
}
