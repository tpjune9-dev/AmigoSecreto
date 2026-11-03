/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pine: {
          50: '#f2f8f5',
          100: '#dfefe7',
          500: '#1b5e3a',
          600: '#14492d',
          700: '#0f3822',
          800: '#0a2919',
          900: '#061c11',
          950: '#03110a',
        },
        crimson: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#d42426',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
        },
        cream: {
          50: '#fffdf9',
          100: '#fdfbf3',
          200: '#f9f3e3',
          300: '#f2e6c9',
        },
        gold: {
          300: '#fde047',
          400: '#f5c542',
          500: '#d4af37',
          600: '#b59024',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      }
    },
  },
  plugins: [],
}

