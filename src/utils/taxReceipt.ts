import type {
  TaxReceiptData,
  TaxReceiptDocument,
  TaxReceiptItem,
  TaxReceiptDocumentFormat,
  TaxReceiptSequenceInput,
} from '@/types/taxReceipt';
import { TAX_RECEIPT_NUMERIC_FIELDS } from '@/types/taxReceipt';
import { stripDiacritics } from '@/utils/text';

export interface ComprobanteOption {
  value: string;
  label: string;
  description: string;
}

export type TaxReceiptAvailability = {
  receipt: TaxReceiptItem | null;
  depleted: boolean;
  blockedReason?: string;
};

export type SelectableTaxReceiptOptions = {
  excludeCreditNotes?: boolean;
  preferredDocumentFormat?: TaxReceiptDocumentFormat;
  requireAvailable?: boolean;
};

export const comprobantesOptions: ComprobanteOption[] = [
  {
    value: '01',
    label: 'Factura de Crédito Fiscal',
    description:
      'Registra transacciones comerciales de bienes/servicios. Permite sustentar gastos y créditos de ISR o ITBIS.',
  },
  {
    value: '02',
    label: 'Factura de Consumo',
    description:
      'Acredita transferencias de bienes o servicios a consumidores finales. Sin efectos tributarios.',
  },
  {
    value: '03',
    label: 'Nota de Débito',
    description:
      'Documento emitido para recuperar costos como intereses, fletes, tras emitir el comprobante fiscal.',
  },
  {
    value: '04',
    label: 'Nota de Crédito',
    description:
      'Documento emitido para anular operaciones, efectuar devoluciones, conceder descuentos o corregir errores.',
  },
  {
    value: '11',
    label: 'Comprobante de Compra',
    description:
      'Emitido al adquirir bienes o servicios de personas no registradas como contribuyentes.',
  },
  {
    value: '12',
    label: 'Comprobante de Registro Único de Ingresos',
    description:
      'Resumen de transacciones diarias a consumidores finales, generalmente exentos de ITBIS.',
  },
  {
    value: '13',
    label: 'Comprobante para Gastos Menores',
    description:
      'Para sustentar pagos menores relacionados con actividades laborales, como transporte o consumibles.',
  },
  {
    value: '14',
    label: 'Comprobante para Regímenes Especiales',
    description:
      'Utilizado en ventas o servicios exentos a personas bajo regímenes tributarios especiales.',
  },
  {
    value: '15',
    label: 'Comprobante Gubernamental',
    description:
      'Utilizado para facturar bienes/servicios al Gobierno Central y entidades relacionadas.',
  },
  {
    value: '16',
    label: 'Comprobante para Exportaciones',
    description:
      'Usado para reportar ventas de bienes fuera del territorio nacional por exportadores y zonas francas.',
  },
  {
    value: '17',
    label: 'Comprobante para Pagos al Exterior',
    description:
      'Emitido para pagos de rentas gravadas a personas no residentes fiscales, incluye retención del ISR.',
  },
  {
    value: 'e-CF',
    label: 'Comprobante Fiscal Electrónico',
    description:
      'Documento digital que acredita transferencias de bienes o prestación de servicios cumpliendo normativa.',
  },
];

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
    : (fallback ?? 'traditional');

export const getTaxReceiptData = (item: TaxReceiptItem): TaxReceiptData => {
  if (isTaxReceiptDocument(item)) return hydrateTaxReceiptData(item.data);
  return hydrateTaxReceiptData(item);
};

const normalizeTaxReceiptNameKey = (value: unknown): string | null => {
  const name = normalizeString(value);
  return name ? stripDiacritics(name).toUpperCase() : null;
};

export const isCreditNoteTaxReceiptData = (
  data: TaxReceiptData | null | undefined,
): boolean => {
  if (!data) return false;

  const name = normalizeTaxReceiptNameKey(data.name) ?? '';
  const serie = normalizeString(data.serie ?? data.series ?? data.fiscalSeries)
    ?.padStart(2, '0')
    .toUpperCase();
  const fiscalType = normalizeString(data.fiscalType)?.toUpperCase();
  const containsNota = name.includes('NOTA');
  const containsCredito = name.includes('CREDITO');

  return (
    serie === '04' ||
    fiscalType === 'E34' ||
    (containsNota && containsCredito)
  );
};

