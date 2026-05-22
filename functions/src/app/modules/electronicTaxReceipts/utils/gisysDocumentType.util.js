const stripAccents = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const normalizeToken = (value) =>
  stripAccents(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ');

const GISYS_DOCUMENT_BY_FISCAL_TYPE = Object.freeze({
  B01: 'E31',
  B02: 'E32',
  B04: 'E34',
  B15: 'E45',
  E31: 'E31',
  E32: 'E32',
  E34: 'E34',
  E45: 'E45',
});

const resolveFromToken = (value) => {
  const token = normalizeToken(value);
  if (!token) return null;

  const compact = token.replace(/\s+/g, '');
  if (GISYS_DOCUMENT_BY_FISCAL_TYPE[compact]) {
    return GISYS_DOCUMENT_BY_FISCAL_TYPE[compact];
  }

  if (compact.startsWith('B01')) return 'E31';
  if (compact.startsWith('B02')) return 'E32';
  if (compact.startsWith('B04')) return 'E34';
  if (compact.startsWith('B15')) return 'E45';
  if (compact.startsWith('E31')) return 'E31';
  if (compact.startsWith('E32')) return 'E32';
  if (compact.startsWith('E34')) return 'E34';
  if (compact.startsWith('E45')) return 'E45';

  if (token.includes('CONSUMIDOR')) return 'E32';
  if (token.includes('FISCAL CONSUMER')) return 'E32';
  if (token.includes('CONSUMER')) return 'E32';
  if (token.includes('CREDITO FISCAL')) return 'E31';
  if (token.includes('FISCAL CREDIT')) return 'E31';
  if (token.includes('TAX CREDIT')) return 'E31';
  if (token.includes('GUBERNAMENTAL')) return 'E45';
  if (token.includes('GOVERNMENT')) return 'E45';
  if (token.includes('NOTA') && token.includes('CREDITO')) return 'E34';
  if (token.includes('CREDIT NOTE')) return 'E34';

  return null;
};

export const resolveGisysDocumentType = ({
  ncfType,
  ncf,
  cart,
} = {}) => {
  const candidates = [
    ncf?.documentType,
    ncf?.electronicDocumentType,
    ncf?.fiscalType,
    ncf?.type,
    ncf?.name,
    ncfType,
    cart?.taxReceipt?.documentType,
    cart?.taxReceipt?.fiscalType,
    cart?.taxReceipt?.name,
    cart?.taxReceiptName,
    cart?.ncfType,
    cart?.NCF,
  ];

  for (const candidate of candidates) {
    const resolved = resolveFromToken(candidate);
    if (resolved) return resolved;
  }

  return null;
};

export const isSupportedGisysDocumentType = (documentType) =>
  ['E31', 'E32', 'E34', 'E45'].includes(String(documentType || '').trim().toUpperCase());
