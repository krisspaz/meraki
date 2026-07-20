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
          blue: '#3939FF',
          celeste: '#AEE6ED',
          orange: '#FF5B22',
          yellow: '#F2BB05',
          purple: '#DBB8FF',
          black: '#000000',
          white: '#FFFFFF',
          
          // Tema Violeta/Índigo Profundo Iluminado (No negro plano, no blanco plano)
          dark: '#1A1638',
          darker: '#120E29',
          card: '#1E1945',
          cardHover: '#272156',
          fuchsia: '#DBB8FF',
          pink: '#FF5B22',
          coral: '#FF5B22',
          accent: '#DBB8FF',
          light: '#F8F9FE',
          muted: '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'meraki-gradient': 'linear-gradient(135deg, #FF5B22 0%, #3939FF 50%, #DBB8FF 100%)',
        'meraki-grad-orange': 'linear-gradient(135deg, #FF5B22 0%, #F2BB05 100%)',
        'meraki-grad-celeste': 'linear-gradient(135deg, #3939FF 0%, #AEE6ED 100%)',
        'meraki-grad-purple': 'linear-gradient(135deg, #3939FF 0%, #DBB8FF 100%)',
        'meraki-bg-grad': 'linear-gradient(180deg, #181335 0%, #100C24 100%)',
        'meraki-glow': 'radial-gradient(circle at 50% 50%, rgba(219, 184, 255, 0.2) 0%, transparent 70%)',
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
