// Design system v2 tokens to standardize colors, typography, spacing and effects.
export const designSystemV2 = Object.freeze({
  colors: {
    background: {
      canvas: '#f5f6fa',
      surface: '#ffffff',
      surfaceSubtle: '#f8fafc',
    },
    text: {
      primary: '#292e38ff',
      secondary: '#475569',
      muted: '#64748b',
      inverse: '#ffffff',
    },
    brand: {
      primary: '#4f46e5',
      primaryHover: '#4338ca',
      subtle: 'rgba(79, 70, 229, 0.12)',
    },
    stroke: {
      subtle: 'rgba(148, 163, 184, 0.18)',
      soft: 'rgba(148, 163, 184, 0.12)',
      bold: 'rgba(148, 163, 184, 0.32)',
    },
    states: {
      success: '#16a34a',
      danger: '#dc2626',
      warning: '#f59e0b',
      info: '#0284c7',
      neutral: '#475569',
    },
    layers: {
      successSoft: 'rgba(22, 163, 74, 0.12)',
      successBorder: 'rgba(22, 163, 74, 0.24)',
      successShadow: 'rgba(22, 163, 74, 0.18)',
      dangerSoft: 'rgba(220, 38, 38, 0.14)',
      dangerBorder: 'rgba(220, 38, 38, 0.28)',
      dangerShadow: 'rgba(220, 38, 38, 0.2)',
      neutralSoft: 'rgba(148, 163, 184, 0.14)',
      neutralBorder: 'rgba(148, 163, 184, 0.24)',
      neutralShadow: 'rgba(148, 163, 184, 0.16)',
    },
    skeleton: {
      base: 'rgba(203, 213, 225, 0.35)',
      highlight: 'rgba(203, 213, 225, 0.8)',
    },
  },
  typography: {
    displayLg: { fontSize: '2rem', lineHeight: '2.5rem', fontWeight: 600 },
    headingMd: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 600 },
    headingSm: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 600 },
    body: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400 },
    bodySm: { fontSize: '0.875rem', lineHeight: '1.4rem', fontWeight: 400 },
    caption: { fontSize: '0.8125rem', lineHeight: '1.2rem', fontWeight: 500 },
    label: {
      fontSize: '0.75rem',
      lineHeight: '1rem',
      fontWeight: 600,
      letterSpacing: '0.04em',
    },
    overline: {
      fontSize: '0.7rem',
      lineHeight: '1rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
    },
    button: { fontSize: '0.875rem', lineHeight: '1.2rem', fontWeight: 600 },
  },
  spacing: {
    none: '0',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    xxl: '1.5rem',
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    pill: '9999px',
  },
  shadows: {
    xs: '0 2px 8px rgba(15, 23, 42, 0.06)',
    sm: '0 6px 18px rgba(15, 23, 42, 0.08)',
    md: '0 10px 25px rgba(15, 23, 42, 0.1)',
    lg: '0 12px 32px rgba(15, 23, 42, 0.14)',
    state: {
      success: '0 8px 18px rgba(22, 163, 74, 0.18)',
      danger: '0 8px 18px rgba(220, 38, 38, 0.22)',
      neutral: '0 8px 18px rgba(148, 163, 184, 0.16)',
    },
  },
  transitions: {
    subtle: 'all 150ms ease-out',
    base: 'all 200ms ease',
  },
  layout: {
    maxContentWidth: '1200px',
  },
});

export default designSystemV2;
