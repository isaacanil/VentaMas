const PERIOD_KEY_REGEX = /^\d{4}-\d{2}$/;

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeDigits = (value) =>
  (toCleanString(value) ?? '').replace(/\D/g, '');

const formatDate = (value) => {
  if (!value) return '';

  const normalized = new Date(value);
  if (Number.isNaN(normalized.getTime())) return '';

  const year = String(normalized.getUTCFullYear());
  const month = String(normalized.getUTCMonth() + 1).padStart(2, '0');
  const day = String(normalized.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export const assertValidDgii608Header = ({
  businessRnc,
  periodKey,
  rowCount = 0,
}) => {
  const digits = normalizeDigits(businessRnc);
  if (!digits) {
    throw new Error('RNC o cédula del emisor requerido.');
  }
  if (![9, 11].includes(digits.length)) {
    throw new Error('RNC o cédula del emisor debe tener 9 u 11 dígitos.');
  }
  if (!PERIOD_KEY_REGEX.test(toCleanString(periodKey) ?? '')) {
    throw new Error('Periodo invalido. Use AAAA-MM.');
  }
  if (!Number.isInteger(rowCount) || rowCount < 0 || rowCount > 999999) {
    throw new Error('Cantidad de registros inválida para el encabezado 608.');
  }
};

export const buildDgii608TxtRow = (record) => {
  const fiscalNumber =
    toCleanString(record?.data?.NCF) ?? toCleanString(record?.ncf) ?? '';
  if (!/^[A-Z0-9]{11,19}$/i.test(fiscalNumber)) {
    throw new Error(`NCF inválido para exportar 608: ${fiscalNumber || 'sin valor'}.`);
  }

  const cancellationDate = formatDate(
    record?.voidedAt ?? record?.createdAt ?? record?.issuedAt,
  );
  if (!cancellationDate) {
    throw new Error(`Fecha de anulación faltante para exportar el NCF ${fiscalNumber}.`);
  }

  const normalizedReasonCode = normalizeDigits(record?.voidReasonCode);
  const reasonCode = normalizedReasonCode
    ? normalizedReasonCode.padStart(2, '0')
    : '';
  if (!/^(0[1-9]|10)$/.test(reasonCode)) {
    throw new Error(`Tipo de anulación faltante para exportar el NCF ${fiscalNumber}.`);
  }

  return [fiscalNumber, cancellationDate, reasonCode].join('|');
};

export const buildDgii608TxtContent = ({ businessRnc, periodKey, rows }) => {
  const period = periodKey.replace('-', '');
  const header = `608|${normalizeDigits(businessRnc)}|${period}|${String(rows.length).padStart(6, '0')}`;
  return [header, ...rows].join('\r\n');
};

export const buildDgii608TxtFileName = ({ businessRnc, periodKey }) => {
  const period = periodKey.replace('-', '');
  return `608_${normalizeDigits(businessRnc)}_${period}.txt`;
};
