import { DateTime } from 'luxon';

import type { DebitNoteRecord } from '@/modules/invoice/types/debitNote';

export const toDebitNoteDate = (value: DebitNoteRecord['createdAt']): Date => {
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

export const buildDefaultDebitNoteFilters = () => ({
  startDate: DateTime.local().startOf('day'),
  endDate: DateTime.local().endOf('day'),
  clientId: null,
  status: null,
});

export const getDebitNoteWarningContent = (taxReceiptEnabled: boolean) => {
  if (!taxReceiptEnabled) {
    return {
      title: 'Comprobantes Fiscales Deshabilitados',
      subDescription:
        'Los comprobantes fiscales estan deshabilitados en la configuracion.',
      description:
        'Para gestionar notas de debito necesitas habilitar los comprobantes fiscales y configurar el comprobante correspondiente (serie 03).',
    };
  }

  return {
    title: 'Configuracion Requerida',
    subDescription:
      'Por favor, completa la configuracion necesaria para continuar.',
    description:
      'Para gestionar notas de debito necesitas configurar el comprobante fiscal correspondiente (serie 03).',
  };
};
