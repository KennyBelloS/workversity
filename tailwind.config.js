/** @type {import('tailwindcss').Config} */
const v = (nombre) => `rgb(var(--${nombre}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Variable"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"Geist Variable"', 'sans-serif'],
        mono: ['"Geist Mono Variable"', 'ui-monospace', 'monospace'],
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
        oro: v('oro'),
        coral: v('coral'),
        oroSoft: v('oroSoft'),
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
        surfaceAlt: v('surfaceAlt'),
        textPrimary: v('textPrimary'),
        textSecondary: v('textSecondary'),
      },
      // Escala tipográfica (7 pasos). t-nota y t-micro solo para metadatos y rótulos.
      fontSize: {
        't-nota': ['11px', { lineHeight: '1.45' }],
        't-micro': ['12.5px', { lineHeight: '1.45' }],
        't-pie': ['13.5px', { lineHeight: '1.5' }],
        't-base': ['15px', { lineHeight: '1.55' }],
        't-medio': ['18px', { lineHeight: '1.4', letterSpacing: '-0.015em' }],
        't-grande': ['24px', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
        't-titulo': ['34px', { lineHeight: '1.08', letterSpacing: '-0.04em' }],
      },
      borderRadius: { sm2: '12px', md2: '18px', lg2: '26px', pieza: '20px' },
      spacing: { gap: '12px', bloque: '18px' },
      transitionTimingFunction: { salida: 'cubic-bezier(.2,.8,.2,1)', entrada: 'cubic-bezier(.4,0,.2,1)' },
      // Tarjetas: filete fino de tinta + sombra larga y suave (papel sobre la mesa).
      // Profundidad: el filete de un píxel siempre, y la sombra en varias capas difusas.
      boxShadow: {
        card: '0 0 0 1px rgb(var(--linea) / var(--lineaFuerza))',
        alto: '0 0 0 1px rgb(var(--linea) / var(--lineaFuerza)), 0 2px 4px rgb(var(--sombra) / .06), 0 12px 28px -12px rgb(var(--sombra) / .22)',
        flotante: '0 0 0 1px rgb(var(--linea) / var(--lineaFuerza)), 0 4px 10px rgb(var(--sombra) / .1), 0 24px 56px -20px rgb(var(--sombra) / .45)',
        brillo: '0 0 0 1px rgb(var(--primary) / .5), 0 0 24px -4px rgb(var(--primary) / .45)',
      },
    },
  },
  plugins: [],
};
