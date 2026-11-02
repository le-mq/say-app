/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        say: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          primary: 'var(--color-primary)',
          accent: 'var(--color-accent)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          cream: 'var(--color-note-cream)',
        },
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
