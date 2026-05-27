import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#ffffff',
          subtle: '#fbfbfd',
          muted: '#f5f5f7'
        },
        ink: {
          DEFAULT: '#1d1d1f',
          50: '#f5f5f7',
          100: '#e8e8ed',
          200: '#d2d2d7',
          300: '#a1a1a6',
          400: '#86868b',
          500: '#6e6e73',
          600: '#515154',
          700: '#3a3a3c',
          800: '#262628',
          900: '#1d1d1f',
          950: '#0a0a0a'
        },
        accent: {
          DEFAULT: '#0071e3',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0071e3',
          600: '#0060c7',
          700: '#0050a8',
          800: '#003e84',
          900: '#002b5c'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      letterSpacing: {
        tightest: '-0.045em',
        tighter2: '-0.03em'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.08)',
        lift: '0 4px 6px -2px rgba(0,0,0,0.04), 0 20px 50px -20px rgba(0,0,0,0.15)',
        glow: '0 10px 40px -10px rgba(0,113,227,0.45)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.04), 0 12px 36px -12px rgba(0,0,0,0.12)'
      },
      backdropBlur: {
        xs: '2px'
      },
      keyframes: {
        aurora: {
          '0%,100%': { transform: 'translate3d(0,0,0) rotate(0deg)' },
          '50%': { transform: 'translate3d(2%,1%,0) rotate(8deg)' }
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        pulseDot: {
          '0%,100%': { opacity: '0.5', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' }
        }
      },
      animation: {
        aurora: 'aurora 28s ease-in-out infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        'pulse-dot': 'pulseDot 2.4s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
