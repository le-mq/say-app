/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          bg: "#081724",
          surface: "#142C40",
          elevated: "#31566A",
          accent: "#91B9C5",
          text: "#E8EEF0",
        },
        lavender: {
          accent: "#B39DDB",
        },
        warm: {
          cream: "#F2EDE3",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
