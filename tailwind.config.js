/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#000000',
        neon: {
          purple: '#b026ff',
          violet: '#7c3aed',
        }
      },
      backgroundImage: {
        'top-neon-glow': 'radial-gradient(circle at 50% 0%, rgba(176, 38, 255, 0.25) 0%, rgba(0, 0, 0, 1) 75%)',
      }
    },
  },
  plugins: [],
}