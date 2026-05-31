import type { ModuleStatus } from './ModuleCard.types';

export const STATUS_CONFIG: Record<
  ModuleStatus,
  { color: string; label: string }
> = {
  active: {
    color: 'success',
    label: 'Activo',
  },
  inactive: {
    color: 'default',
    label: 'Inactivo',
  },
  'config-pending': {
    color: 'warning',
    label: 'Configuracion pendiente',
  },
};
