import {
  CREDIT_NOTE_STATUS,
  CREDIT_NOTE_STATUS_COLOR,
} from '@/constants/creditNoteStatus';
import {
  DEBIT_NOTE_STATUS,
  DEBIT_NOTE_STATUS_COLOR,
  DEBIT_NOTE_STATUS_LABEL,
} from '@/constants/debitNoteStatus';

import type { DebitNoteRecord } from '@/modules/invoice/types/debitNote';
import type { CreditNoteRecord } from '@/types/creditNote';

export type AdjustmentNoteStatusDisplay = {
  label: string;
  color: string;
};

export const CREDIT_NOTE_USAGE_FILTER_STATUS = {
  UNUSED: 'unused',
  PARTIALLY_USED: 'partially_used',
  FULLY_USED: 'fully_used',
  CANCELLED: 'cancelled',
} as const;

export type CreditNoteUsageFilterStatus =
  (typeof CREDIT_NOTE_USAGE_FILTER_STATUS)[keyof typeof CREDIT_NOTE_USAGE_FILTER_STATUS];

export const CREDIT_NOTE_USAGE_FILTER_OPTIONS: Array<{
  value: CreditNoteUsageFilterStatus;
  label: string;
}> = [
  { value: CREDIT_NOTE_USAGE_FILTER_STATUS.UNUSED, label: 'Sin Aplicar' },
  {
    value: CREDIT_NOTE_USAGE_FILTER_STATUS.PARTIALLY_USED,
    label: 'Parcialmente Usada',
  },
  {
    value: CREDIT_NOTE_USAGE_FILTER_STATUS.FULLY_USED,
    label: 'Totalmente Usada',
  },
  { value: CREDIT_NOTE_USAGE_FILTER_STATUS.CANCELLED, label: 'Anulada' },
];

export const DEBIT_NOTE_OPERATIONAL_FILTER_OPTIONS = [
  { value: DEBIT_NOTE_STATUS.ISSUED, label: 'Emitida' },
  { value: DEBIT_NOTE_STATUS.PAID, label: 'Pagada' },
  { value: DEBIT_NOTE_STATUS.PARTIALLY_PAID, label: 'Pago Parcial' },
  { value: DEBIT_NOTE_STATUS.CANCELLED, label: 'Anulada' },
  { value: DEBIT_NOTE_STATUS.VOIDED, label: 'Revertida' },
] as const;

export type DebitNoteOperationalFilterStatus =
  (typeof DEBIT_NOTE_OPERATIONAL_FILTER_OPTIONS)[number]['value'];

const normalizeStatus = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
};

const DEBIT_NOTE_FISCAL_ONLY_STATUSES = new Set<string>([
  DEBIT_NOTE_STATUS.ELECTRONIC_PENDING,
  DEBIT_NOTE_STATUS.ELECTRONIC_FAILED,
]);

export const resolveCreditNoteUsageFilterStatus = (
  record?: Pick<
    CreditNoteRecord,
    'availableAmount' | 'status' | 'totalAmount'
  > | null,
): CreditNoteUsageFilterStatus => {
  const status = normalizeStatus(record?.status);
  const totalAmount =
    typeof record?.totalAmount === 'number' ? record.totalAmount : 0;
  const availableAmount =
    typeof record?.availableAmount === 'number'
      ? record.availableAmount
      : totalAmount;

  if (status === CREDIT_NOTE_STATUS.CANCELLED) {
    return CREDIT_NOTE_USAGE_FILTER_STATUS.CANCELLED;
  }

  if (status === CREDIT_NOTE_STATUS.FULLY_USED) {
    return CREDIT_NOTE_USAGE_FILTER_STATUS.FULLY_USED;
  }

  if (
    status === CREDIT_NOTE_STATUS.APPLIED ||
    (totalAmount > 0 && availableAmount < totalAmount)
  ) {
    return CREDIT_NOTE_USAGE_FILTER_STATUS.PARTIALLY_USED;
  }

  return CREDIT_NOTE_USAGE_FILTER_STATUS.UNUSED;
};

export const resolveCreditNoteUsageStatusDisplay = (
  record?: Pick<
    CreditNoteRecord,
    'availableAmount' | 'status' | 'totalAmount'
  > | null,
): AdjustmentNoteStatusDisplay => {
  const usageStatus = resolveCreditNoteUsageFilterStatus(record);

  const displayByStatus: Record<
    CreditNoteUsageFilterStatus,
    AdjustmentNoteStatusDisplay
  > = {
    [CREDIT_NOTE_USAGE_FILTER_STATUS.UNUSED]: {
      label: 'Sin Aplicar',
      color: 'default',
    },
    [CREDIT_NOTE_USAGE_FILTER_STATUS.PARTIALLY_USED]: {
      label: 'Parcialmente Usada',
      color: CREDIT_NOTE_STATUS_COLOR[CREDIT_NOTE_STATUS.APPLIED],
    },
    [CREDIT_NOTE_USAGE_FILTER_STATUS.FULLY_USED]: {
      label: 'Totalmente Usada',
      color: CREDIT_NOTE_STATUS_COLOR[CREDIT_NOTE_STATUS.FULLY_USED],
    },
    [CREDIT_NOTE_USAGE_FILTER_STATUS.CANCELLED]: {
      label: 'Anulada',
      color: CREDIT_NOTE_STATUS_COLOR[CREDIT_NOTE_STATUS.CANCELLED],
    },
  };

  return displayByStatus[usageStatus];
};

export const resolveDebitNoteOperationalFilterStatus = (
  record?: Pick<DebitNoteRecord, 'status'> | null,
): string => {
  const status = normalizeStatus(record?.status);

  return (
    !status || DEBIT_NOTE_FISCAL_ONLY_STATUSES.has(status)
      ? DEBIT_NOTE_STATUS.ISSUED
      : status
  );
};

export const resolveDebitNoteOperationalStatusDisplay = (
  record?: Pick<DebitNoteRecord, 'status'> | null,
): AdjustmentNoteStatusDisplay => {
  const operationalStatus = resolveDebitNoteOperationalFilterStatus(record);

  return {
    label:
      DEBIT_NOTE_STATUS_LABEL[
        operationalStatus as keyof typeof DEBIT_NOTE_STATUS_LABEL
      ] || operationalStatus,
    color:
      DEBIT_NOTE_STATUS_COLOR[
        operationalStatus as keyof typeof DEBIT_NOTE_STATUS_COLOR
      ] || 'default',
  };
};
