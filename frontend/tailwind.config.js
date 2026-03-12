/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'markany-blue': '#0066CC',
        'markany-dark': '#003366',
        'markany-light': '#E6F2FF',
        'markany-accent': '#0052A3',
      },
    },
  },
  plugins: [],
}
