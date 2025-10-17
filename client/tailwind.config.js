/ ** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
      },
    },
    extend: {
      colors: {
        brand: {
          primary: '#1E3A8A',   // deep blue
          accent:  '#A78BFA',   // soft purple
          slate:   '#334155',   // slate gray
          neutral: '#F9FAFB',   // soft white
        },
      },
      borderRadius: {
        'xl': '1.25rem',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)',     opacity: '1' },
        },
      },
      animation: {
        fadeIn:  'fadeIn 0.6s ease forwards',
        slideUp: 'slideUp 0.4s ease both',
        scaleIn: 'scaleIn 0.2s ease-out both',
      },
    },
  },
  // NOTE: line-clamp plugin is used by `line-clamp-3` in UI.
  // Install once in the client folder: `npm i -D @tailwindcss/line-clamp`
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}