import type { Order } from './types';

export type OrderOperationalStatus = 'pending' | 'completed' | 'canceled';

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const PENDING_ORDER_STATUSES = new Set(['pending', 'requested', 'delayed']);
const COMPLETED_ORDER_STATUSES = new Set([
  'completed',
  'delivered',
  'converted',
]);
const CANCELED_ORDER_STATUSES = new Set(['canceled', 'cancelled']);

const resolveRawLegacyOrderState = (
  order: Record<string, unknown> | undefined,
): string | null => {
  const directState = toNonEmptyString(order?.state)?.toLowerCase();
  if (directState) return directState;
  const nestedData = order?.data;
  if (!nestedData || typeof nestedData !== 'object') return null;
  return toNonEmptyString((nestedData as Record<string, unknown>).state)?.toLowerCase() ?? null;
};

export const resolveOrderStatus = (
  order: Order | Record<string, unknown> | undefined,
): OrderOperationalStatus => {
  const normalizedStatus = toNonEmptyString(order?.status)?.toLowerCase();
  if (normalizedStatus && PENDING_ORDER_STATUSES.has(normalizedStatus)) {
    return 'pending';
  }
  if (normalizedStatus && COMPLETED_ORDER_STATUSES.has(normalizedStatus)) {
    return 'completed';
  }
  if (normalizedStatus && CANCELED_ORDER_STATUSES.has(normalizedStatus)) {
    return 'canceled';
  }

  const legacyState = resolveRawLegacyOrderState(order);
  if (legacyState === 'state_3') return 'completed';
  if (legacyState === 'state_4') return 'canceled';
  return 'pending';
};

export const resolveLegacyOrderState = (
  status: OrderOperationalStatus,
): string => {
  switch (status) {
    case 'completed':
      return 'state_3';
    case 'canceled':
      return 'state_4';
    case 'pending':
    default:
      return 'state_2';
  }
};

export const normalizeOrderRecord = <T extends Record<string, unknown>>(
  order: T | undefined,
  fallbackId?: string,
): T & {
  id?: string;
  status: OrderOperationalStatus;
  state: string;
} => {
  const source = order ?? ({} as T);
  const nestedData =
    source.data && typeof source.data === 'object'
      ? (source.data as Record<string, unknown>)
      : null;

  const merged = nestedData
    ? {
        ...source,
        ...nestedData,
      }
    : { ...source };

  delete (merged as Record<string, unknown>).data;

  const status = resolveOrderStatus(merged);
  const state =
    resolveRawLegacyOrderState(merged) ?? resolveLegacyOrderState(status);

  return {
    ...merged,
    id:
      toNonEmptyString((merged as { id?: unknown }).id) ??
      toNonEmptyString(fallbackId) ??
      undefined,
    status,
    state,
  } as T & { id?: string; status: OrderOperationalStatus; state: string };
};

export const buildOrderStatusPatch = (
  order: Record<string, unknown> | undefined,
  status: OrderOperationalStatus,
): Record<string, unknown> => {
  const patch: Record<string, unknown> = {
    status,
    state: resolveLegacyOrderState(status),
  };

  if (order?.data && typeof order.data === 'object') {
    patch['data.state'] = resolveLegacyOrderState(status);
  }

  return patch;
};
