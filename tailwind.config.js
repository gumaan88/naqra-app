/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/client/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          turquoise: '#24A9A0',
          yellow: '#FFC857',
          coral: '#FF7A6B',
          success: '#34A853',
          error: '#E55353',
          bg: '#FFF9F0',
          text: '#24303A',
          purple: '#7357C8',
        }
      },
      fontFamily: {
        arabic: ['Noto Sans Arabic', 'Tajawal', 'Cairo', 'sans-serif'],
      },
      animation: {
        'bounce-short': 'bounce 0.5s ease-in-out 1',
        'pulse-hint': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.3s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-2px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(4px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-6px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(6px, 0, 0)' },
        }
      }
    },
  },
  plugins: [],
}
