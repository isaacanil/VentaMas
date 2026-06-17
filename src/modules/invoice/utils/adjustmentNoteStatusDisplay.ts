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

const normalizeStatus = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
};

export const resolveCreditNoteUsageStatusDisplay = (
  record?: Pick<
    CreditNoteRecord,
    'availableAmount' | 'status' | 'totalAmount'
  > | null,
): AdjustmentNoteStatusDisplay => {
  const status = normalizeStatus(record?.status);
  const totalAmount =
    typeof record?.totalAmount === 'number' ? record.totalAmount : 0;
  const availableAmount =
    typeof record?.availableAmount === 'number'
      ? record.availableAmount
      : totalAmount;

  if (status === CREDIT_NOTE_STATUS.CANCELLED) {
    return {
      label: 'Anulada',
      color: CREDIT_NOTE_STATUS_COLOR[CREDIT_NOTE_STATUS.CANCELLED],
    };
  }

  if (status === CREDIT_NOTE_STATUS.FULLY_USED) {
    return {
      label: 'Totalmente Usada',
      color: CREDIT_NOTE_STATUS_COLOR[CREDIT_NOTE_STATUS.FULLY_USED],
    };
  }

  if (
    status === CREDIT_NOTE_STATUS.APPLIED ||
    (totalAmount > 0 && availableAmount < totalAmount)
  ) {
    return {
      label: 'Parcialmente Usada',
      color: CREDIT_NOTE_STATUS_COLOR[CREDIT_NOTE_STATUS.APPLIED],
    };
  }

  return {
    label: 'Sin Aplicar',
    color: 'default',
  };
};

export const resolveDebitNoteOperationalStatusDisplay = (
  record?: Pick<DebitNoteRecord, 'status'> | null,
): AdjustmentNoteStatusDisplay => {
  const status = normalizeStatus(record?.status);
  const operationalStatus = status || DEBIT_NOTE_STATUS.ISSUED;

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