const hasTaxReceiptAvailableQuantity = (data: TaxReceiptData): boolean => {
  const quantity = Number(data.quantity);
  const increase = Number(data.increase);
  const normalizedIncrease =
    Number.isFinite(increase) && increase > 0 ? increase : 1;
  const normalizedQuantity = Number.isFinite(quantity) ? quantity : 0;

  return normalizedQuantity >= normalizedIncrease;
};

const getSelectableTaxReceiptRank = (
  data: TaxReceiptData,
  preferredDocumentFormat?: TaxReceiptDocumentFormat,
): number => {
  if (!preferredDocumentFormat) return 0;
  return data.documentFormat === preferredDocumentFormat ? 0 : 1;
};

const shouldReplaceSelectableTaxReceipt = ({
  current,
  next,
  preferredDocumentFormat,
}: {
  current: TaxReceiptData;
  next: TaxReceiptData;
  preferredDocumentFormat?: TaxReceiptDocumentFormat;
}) =>
  getSelectableTaxReceiptRank(next, preferredDocumentFormat) <
  getSelectableTaxReceiptRank(current, preferredDocumentFormat);

export const getSelectableTaxReceiptData = (
  receipts: TaxReceiptItem[] | null | undefined,
  options: SelectableTaxReceiptOptions = {},
): TaxReceiptData[] => {
  if (!Array.isArray(receipts)) return [];

  const { excludeCreditNotes, preferredDocumentFormat, requireAvailable } =
    options;
  const selectedByName = new Map<string, TaxReceiptData>();

  receipts.forEach((receipt) => {
    const data = getTaxReceiptData(receipt);
    const nameKey = normalizeTaxReceiptNameKey(data.name);

    if (!nameKey || data.disabled) return;
    if (excludeCreditNotes && isCreditNoteTaxReceiptData(data)) return;
    if (requireAvailable && !hasTaxReceiptAvailableQuantity(data)) return;

    const current = selectedByName.get(nameKey);
    if (
      !current ||
      shouldReplaceSelectableTaxReceipt({
        current,
        next: data,
        preferredDocumentFormat,
      })
    ) {
      selectedByName.set(nameKey, data);
    }
  });

  return Array.from(selectedByName.values());
};

const resolveReceiptData = (
  item: TaxReceiptItem | null | undefined,
): TaxReceiptData | null => {
  if (!item || typeof item !== 'object') return null;
  if ('data' in item) return item.data ?? null;
  return item;
};

