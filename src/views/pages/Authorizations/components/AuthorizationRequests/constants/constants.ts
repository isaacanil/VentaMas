import type { AuthorizationStatus } from '../types';

type StatusThemeToken = {
  bg: string;
  color: string;
};

const STATUS_THEME_BASE = {
  pending: { bg: '#fff7e6', color: '#ad6800' },
  approved: { bg: '#f6ffed', color: '#135200' },
  rejected: { bg: '#fff1f0', color: '#a8071a' },
  expired: { bg: '#f5f5f5', color: '#595959' },
  used: { bg: '#e6f4ff', color: '#0958d9' },
  completed: { bg: '#f0f5ff', color: '#1d39c4' },
} as const satisfies Record<string, StatusThemeToken>;

export const statusTheme: Record<string, StatusThemeToken> = STATUS_THEME_BASE;

const STATUS_LABELS_BASE = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  expired: 'Expirada',
  used: 'Utilizada',
  completed: 'Completada',
} as const;

export const statusLabels: Record<string, string> = STATUS_LABELS_BASE;

export const ITEMS_PER_PAGE = 8;

export const formatDateTime = (value: unknown): string => {
  if (!value) return '-';

  try {
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
      return new Date(value.toDate()).toLocaleString();
    }

    if (value instanceof Date) {
      return value.toLocaleString();
    }

    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  } catch (error) {
    return '-';
  }
};

export const getStatusLabel = (status: AuthorizationStatus | undefined): string => {
  if (!status) return '-';
  return statusLabels[status] || status;
};
