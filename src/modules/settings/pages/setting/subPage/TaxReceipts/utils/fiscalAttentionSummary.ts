import type { TaxReceiptDocument } from '@/types/taxReceipt';

export type FiscalAttentionTone = 'neutral' | 'warning' | 'danger';

export interface FiscalAttentionSummary {
  primaryIssue: string | null;
  tone: FiscalAttentionTone;
}

export const parseReceiptQuantity = (
  value?: number | string,
): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getReceiptLabel = (receipt: TaxReceiptDocument): string => {
  const name = receipt.data?.name?.trim();
  if (name) return name;

  const type = receipt.data?.type?.trim();
  const serie = receipt.data?.serie?.trim();
  return [type, serie].filter(Boolean).join('') || 'Serie sin nombre';
};

export const hasCompleteFiscalRange = (
  receipt: TaxReceiptDocument,
): boolean => {
  const { quantity, sequence, serie, type } = receipt.data ?? {};
  return Boolean(
    type &&
      serie &&
      sequence !== undefined &&
      sequence !== null &&
      sequence !== '' &&
      quantity !== undefined &&
      quantity !== null &&
      quantity !== '',
  );
};

export const buildFiscalAttentionSummary = (
  receipts: TaxReceiptDocument[],
  taxReceiptEnabled: boolean,
): FiscalAttentionSummary => {
  const activeReceipts = receipts.filter((item) => !item.data?.disabled);
  const depletedReceipts = activeReceipts.filter(
    (item) => parseReceiptQuantity(item.data?.quantity) === 0,
  );
  const incompleteReceipts = activeReceipts.filter(
    (item) =>
      parseReceiptQuantity(item.data?.quantity) !== 0 &&
      !hasCompleteFiscalRange(item),
  );

  if (!taxReceiptEnabled) {
    return {
      primaryIssue: null,
      tone: 'neutral',
    };
  }

  if (!activeReceipts.length) {
    return {
      primaryIssue: 'No hay series activas para emitir comprobantes.',
      tone: 'warning',
    };
  }

  if (depletedReceipts.length > 0) {
    return {
      primaryIssue: `${getReceiptLabel(depletedReceipts[0])} no tiene disponibilidad.`,
      tone: 'danger',
    };
  }

  if (incompleteReceipts.length > 0) {
    return {
      primaryIssue: `${getReceiptLabel(incompleteReceipts[0])} necesita completar su rango fiscal.`,
      tone: 'warning',
    };
  }

  return {
    primaryIssue: null,
    tone: 'neutral',
  };
};
