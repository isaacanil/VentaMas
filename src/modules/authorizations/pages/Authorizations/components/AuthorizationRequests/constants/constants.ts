import type { AuthorizationStatus } from '@/modules/authorizations/pages/Authorizations/components/AuthorizationRequests/types';

interface StatusThemeToken {
  bg: string;
  color: string;
}

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

interface TimestampLike {
  toDate: () => Date | string | number;
}

const isTimestampLike = (value: unknown): value is TimestampLike =>
  typeof value === 'object' &&
  value !== null &&
  'toDate' in value &&
  typeof (value as { toDate?: unknown }).toDate === 'function';

export const formatDateTime = (value: unknown): string => {
  if (!value) return '-';

  try {
    if (isTimestampLike(value)) {
      const timestampValue = value.toDate();
      if (timestampValue instanceof Date) {
        return timestampValue.toLocaleString();
      }
      const coercedDate = new Date(timestampValue);
      return Number.isNaN(coercedDate.getTime())
        ? '-'
        : coercedDate.toLocaleString();
    }

    if (value instanceof Date) {
      return value.toLocaleString();
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
    }
  } catch {
    return '-';
  }

  return '-';
};

export const getStatusLabel = (
  status: AuthorizationStatus | undefined,
): string => {
  if (!status) return '-';
  return statusLabels[status] || status;
};
