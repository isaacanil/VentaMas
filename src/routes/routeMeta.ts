// Centraliza metadatos y constantes de rutas para evitar dependencias circulares.
export const ROUTE_STATUS = Object.freeze({
  STABLE: 'stable',      // Ruta estable
  BETA: 'beta',          // Funcionalidad en beta
  WIP: 'wip',            // En construcción
  HIDDEN: 'hidden',      // No listada en menús (decisión de UI)
  DISABLED: 'disabled',  // Excluida totalmente
}) as const;

export type RouteStatus = typeof ROUTE_STATUS[keyof typeof ROUTE_STATUS];

// Helper opcional para marcar rutas (se puede usar más adelante)
export const withStatus = <TRoute extends object>(route: TRoute, status: RouteStatus) => ({
  ...route,
  status,
});

export default ROUTE_STATUS;
