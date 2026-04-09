/**
 * zIndex — Escala de apilamiento para ERP.
 *
 * En un ERP pueden coexistir simultáneamente: tablas con dropdowns inline,
 * modales de confirmación sobre drawers de detalle, y toasts/notificaciones
 * encima de todo. Esta escala previene conflictos de stacking.
 *
 * Regla: nunca usar números ad-hoc fuera de estos tokens.
 */
export const zIndex = {
  // Contenido base — tablas, cards, formularios
  base: '0',
  // Elementos elevados dentro del flujo — tooltips de celda, row actions
  raised: '10',
  // Dropdowns y selects que rompen el flujo del formulario
  dropdown: '100',
  // Sticky headers de tabla, nav top bar
  sticky: '200',
  // Drawers laterales (detalle de factura, ficha de cliente)
  drawer: '300',
  // Modales de acción principal (crear, editar, confirmar)
  modal: '400',
  // Overlay/mask detrás de modal o drawer
  overlay: '390',
  // Notificaciones y toasts — siempre encima de todo
  toast: '500',
  // Tooltips de ayuda contextual — encima de modales también
  tooltip: '510',
} as const;
