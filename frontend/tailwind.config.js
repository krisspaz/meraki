/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        meraki: {
          dark: '#0B0B10',
          darker: '#06060A',
          card: '#141424',
          cardHover: '#1C1C34',
          purple: '#7C3AED',
          fuchsia: '#D946EF',
          pink: '#EC4899',
          coral: '#F43F5E',
          yellow: '#F59E0B',
          accent: '#C084FC',
          light: '#F8FAFC',
          muted: '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'meraki-gradient': 'linear-gradient(135deg, #7C3AED 0%, #D946EF 50%, #F43F5E 100%)',
        'meraki-dark-grad': 'linear-gradient(180deg, #0B0B10 0%, #06060A 100%)',
        'meraki-glow': 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 60%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
