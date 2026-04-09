import { DateTime } from 'luxon';

import { toMillis } from '@/utils/date/toMillis';
import type {
  PurchaseReceiptEvent,
  PurchaseWorkflowStatus,
} from '@/utils/purchase/types';

// ─── Date helpers ──────────────────────────────────────────────────────────────

export const formatHistoryDate = (value: unknown): string => {
  const millis = toMillis(value as never);
  if (typeof millis !== 'number' || !Number.isFinite(millis)) return 'Fecha desconocida';
  return DateTime.fromMillis(millis).toFormat("dd/MM/yyyy 'a las' HH:mm");
};

export const formatHistoryDateShort = (value: unknown): string => {
  const millis = toMillis(value as never);
  if (typeof millis !== 'number' || !Number.isFinite(millis)) return '—';
  return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy');
};

export const formatHistoryTime = (value: unknown): string => {
  const millis = toMillis(value as never);
  if (typeof millis !== 'number' || !Number.isFinite(millis)) return '—';
  return DateTime.fromMillis(millis).toFormat('HH:mm');
};

export const sortReceiptEventsByDate = (
  events: PurchaseReceiptEvent[],
): PurchaseReceiptEvent[] =>
  [...events].sort((a, b) => {
    const aMillis = toMillis(a.receivedAt as never) ?? 0;
    const bMillis = toMillis(b.receivedAt as never) ?? 0;
    return (bMillis as number) - (aMillis as number);
  });

// ─── Actor helpers ─────────────────────────────────────────────────────────────

export const formatHistoryActor = (
  receivedBy: PurchaseReceiptEvent['receivedBy'],
): string => {
  if (!receivedBy) return 'Usuario desconocido';
  const name =
    typeof receivedBy.name === 'string' && receivedBy.name.trim()
      ? receivedBy.name.trim()
      : null;
  return name ?? (typeof receivedBy.uid === 'string' ? receivedBy.uid : 'Usuario desconocido');
};

// ─── Workflow helpers ──────────────────────────────────────────────────────────

export type WorkflowMeta = {
  label: string;
  color: string;
  antColor: string;
};

export const resolveWorkflowMeta = (
  status: PurchaseWorkflowStatus | null | undefined,
): WorkflowMeta => {
  switch (status) {
    case 'completed':
      return { label: 'Completada', color: '#52c41a', antColor: 'success' };
    case 'partial_receipt':
      return { label: 'Recepción parcial', color: '#1677ff', antColor: 'processing' };
    case 'canceled':
      return { label: 'Cancelada', color: '#8c8c8c', antColor: 'default' };
    case 'pending_receipt':
    default:
      return { label: 'Pendiente', color: '#faad14', antColor: 'warning' };
  }
};

// ─── Quantity helpers ─────────────────────────────────────────────────────────

export const safeQty = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const formatQty = (value: unknown): string => {
  const n = safeQty(value);
  return n.toLocaleString('es-DO', { maximumFractionDigits: 2 });
};
