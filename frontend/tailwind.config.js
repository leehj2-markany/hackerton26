/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'markany-blue': '#3182F6',
        'markany-dark': '#1B64DA',
        'markany-light': '#EBF4FF',
        'markany-accent': '#1B64DA',
        'toss-blue': '#3182F6',
        'toss-dark': '#1B64DA',
        'toss-gray': {
          50: '#F9FAFB',
          100: '#F2F4F6',
          200: '#E5E8EB',
          300: '#D1D6DB',
          400: '#B0B8C1',
          500: '#8B95A1',
          600: '#6B7684',
          700: '#4E5968',
          800: '#333D4B',
          900: '#191F28',
        },
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        'toss': '16px',
        'toss-sm': '12px',
        'toss-xs': '8px',
      },
    },
  },
  plugins: [],
}
