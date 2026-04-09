export const typography = {
  fontFamily: {
    base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },

  fontSize: {
    xs: '0.75rem',
    sm: '0.8125rem',
    base: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
  },

  letterSpacing: {
    tight: '-0.01em',
    normal: '0',
    wide: '0.025em',
  },

  /**
   * typeScale: aliases semánticos para jerarquía ERP.
   * Cada entrada define las tres propiedades necesarias juntas
   * para evitar errores de combinación (M3: role-based pairing).
   */
  typeScale: {
    // Tínulos de página / módulo (ej: "Facturas", "Inventario")
    pageTitle:    { size: '1.25rem',   weight: '600', lineHeight: '1.25' },
    // Tínulo de sección dentro de un formulario o panel
    sectionTitle: { size: '1rem',     weight: '600', lineHeight: '1.25' },
    // Etiquetas de campo y encabezados de columna destacados
    heading:      { size: '0.875rem', weight: '600', lineHeight: '1.25' },
    // Cuerpo principal, texto de descripción, notas
    body:         { size: '0.875rem', weight: '400', lineHeight: '1.625' },
    // Texto secundario, subtextos, helper text
    bodySmall:    { size: '0.8125rem',weight: '400', lineHeight: '1.625' },
    // Etiquetas de campo en formularios (dense)
    label:        { size: '0.8125rem',weight: '500', lineHeight: '1.5'  },
    // Encabezados de columna en tablas de datos
    tableHeader:  { size: '0.75rem',  weight: '600', lineHeight: '1.25' },
    // Pie de página, metadata, fechas en listados
    caption:      { size: '0.75rem',  weight: '400', lineHeight: '1.5'  },
  },
} as const;
