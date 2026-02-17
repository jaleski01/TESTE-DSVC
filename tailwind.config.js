
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
          cyan: '#00f3ff', // Added for the cyan orb
        },
        glass: {
          surface: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.05)',
          highlight: 'rgba(255, 255, 255, 0.1)',
        }
      },
      backgroundImage: {
        'top-neon-glow': 'radial-gradient(circle at 50% 0%, rgba(176, 38, 255, 0.6) 0%, rgba(176, 38, 255, 0.15) 40%, rgba(0, 0, 0, 1) 90%)',
        'radial-vignette': 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 70%, #000000 100%)',
      },
      animation: {
        blob: "blob 10s infinite",
        'blob-slow': "blob 15s infinite reverse",
        'pulse-slow': "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
}
