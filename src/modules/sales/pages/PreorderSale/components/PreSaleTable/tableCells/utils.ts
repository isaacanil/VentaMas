import type { Client } from '@/features/cart/types';
import type { InvoiceData } from '@/types/invoice';

import type { ClientLike, TimestampRecord } from './types';

export const resolveClientId = (client?: ClientLike | null): string => {
  const rawId = client?.id;
  if (typeof rawId === 'string' && rawId.trim()) return rawId;
  if (typeof rawId === 'number') return String(rawId);
  return '';
};

export const normalizeClientForCart = (
  client?: ClientLike | null,
): Client | null => {
  if (!client) return null;
  const id = resolveClientId(client);
  if (!id) return null;

  const normalized: Client = {
    id,
    name: typeof client.name === 'string' ? client.name : '',
    tel: typeof client.tel === 'string' ? client.tel : '',
    address: typeof client.address === 'string' ? client.address : '',
    personalID: typeof client.personalID === 'string' ? client.personalID : '',
  };

  if (client.delivery) {
    normalized.delivery = client.delivery;
  }

  return normalized;
};

export const resolvePreorderTaxReceiptType = (
  preorder: InvoiceData | null | undefined,
) =>
  preorder?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.taxReceipt?.type ??
  null;

const statusColors: Record<string, string> = {
  pending: 'orange',
  completed: 'green',
  cancelled: 'red',
};

export const getColorByStatus = (status: string | null | undefined) =>
  statusColors[status ?? ''] || 'gray';

export const getStatusLabel = (status: string | null | undefined) => {
  if (status === 'pending') return 'Pendiente';
  if (status === 'completed') return 'Completada';
  return 'Cancelada';
};

const isTimestampRecord = (value: unknown): value is TimestampRecord =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as TimestampRecord).seconds === 'number' &&
  typeof (value as TimestampRecord).nanoseconds === 'number';

export const convertTimestampsToMillis = (obj: unknown): unknown => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => convertTimestampsToMillis(item));
  }

  const converted: Record<string, unknown> = {};
  Object.keys(obj).forEach((key) => {
    const value = (obj as Record<string, unknown>)[key];
    if (isTimestampRecord(value)) {
      converted[key] =
        value.seconds * 1000 + Math.floor(value.nanoseconds / 1000000);
      return;
    }
    if (value && typeof value === 'object') {
      converted[key] = convertTimestampsToMillis(value);
      return;
    }
    converted[key] = value;
  });

  return converted;
};
