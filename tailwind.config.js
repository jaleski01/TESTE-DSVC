
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
        // Subtle radial gradient emerging from the bottom
        'neon-glow': 'radial-gradient(circle at 50% 100%, rgba(124, 58, 237, 0.2) 0%, rgba(0, 0, 0, 1) 70%)',
      }
    },
  },
  plugins: [],
}