export const getTaxReceiptAvailability = (
  receipts: TaxReceiptItem[] | null | undefined,
  receiptName: string | null | undefined,
): TaxReceiptAvailability => {
  if (!Array.isArray(receipts) || !receiptName) {
    return {
      receipt: null,
      depleted: true,
    };
  }

  const requestedName = getTaxReceiptIdentity({ name: receiptName }).name;
  const matchingReceipts = receipts.filter((item) => {
    const data = resolveReceiptData(item);
    return (
      isActiveTaxReceiptData(data) &&
      getTaxReceiptIdentity(data).name === requestedName
    );
  });
  const matchingIds = new Set(
    matchingReceipts
      .map((item) => resolveReceiptData(item)?.id)
      .filter((id): id is string => Boolean(id)),
  );
  const matchingFiscalKeys = new Set(
    matchingReceipts
      .map((item) => getTaxReceiptIdentity(resolveReceiptData(item)).fiscalKey)
      .filter((fiscalKey): fiscalKey is string => Boolean(fiscalKey)),
  );
  const conflictingReceipts = receipts.filter((item) => {
    const data = resolveReceiptData(item);
    const identity = getTaxReceiptIdentity(data);
    return (
      isActiveTaxReceiptData(data) &&
      (matchingIds.has(data?.id ?? '') ||
        (!!identity.fiscalKey && matchingFiscalKeys.has(identity.fiscalKey)))
    );
  });

  if (conflictingReceipts.length > 1) {
    return {
      receipt: null,
      depleted: true,
      blockedReason:
        'Hay comprobantes fiscales duplicados activos. Deshabilita o repara los duplicados antes de facturar.',
    };
  }

  const receipt = matchingReceipts[0] || null;
  if (!receipt) {
    return {
      receipt: null,
      depleted: true,
    };
  }

  const receiptData = resolveReceiptData(receipt);
  const quantity = Number(receiptData?.quantity);
  const increase = Number(receiptData?.increase);
  const normalizedIncrease =
    Number.isFinite(increase) && increase > 0 ? increase : 1;
  const normalizedQuantity = Number.isFinite(quantity) ? quantity : 0;

  return {
    receipt,
    depleted: normalizedQuantity < normalizedIncrease,
  };
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

export const normalizeTaxReceiptLabel = (value: unknown): string => {
  if (typeof value !== 'string' && typeof value !== 'number') return '';

  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
};

export const normalizeTaxReceiptCode = (value: unknown): string => {
  const normalized = normalizeTaxReceiptLabel(value).replace(/[^A-Z0-9]/g, '');
  if (/^\d$/.test(normalized)) return normalized.padStart(2, '0');
  return normalized;
};

export const getTaxReceiptIdentity = (
  data: Partial<TaxReceiptData> | null | undefined,
) => {
  const type = normalizeTaxReceiptCode(data?.type);
  const serie = normalizeTaxReceiptCode(data?.serie ?? data?.series);
  const name = normalizeTaxReceiptLabel(data?.name);

  return {
    name,
    type,
    serie,
    fiscalKey: `${type}${serie}`,
  };
};

export const getTaxReceiptDocumentId = (
  data: Partial<TaxReceiptData> | null | undefined,
): string => {
  const { serie } = getTaxReceiptIdentity(data);
  if (!serie) {
    throw new Error('La serie del comprobante fiscal es requerida.');
  }
  return serie;
};

export const hasMatchingTaxReceiptIdentity = (
  left: Partial<TaxReceiptData> | null | undefined,
  right: Partial<TaxReceiptData> | null | undefined,
): boolean => {
  const leftIdentity = getTaxReceiptIdentity(left);
  const rightIdentity = getTaxReceiptIdentity(right);

  return (
    (!!leftIdentity.fiscalKey &&
      leftIdentity.fiscalKey === rightIdentity.fiscalKey) ||
    (!!leftIdentity.name && leftIdentity.name === rightIdentity.name)
  );
};

export const isActiveTaxReceiptData = (
  data: Partial<TaxReceiptData> | null | undefined,
) => data?.disabled !== true;

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
  const existingNames = new Set(
    localReceipts.map((receipt) => {
      const identity = getTaxReceiptIdentity(getTaxReceiptData(receipt));
      return identity.name;
    }),
  );
  const existingFiscalKeys = new Set(
    localReceipts.map((receipt) => {
      const identity = getTaxReceiptIdentity(getTaxReceiptData(receipt));
      return identity.fiscalKey;
    }),
  );

  const unique: TaxReceiptDocument[] = [];
  const duplicateNames: string[] = [];
  const duplicateSeries: string[] = [];

  newReceipts.forEach((receipt) => {
    const { name } = receipt.data;
    const identity = getTaxReceiptIdentity(receipt.data);
    if (existingNames.has(identity.name)) {
      duplicateNames.push(name);
    } else if (existingFiscalKeys.has(identity.fiscalKey)) {
      duplicateSeries.push(identity.fiscalKey);
    } else {
      unique.push({
        ...receipt,
        data: hydrateTaxReceiptData({
          ...receipt.data,
          disabled: receipt.data.disabled ?? false,
        }),
      });
      existingNames.add(identity.name);
      existingFiscalKeys.add(identity.fiscalKey);
    }
  });

  return { unique, duplicateNames, duplicateSeries };
};
