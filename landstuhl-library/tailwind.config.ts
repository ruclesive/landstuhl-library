import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#050508',
        deep: '#0a0b12',
        surface: '#0f1120',
        glass: 'rgba(255,255,255,0.04)',
        'glass-border': 'rgba(255,255,255,0.08)',
        electric: '#4f6ef7',
        cyan: '#06d6d6',
        aurora: '#9b5de5',
        gold: '#f7c948',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-electric': 'linear-gradient(135deg, #4f6ef7 0%, #9b5de5 50%, #06d6d6 100%)',
        'gradient-hero': 'linear-gradient(180deg, transparent 0%, rgba(5,5,8,0.6) 60%, #050508 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'text-shimmer': 'textShimmer 3s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        textShimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
      boxShadow: {
        'glow-electric': '0 0 40px rgba(79,110,247,0.35), 0 0 80px rgba(79,110,247,0.15)',
        'glow-cyan': '0 0 40px rgba(6,214,214,0.35), 0 0 80px rgba(6,214,214,0.12)',
        'glow-gold': '0 0 30px rgba(247,201,72,0.4), 0 0 60px rgba(247,201,72,0.15)',
        'glow-aurora': '0 0 40px rgba(155,93,229,0.35)',
        'glass': 'inset 0 1px 0 rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.5)',
        'card-hover': '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
