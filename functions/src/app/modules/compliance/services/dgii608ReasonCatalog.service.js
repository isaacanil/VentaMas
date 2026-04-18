const normalizeString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeLookupKey = (value) =>
  (normalizeString(value) ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const DGII_608_REASON_CATALOG_VERSION = 'dgii-608-v1-2025';

export const DGII_608_REASON_CATALOG = Object.freeze([
  Object.freeze({
    code: '01',
    label: 'Deterioro de factura preimpresa',
    matchers: ['deterioro', 'preimpresa deteriorada'],
  }),
  Object.freeze({
    code: '02',
    label: 'Errores de impresión (factura preimpresa)',
    matchers: ['errores de impresion', 'error de impresion', 'preimpresa'],
  }),
  Object.freeze({
    code: '03',
    label: 'Impresión defectuosa',
    matchers: ['impresion defectuosa', 'defectuosa'],
  }),
  Object.freeze({
    code: '04',
    label: 'Corrección de la información',
    matchers: [
      'correccion de la informacion',
      'correccion',
      'duplicada',
      'duplicado',
      'error de digitacion',
      'error',
      'cliente equivocado',
    ],
  }),
  Object.freeze({
    code: '05',
    label: 'Cambio de productos',
    matchers: ['cambio de productos', 'cambio producto'],
  }),
  Object.freeze({
    code: '06',
    label: 'Devolución de productos',
    matchers: [
      'devolucion de productos',
      'devolucion',
      'cliente desistio',
      'cliente se arrepintio',
      'cancelada por cliente',
    ],
  }),
  Object.freeze({
    code: '07',
    label: 'Omisión de productos',
    matchers: ['omision de productos', 'omision producto'],
  }),
  Object.freeze({
    code: '08',
    label: 'Errores en secuencia de NCF',
    matchers: ['secuencia de ncf', 'secuencia ncf', 'ncf', 'numeracion'],
  }),
  Object.freeze({
    code: '09',
    label: 'Por cese de operaciones',
    matchers: ['cese de operaciones', 'cierre de operaciones', 'cierre'],
  }),
  Object.freeze({
    code: '10',
    label: 'Pérdida o hurto de talonarios',
    matchers: [
      'perdida o hurto de talonarios',
      'perdida',
      'hurto',
      'robo',
      'extravio',
      'talonario',
    ],
  }),
]);

const REASONS_BY_CODE = Object.freeze(
  Object.fromEntries(DGII_608_REASON_CATALOG.map((entry) => [entry.code, entry])),
);

const REASONS_BY_LABEL = Object.freeze(
  Object.fromEntries(
    DGII_608_REASON_CATALOG.map((entry) => [
      normalizeLookupKey(entry.label),
      entry,
    ]),
  ),
);

const findReasonByFreeText = (value) => {
  const normalized = normalizeLookupKey(value);
  if (!normalized) return null;

  return (
    DGII_608_REASON_CATALOG.find((entry) =>
      entry.matchers.some((matcher) => normalized.includes(normalizeLookupKey(matcher))),
    ) ?? null
  );
};

export const normalizeDgii608ReasonCode = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  const digits = normalized.replace(/\D/g, '');
  if (!digits.length) return null;

  const padded = digits.padStart(2, '0');
  return REASONS_BY_CODE[padded] ? padded : null;
};

export const getDgii608ReasonByCode = (value) => {
  const code = normalizeDgii608ReasonCode(value);
  return code ? REASONS_BY_CODE[code] : null;
};

export const resolveDgii608Reason = ({
  reasonCode,
  reasonLabel,
  reasonText,
}) => {
  const matchedByCode = getDgii608ReasonByCode(reasonCode);
  if (matchedByCode) {
    return {
      ...matchedByCode,
      catalogVersion: DGII_608_REASON_CATALOG_VERSION,
      rawReason: normalizeString(reasonText) ?? normalizeString(reasonLabel) ?? null,
      matchSource: 'code',
    };
  }

  const normalizedLabelKey = normalizeLookupKey(reasonLabel);
  const matchedByLabel = normalizedLabelKey
    ? REASONS_BY_LABEL[normalizedLabelKey] ?? null
    : null;
  if (matchedByLabel) {
    return {
      ...matchedByLabel,
      catalogVersion: DGII_608_REASON_CATALOG_VERSION,
      rawReason: normalizeString(reasonText) ?? normalizeString(reasonLabel) ?? null,
      matchSource: 'label',
    };
  }

  const matchedByText = findReasonByFreeText(reasonText ?? reasonLabel);
  if (matchedByText) {
    return {
      ...matchedByText,
      catalogVersion: DGII_608_REASON_CATALOG_VERSION,
      rawReason: normalizeString(reasonText) ?? normalizeString(reasonLabel) ?? null,
      matchSource: 'text',
    };
  }

  return {
    code: null,
    label: null,
    catalogVersion: DGII_608_REASON_CATALOG_VERSION,
    rawReason: normalizeString(reasonText) ?? normalizeString(reasonLabel) ?? null,
    matchSource: null,
  };
};
