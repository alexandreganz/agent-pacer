/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lego-blue': '#0055BF',
        'status-healthy': '#00C49A',
        'status-warning': '#FFB703',
        'status-critical': '#EF476F',
        'status-escalated': '#118AB2',
        'console-bg': '#1E1E1E',
      },
      animation: {
        'pulse-critical': 'pulse-critical 1.5s ease-in-out infinite',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'slide-in': 'slide-in 0.4s ease-out forwards',
        'progress-fill': 'progress-fill 0.8s ease-out forwards',
      },
      keyframes: {
        'pulse-critical': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'progress-fill': {
          '0%': { width: '0%' },
        },
      },
    },
  },
  plugins: [],
}
