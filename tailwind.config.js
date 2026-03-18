 // tailwind.config.js — Extended for SENTINEL cyberpunk theme
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:     '#060912',
          panel:  '#0a0e1c',
          card:   '#0f1428',
          cyan:   '#00d4ff',
          purple: '#7c3aed',
          green:  '#00ff88',
          red:    '#ff3366',
          orange: '#ff8c42',
          yellow: '#ffd60a',
        }
      },
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        mono:    ['JetBrains Mono', 'monospace'],
        body:    ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'spin-slow':    'spin 8s linear infinite',
        'bounce-slow':  'bounce 2s infinite',
        'gradient':     'dataFlow 4s ease infinite',
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
      boxShadow: {
        'glow-cyan':   '0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(0,212,255,0.1)',
        'glow-purple': '0 0 20px rgba(124,58,237,0.4)',
        'glow-green':  '0 0 20px rgba(0,255,136,0.3)',
        'glow-red':    '0 0 20px rgba(255,51,102,0.4)',
      },
    },
  },
  plugins: [],
}
