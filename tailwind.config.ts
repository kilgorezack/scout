import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cream paper background
        paper: {
          DEFAULT: '#f7f4ec',
          50: '#fdfcf8',
          100: '#f7f4ec',
          200: '#ece6d4',
          300: '#ddd2b3'
        },
        // Near-black "ink" with a cool undertone
        ink: {
          DEFAULT: '#0b0f1a',
          50: '#f5f6f9',
          100: '#e7e9ef',
          200: '#cdd2dd',
          300: '#a4adc1',
          400: '#6f7a96',
          500: '#4a5572',
          600: '#2f3852',
          700: '#1c2238',
          800: '#121828',
          900: '#0b0f1a',
          950: '#05080f'
        },
        // Electric "signal" accent
        signal: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        // Warm accent for highlights / hot opportunities
        ember: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      letterSpacing: {
        tightest: '-0.04em'
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'rotate(0deg)', opacity: '0.0' },
          '20%': { opacity: '0.45' },
          '100%': { transform: 'rotate(360deg)', opacity: '0.0' }
        },
        pulse_dot: {
          '0%,100%': { opacity: '0.4', transform: 'scale(0.95)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' }
        }
      },
      animation: {
        sweep: 'sweep 8s linear infinite',
        'pulse-dot': 'pulse_dot 2.4s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
