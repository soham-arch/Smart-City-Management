/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        city: {
          bg: '#07070c',
          dark: '#0d0d15',
          panel: '#111120',
          border: '#1a1a2e',
          neon: '#39ff8f',
          blue: '#3d8fff',
          danger: '#ff2d55',
          warning: '#ffb800',
          text: '#e0e0e8',
          muted: '#6b6b80',
        }
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s linear infinite',
        'ripple': 'ripple 0.6s linear',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px #39ff8f, 0 0 20px #39ff8f40' },
          '50%': { boxShadow: '0 0 20px #39ff8f, 0 0 60px #39ff8f60' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { textShadow: '0 0 10px #39ff8f40' },
          '100%': { textShadow: '0 0 20px #39ff8f80, 0 0 40px #39ff8f40' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(#1a1a2e 1px, transparent 1px), linear-gradient(90deg, #1a1a2e 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
