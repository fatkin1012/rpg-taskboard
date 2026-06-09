/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'pixel-bg': '#0f0f23',
        'pixel-panel': '#1a1a3e',
        'pixel-border': '#4a4a8a',
        'pixel-accent': '#ff6b6b',
        'pixel-xp': '#ffd700',
        'pixel-hp': '#00ff88',
        'pixel-text': '#e0e0ff',
        'pixel-dim': '#6a6a8a',
        'pixel-rare': '#aa66ff',
        'pixel-diff-simple': '#2ed573',
        'pixel-diff-medium': '#ffa502',
        'pixel-diff-hard': '#ff4757',
        'pixel-diff-epic': '#aa66ff',
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'monospace'],
        'mono': ['"Courier New"', 'monospace'],
      },
      animation: {
        'xp-float': 'xpFloat 1s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'level-up': 'levelUp 0.5s ease-out',
        'pixel-blink': 'pixelBlink 0.3s step-end infinite',
      },
      keyframes: {
        xpFloat: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-40px)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 215, 0, 0.3)' },
          '50%': { boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)' },
        },
        levelUp: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        pixelBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
};
