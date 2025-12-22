export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
  theme: {
    extend: {
      /* ────────────────────  Colores  ──────────────────── */
      colors: {
        primary: '#0066ff',
        secondary: '#ff5577',

        success: '#33d9b2',
        warning: '#ffaa00',
        error: '#ff4d4f',

        /* NUEVOS estados extra */
        info: '#2f7cff',
        critical: '#e03131',

        /* Fondo neutro para barras de progreso */
        progress: {
          bg: '#e6e8ef',
        },

        /* Neutrales */
        text: {
          100: '#2b3043',
          60: '#5c667b',
        },
        bg: {
          base: '#ffffff',
          elev: '#f5f6fa',
        },
        border: '#d7dbe8',
      },

      /* ───────────  Radios, espaciado y tipografía  ─────────── */
      borderRadius: {
        DEFAULT: '12px',
        pill: '9999px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '24px',
        6: '32px',
        7: '48px',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },

      /* ────────────────────  Sombras  ──────────────────── */
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,.08)',
        md: '0 4px 10px rgba(0,0,0,.12)',
      },

      /* ──────────────  Helper para la cuadrícula  ───────────── */
      gridTemplateColumns: {
        dashboard: 'repeat(auto-fit, minmax(320px, 1fr))',
      },
    },
  },
  plugins: [],
};
