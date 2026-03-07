import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      colors: {
        gold: {
          DEFAULT: '#FFD700',
          50: '#FFFDE7',
          100: '#FFF9C4',
          200: '#FFF176',
          300: '#FFEE58',
          400: '#FFCA28',
          500: '#FFD700',
          600: '#F9A825',
          700: '#F57F17',
          800: '#E65100',
          900: '#BF360C',
        },
        charcoal: {
          DEFAULT: '#1A1A1A',
          50: '#2C2C2C',
          100: '#242424',
          200: '#1A1A1A',
          300: '#111111',
          400: '#0A0A0A',
        },
        vault: {
          bg: '#0D0D0D',
          surface: '#161616',
          card: '#1E1E1E',
          border: '#2A2A2A',
          muted: '#3A3A3A',
          text: '#E8E8E8',
          'text-muted': '#8A8A8A',
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #F9A825 50%, #FFD700 100%)',
        'dark-gradient': 'linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%)',
        'card-gradient': 'linear-gradient(135deg, #1E1E1E 0%, #161616 100%)',
        'glow-gold': 'radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(255, 215, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.1)',
        'gold-glow-sm': '0 0 10px rgba(255, 215, 0, 0.2)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.7)',
        'inner-glow': 'inset 0 0 20px rgba(255, 215, 0, 0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(255, 215, 0, 0.5)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [animate],
}

export default config
