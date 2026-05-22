const ELECTRONIC_DOCUMENT_TYPES = new Set(['E31', 'E32', 'E34', 'E45']);

const ELECTRONIC_TYPE_BY_LEGACY_SERIE: Record<string, string> = {
  '01': 'E31',
  '02': 'E32',
  '04': 'E34',
  '15': 'E45',
};

const normalizeText = (value: unknown): string =>
  typeof value === 'string'
    ? value
        .trim()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toUpperCase()
    : '';

const resolveLegacySerie = (value: string): string | null => {
  const compact = value.replace(/[^A-Z0-9]/g, '');
  const prefixedSerie = compact.match(/^B(01|02|04|15)/)?.[1];
  if (prefixedSerie) return prefixedSerie;

  const standaloneSerie = compact.match(/^(01|02|04|15)$/)?.[1];
  return standaloneSerie ?? null;
};

export const resolveElectronicTaxReceiptDocumentType = (
  fiscalReceiptName: unknown,
): string | null => {
  const normalized = normalizeText(fiscalReceiptName);
  if (!normalized) return null;

  if (ELECTRONIC_DOCUMENT_TYPES.has(normalized)) return normalized;

  const legacySerie = resolveLegacySerie(normalized);
  if (legacySerie) return ELECTRONIC_TYPE_BY_LEGACY_SERIE[legacySerie] ?? null;

  if (normalized.includes('CONSUMIDOR')) return 'E32';
  if (normalized.includes('CREDITO') && normalized.includes('FISCAL')) {
    return 'E31';
  }
  if (normalized.includes('NOTA') && normalized.includes('CREDITO')) {
    return 'E34';
  }
  if (normalized.includes('GUBERNAMENTAL')) return 'E45';

  return null;
};

export const formatElectronicTaxReceiptLabel = (
  fiscalReceiptName: string | null | undefined,
  options: { electronicModelEnabled?: boolean } = {},
): string => {
  const name = typeof fiscalReceiptName === 'string' ? fiscalReceiptName.trim() : '';
  if (!name || !options.electronicModelEnabled) return name;

  const documentType = resolveElectronicTaxReceiptDocumentType(name);
  return documentType ? `${name} e-CF (${documentType})` : `${name} e-CF`;
};

export const formatCompactElectronicTaxReceiptLabel = (
  fiscalReceiptName: string | null | undefined,
  options: { electronicModelEnabled?: boolean } = {},
): string => {
  const name = typeof fiscalReceiptName === 'string' ? fiscalReceiptName.trim() : '';
  if (!name || !options.electronicModelEnabled) return name;

  const documentType = resolveElectronicTaxReceiptDocumentType(name);
  return documentType ? `e-CF (${documentType})` : `${name} e-CF`;
};
