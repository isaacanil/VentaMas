import { DateTime } from 'luxon';

import { CREDIT_NOTE_STATUS } from '@/constants/creditNoteStatus';

import type { CreditNoteRecord } from '@/types/creditNote';

export const ALLOWED_EDIT_MS = 2 * 24 * 60 * 60 * 1000;

export const toCreditNoteDate = (value: CreditNoteRecord['createdAt']): Date => {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  if (typeof value === 'object') {
    if ('seconds' in value && typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000);
    }
    if ('toDate' in value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    if ('toMillis' in value && typeof value.toMillis === 'function') {
      return new Date(value.toMillis());
    }
  }
  return new Date(0);
};

export const canEditCreditNoteRecord = (record: CreditNoteRecord) => {
  const created = toCreditNoteDate(record.createdAt);
  const isTimeAllowed = Date.now() - created.getTime() <= ALLOWED_EDIT_MS;
  const hasApplications =
    record.status === CREDIT_NOTE_STATUS.APPLIED ||
    record.status === CREDIT_NOTE_STATUS.FULLY_USED ||
    (record.availableAmount !== undefined &&
      record.availableAmount < record.totalAmount);

  return isTimeAllowed && !hasApplications;
};

export const buildDefaultCreditNoteFilters = () => ({
  startDate: DateTime.local().startOf('day'),
  endDate: DateTime.local().endOf('day'),
  clientId: null,
  status: null,
});

export const getCreditNoteWarningContent = (taxReceiptEnabled: boolean) => {
  if (!taxReceiptEnabled) {
    return {
      title: 'Comprobantes Fiscales Deshabilitados',
      subDescription:
        'Los comprobantes fiscales estan deshabilitados en la configuracion.',
      description:
        'Para gestionar notas de credito necesitas habilitar los comprobantes fiscales y configurar el comprobante correspondiente (serie 04).',
    };
  }

  return {
    title: 'Configuracion Requerida',
    subDescription:
      'Por favor, completa la configuracion necesaria para continuar.',
    description:
      'Para gestionar notas de credito necesitas configurar el comprobante fiscal correspondiente (serie 04).',
  };
};
