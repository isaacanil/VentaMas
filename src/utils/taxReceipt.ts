import type {
  TaxReceiptData,
  TaxReceiptDocument,
  TaxReceiptItem,
  TaxReceiptDocumentFormat,
  TaxReceiptSequenceInput,
} from '@/types/taxReceipt';
import { TAX_RECEIPT_NUMERIC_FIELDS } from '@/types/taxReceipt';

const isTaxReceiptDocument = (
  item: TaxReceiptItem,
): item is TaxReceiptDocument =>
  typeof (item as TaxReceiptDocument).data === 'object' &&
  (item as TaxReceiptDocument).data !== null;

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const inferDocumentFormat = ({
  type,
  fiscalType,
}: {
  type?: string;
  fiscalType?: string;
}): TaxReceiptDocumentFormat | undefined => {
  const normalizedType = normalizeString(type)?.toUpperCase();
  const normalizedFiscalType = normalizeString(fiscalType)?.toUpperCase();

  if (normalizedType === 'E' || normalizedFiscalType?.startsWith('E')) {
    return 'electronic';
  }

  if (normalizedType === 'B' || normalizedFiscalType?.startsWith('B')) {
    return 'traditional';
  }

  return undefined;
};

const normalizeDocumentFormat = (
  value: unknown,
  fallback?: TaxReceiptDocumentFormat,
): TaxReceiptDocumentFormat =>
  value === 'electronic' || value === 'traditional'
    ? value
    : fallback ?? 'traditional';

export const getTaxReceiptData = (item: TaxReceiptItem): TaxReceiptData => {
  if (isTaxReceiptDocument(item)) return hydrateTaxReceiptData(item.data);
  return hydrateTaxReceiptData(item);
};

export const normalizeTaxReceiptData = (
  raw: Partial<TaxReceiptData> | null | undefined,
): Partial<TaxReceiptData> => {
  if (!raw || typeof raw !== 'object') return {};

  const sanitized: Partial<TaxReceiptData> = { ...raw };
  const type = normalizeString(sanitized.type);
  const legacySerie =
    normalizeString(sanitized.serie) ??
    normalizeString(sanitized.series) ??
    normalizeString(sanitized.fiscalSeries);
  const fiscalType =
    normalizeString(sanitized.fiscalType) ??
    (type && legacySerie ? `${type}${legacySerie}` : type);
  const inferredDocumentFormat = inferDocumentFormat({
    type,
    fiscalType,
  });
  const documentFormat = normalizeDocumentFormat(
    sanitized.documentFormat,
    inferredDocumentFormat,
  );
  const authorityStatus =
    normalizeString(sanitized.authorityStatus) ??
    (sanitized.authorityStatus === null
      ? null
      : documentFormat === 'traditional'
        ? 'not_applicable'
        : null);
  const trackId =
    normalizeString(sanitized.trackId) ??
    (sanitized.trackId === null ? null : null);

  if (type) {
    sanitized.type = type;
  }

  if (legacySerie) {
    sanitized.serie = legacySerie;
    sanitized.fiscalSeries = legacySerie;
  }

  sanitized.documentFormat = documentFormat;

  if (fiscalType) {
    sanitized.fiscalType = fiscalType;
  }

  sanitized.authorityStatus = authorityStatus;
  sanitized.trackId = trackId;

  TAX_RECEIPT_NUMERIC_FIELDS.forEach((field) => {
    const value = sanitized[field];
    if (value === undefined || value === null || value === '') return;
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      sanitized[field] = numericValue;
    }
  });

  Object.keys(sanitized).forEach((key) => {
    const typedKey = key as keyof TaxReceiptData;
    if (sanitized[typedKey] === undefined) {
      delete sanitized[typedKey];
    }
  });

  return sanitized;
};

export const hydrateTaxReceiptData = (
  raw: Partial<TaxReceiptData> | null | undefined,
): TaxReceiptData => {
  const normalized = normalizeTaxReceiptData(raw);

  return {
    ...(normalized as TaxReceiptData),
    series: normalized.serie ?? normalized.series,
  };
};

export const buildTaxReceiptDocument = (
  data: TaxReceiptData,
): TaxReceiptDocument => ({
  data: hydrateTaxReceiptData({
    ...data,
    id: data.id ?? data.serie,
  }),
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
      documentFormat: 'traditional',
      fiscalSeries: newSerie,
      fiscalType: `B${newSerie}`,
      authorityStatus: 'not_applicable',
      trackId: null,
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
        data: hydrateTaxReceiptData({
          ...receipt.data,
          disabled: receipt.data.disabled ?? false,
        }),
      });
      existingNames.add(name);
      existingSeries.add(serie);
    }
  });

  return { unique, duplicateNames, duplicateSeries };
};
