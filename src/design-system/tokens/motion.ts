/**
 * motion — Tokens de animación para ERP.
 *
 * Principio M3 adaptado: las transiciones en ERP deben ser rápidas y funcionales.
 * No son expresivas — su propósito es orientar al usuario (qué cambió, adónde fue).
 *
 * Reglas:
 * - UI de datos (tablas, inputs, badges): usar `fast` + `easeOut`.
 * - Apertura de paneles/modales: usar `base` + `easeOut`.
 * - Drawers y overlays: usar `slow` + `easeInOut`.
 * - Nunca usar duraciones > 300ms para feedback inmediato (hover, focus, press).
 */
export const motion = {
  duration: {
    // Feedback inmediato: hover, focus ring, press, badge color
    instant: '80ms',
    // Transiciones de estado en componentes pequeños: inputs, checks, switches
    fast: '150ms',
    // Apertura de popovers, dropdowns, tooltips
    base: '200ms',
    // Apertura de modales, expansión de secciones de formulario
    slow: '280ms',
    // Drawers laterales, slideouts de detalle
    enter: '300ms',
    // Salida siempre más rápida que entrada (percepción de velocidad)
    exit: '200ms',
  },

  easing: {
    // Elementos que aparecen: aceleran al inicio, frenan al final
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    // Elementos que desaparecen: empiezan rápido, frenan
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    // Cambios de posición / reacomodos de layout
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    // Lineal: usado únicamente en Progress/Skeleton loaders
    linear: 'linear',
  },

  // Combinaciones listas para `transition` CSS — las más usadas en ERP
  transition: {
    // Input focus ring, button hover
    interactive: '150ms cubic-bezier(0.0, 0.0, 0.2, 1)',
    // Dropdown / popover appear
    popover: '200ms cubic-bezier(0.0, 0.0, 0.2, 1)',
    // Modal enter
    modal: '280ms cubic-bezier(0.0, 0.0, 0.2, 1)',
    // Drawer slide-in
    drawer: '300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    // Collapse / expand de sección
    expand: '200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
} as const;
