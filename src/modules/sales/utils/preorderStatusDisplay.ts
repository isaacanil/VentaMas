import type { InvoiceData } from '@/types/invoice';

export type PreorderStatus = 'pending' | 'completed' | 'cancelled';

export type PreorderStatusTone = {
  text: string;
  background: string;
};

type PreorderStatusDisplay = {
  label: string;
  tagColor: string;
  tone: PreorderStatusTone;
};

const UNKNOWN_PREORDER_STATUS_DISPLAY: PreorderStatusDisplay = {
  label: 'Desconocida',
  tagColor: 'default',
  tone: {
    text: '#334155',
    background: '#e2e8f0',
  },
};

const PREORDER_STATUS_DISPLAY: Record<PreorderStatus, PreorderStatusDisplay> = {
  pending: {
    label: 'Pendiente',
    tagColor: 'orange',
    tone: {
      text: '#b45309',
      background: '#fef3c7',
    },
  },
  completed: {
    label: 'Completada',
    tagColor: 'green',
    tone: {
      text: '#166534',
      background: '#dcfce7',
    },
  },
  cancelled: {
    label: 'Cancelada',
    tagColor: 'red',
    tone: {
      text: '#b91c1c',
      background: '#fee2e2',
    },
  },
};

const normalizePreorderStatus = (status: unknown): string | null => {
  if (typeof status !== 'string') return null;
  const normalized = status.trim().toLowerCase();
  return normalized || null;
};

const getPreorderStatusDisplay = (
  status: string | null | undefined,
): PreorderStatusDisplay =>
  PREORDER_STATUS_DISPLAY[status as PreorderStatus] ||
  UNKNOWN_PREORDER_STATUS_DISPLAY;

export const resolvePreorderStatus = (
  preorder?: Pick<InvoiceData, 'preorderDetails' | 'status'> | null,
): string | null =>
  normalizePreorderStatus(preorder?.status) ||
  normalizePreorderStatus(preorder?.preorderDetails?.status);

export const getPreorderStatusLabel = (
  status: string | null | undefined,
): string => getPreorderStatusDisplay(normalizePreorderStatus(status)).label;

export const getPreorderStatusTagColor = (
  status: string | null | undefined,
): string => getPreorderStatusDisplay(normalizePreorderStatus(status)).tagColor;

export const getPreorderStatusTone = (
  status: string | null | undefined,
): PreorderStatusTone =>
  getPreorderStatusDisplay(normalizePreorderStatus(status)).tone;
