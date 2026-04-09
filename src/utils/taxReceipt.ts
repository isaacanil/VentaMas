import type {
  TaxReceiptData,
  TaxReceiptDocument,
  TaxReceiptItem,
  TaxReceiptSequenceInput,
} from '@/types/taxReceipt';
import { TAX_RECEIPT_NUMERIC_FIELDS } from '@/types/taxReceipt';

const isTaxReceiptDocument = (
  item: TaxReceiptItem,
): item is TaxReceiptDocument =>
  typeof (item as TaxReceiptDocument).data === 'object' &&
  (item as TaxReceiptDocument).data !== null;

export const getTaxReceiptData = (item: TaxReceiptItem): TaxReceiptData => {
  if (isTaxReceiptDocument(item)) return item.data;
  return item;
};

export const normalizeTaxReceiptData = (
  raw: Partial<TaxReceiptData> | null | undefined,
): Partial<TaxReceiptData> => {
  if (!raw || typeof raw !== 'object') return {};

  const sanitized: Partial<TaxReceiptData> = { ...raw };

  TAX_RECEIPT_NUMERIC_FIELDS.forEach((field) => {
    const value = sanitized[field];
    if (value === undefined || value === null || value === '') return;
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      sanitized[field] = numericValue;
    }
  });

  return sanitized;
};

export const buildTaxReceiptDocument = (
  data: TaxReceiptData,
): TaxReceiptDocument => ({
  data: {
    ...data,
    id: data.id ?? data.serie,
  },
});

export const formatNcfCode = ({
  type,
  serie,
  sequence,
  sequenceLength,
}: TaxReceiptSequenceInput): string => {
  if (!type || !serie) return '';
  const numericSequence = Number(sequence ?? 0);
  const safeLength = Number(sequenceLength);
  const padded =
    Number.isFinite(safeLength) && safeLength > 0
      ? String(numericSequence).padStart(safeLength, '0')
      : String(numericSequence);
  return `${type}${serie}${padded}`;
};

export const generateNewTaxReceipt = (
  localReceipts: TaxReceiptItem[],
): TaxReceiptDocument => {
  const existingSeries = new Set(
    localReceipts.map((receipt) => getTaxReceiptData(receipt).serie),
  );
  let counter = 3;
  let newSerie = counter < 10 ? `0${counter}` : `${counter}`;
  while (existingSeries.has(newSerie)) {
    counter += 1;
    newSerie = counter < 10 ? `0${counter}` : `${counter}`;
  }

  return {
    data: {
      name: 'NUEVO COMPROBANTE',
      type: 'B',
      serie: newSerie,
      sequence: '0000000000',
      increase: 1,
      quantity: 2000,
      disabled: false,
    },
  };
};

export const filterPredefinedReceipts = (
  newReceipts: TaxReceiptDocument[],
  localReceipts: TaxReceiptItem[],
) => {
  const existingSeries = new Set(
    localReceipts.map((receipt) => getTaxReceiptData(receipt).serie),
  );
  const existingNames = new Set(
    localReceipts.map((receipt) => getTaxReceiptData(receipt).name),
  );

  const unique: TaxReceiptDocument[] = [];
  const duplicateNames: string[] = [];
  const duplicateSeries: string[] = [];

  newReceipts.forEach((receipt) => {
    const { name, serie } = receipt.data;
    if (existingNames.has(name)) {
      duplicateNames.push(name);
    } else if (existingSeries.has(serie)) {
      duplicateSeries.push(serie);
    } else {
      unique.push({
        ...receipt,
        data: {
          ...receipt.data,
          disabled: receipt.data.disabled ?? false,
        },
      });
      existingNames.add(name);
      existingSeries.add(serie);
    }
  });

  return { unique, duplicateNames, duplicateSeries };
};
