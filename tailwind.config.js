/** @type {import('tailwindcss').Config} */
const v = (nombre) => `rgb(var(--${nombre}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"Fraunces Variable"', 'ui-serif', 'Georgia', 'serif'],
      },
      keyframes: {
        apareceSuave: { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'aparece-suave': 'apareceSuave .5s cubic-bezier(.22,1,.36,1) both',
      },
      colors: {
        primary: v('primary'),
        primaryDark: v('primaryDark'),
        primarySoft: v('primarySoft'),
        secondary: v('secondary'),
        danger: v('danger'),
        dangerSoft: v('dangerSoft'),
        warning: v('warning'),
        warningSoft: v('warningSoft'),
        success: v('success'),
        successSoft: v('successSoft'),
        info: v('info'),
        infoSoft: v('infoSoft'),
        universidad: v('universidad'),
        trabajo: v('trabajo'),
        bg: v('bg'),
        surface: v('surface'),
        textPrimary: v('textPrimary'),
        textSecondary: v('textSecondary'),
      },
      borderRadius: { sm2: '12px', md2: '18px', lg2: '24px' },
      boxShadow: { card: '0 1px 2px rgba(20,30,50,0.04), 0 4px 14px rgba(20,30,50,0.06)' },
    },
  },
  plugins: [],
};
