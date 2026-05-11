/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
        },
        secondary: {
          DEFAULT: '#a855f7',
          light: '#c084fc',
        },
        surface: '#1e293b',
        background: '#0f172a',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
      },
      backdropBlur: {
        'glass': '16px',
      }
    },
  },
  plugins: [],
}
