/**
 * Genera el contenido TXT del Formato 607 DGII.
 * Norma General 07-2018 y 05-2019.
 * Formato: pipe-delimited, CRLF line endings.
 */

const EXCLUDED_STATUSES = new Set([
  'cancelled',
  'canceled',
  'void',
  'voided',
  'annulled',
  'annulado',
  'deleted',
  'inactive',
  'disabled',
]);

export const isExcludedStatus = (status) => {
  const normalized =
    typeof status === 'string' ? status.trim().toLowerCase() : null;
  return normalized ? EXCLUDED_STATUSES.has(normalized) : false;
};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const DGII_607_CONSUMER_FINAL_MINIMUM = 250000;

export const normalizeIdentificationNumber = (value) => {
  const normalized = toCleanString(value);
  if (!normalized) return '';

  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 9 || digits.length === 11) {
    return digits;
  }

  return normalized.toUpperCase();
};

/**
 * Formatea una fecha ISO a YYYYMMDD tal como exige la DGII.
 */
const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

/**
 * Formatea un monto numérico a decimal con 2 cifras (e.g. "1180.00").
 */
const formatAmount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return Math.abs(n).toFixed(2);
};

/**
 * Determina el tipo de identificación DGII:
 * 1 = RNC (9 dígitos), 2 = Cédula (11 dígitos), 3 = Pasaporte o ID tributaria
 */
export const resolveIdentType = (rncOrCedula) => {
  const normalized = normalizeIdentificationNumber(rncOrCedula);
  if (!normalized) return '';

  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 9) return '1';
  if (digits.length === 11) return '2';
  return '3';
};

const CASH_METHODS = new Set(['cash', 'efectivo']);
const CARD_METHODS = new Set([
  'card',
  'credit_card',
  'debit_card',
  'tarjeta',
  'tarjeta_credito',
  'tarjeta_debito',
]);
const TRANSFER_METHODS = new Set([
  'transfer',
  'transferencia',
  'check',
  'cheque',
  'deposit',
  'deposito',
  'wire',
]);
const CREDIT_METHODS = new Set([
  'credit',
  'credito',
  'cxc',
  'accounts_receivable',
  'receivable',
  'credit_sale',
]);

/**
 * Distribuye el monto total entre los campos de forma de pago del 607.
 * Lee `paymentMethod` del documento Firestore en las ubicaciones conocidas.
 */
const resolvePaymentAmounts = (firestoreDoc, grossTotal) => {
  const result = {
    efectivo: 0,
    chequeTransferencia: 0,
    tarjeta: 0,
    ventaCredito: 0,
    bonos: 0,
    permuta: 0,
    otras: 0,
  };

  // Las facturas guardan métodos de pago dentro de data.paymentMethod
  const invoiceData = firestoreDoc?.data ?? firestoreDoc ?? {};
  const methods =
    (Array.isArray(invoiceData?.paymentMethod) && invoiceData.paymentMethod.length
      ? invoiceData.paymentMethod
      : null) ??
    (Array.isArray(invoiceData?.payment?.paymentMethod) &&
    invoiceData.payment.paymentMethod.length
      ? invoiceData.payment.paymentMethod
      : null) ??
    (Array.isArray(firestoreDoc?.snapshot?.cart?.paymentMethod) &&
    firestoreDoc.snapshot.cart.paymentMethod.length
      ? firestoreDoc.snapshot.cart.paymentMethod
      : null);

  if (!methods) {
    result.otras = grossTotal;
    return result;
  }

  let assigned = 0;
  for (const method of methods) {
    const type = String(method?.method ?? method?.type ?? '')
      .toLowerCase()
      .trim();
    const amount = Number(method?.value ?? method?.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    assigned += amount;

    if (CASH_METHODS.has(type)) result.efectivo += amount;
    else if (CARD_METHODS.has(type)) result.tarjeta += amount;
    else if (TRANSFER_METHODS.has(type)) result.chequeTransferencia += amount;
    else if (CREDIT_METHODS.has(type)) result.ventaCredito += amount;
    else result.otras += amount;
  }

  // Si hay diferencia sin asignar, va a "Otras Formas de Ventas"
  const remainder = grossTotal - assigned;
  if (remainder > 0.005) result.otras += remainder;

  return result;
};

const resolveRecordNcf = (record) =>
  toCleanString(record?.data?.NCF) ?? toCleanString(record?.ncf) ?? '';

export const isConsumerFinalNcf = (ncf) =>
  (toCleanString(ncf)?.toUpperCase() ?? '').startsWith('B02');

export const shouldExcludeDgii607TxtRecord = ({
  record,
  isCredit = false,
}) => {
  if (isExcludedStatus(record?.status)) {
    return true;
  }

  const ncf = resolveRecordNcf(record);
  if (!ncf) {
    return true;
  }

  if (isCredit) {
    return false;
  }

  const total = Number(record?.totals?.total);
  return (
    isConsumerFinalNcf(ncf) &&
    Number.isFinite(total) &&
    total < DGII_607_CONSUMER_FINAL_MINIMUM
  );
};

/**
 * Construye una fila de detalle del 607 (23 campos pipe-delimited).
 *
 * @param {object} record - Registro mapeado por mapInvoiceDocToDgii607Record o mapCreditNoteDocToDgii607Record
 * @param {object} firestoreDoc - Documento crudo de Firestore (para leer paymentMethod)
 * @param {boolean} [isCredit=false] - Si es una nota de crédito
 * @param {string|null} [originalNcf=null] - NCF de la factura original (para notas de crédito)
 */
export const buildDgii607TxtRow = ({
  record,
  firestoreDoc,
  isCredit = false,
  originalNcf = null,
}) => {
  const identificationNumber = normalizeIdentificationNumber(
    record.counterparty?.identification?.number,
  );
  const identificationType = resolveIdentType(identificationNumber);
  const ncf = resolveRecordNcf(record);
  const issuedAt = record.issuedAt ?? record.createdAt ?? '';
  const total = Number(record.totals?.total) || 0;
  const tax = Number(record.totals?.tax ?? record.totals?.itbis ?? 0);
  const monto = Math.max(0, total - tax);

  if (!isCredit && !identificationNumber) {
    throw new Error(
      `Falta identificación del cliente para exportar el NCF ${ncf || '(sin NCF)'}.`,
    );
  }

  const payments = resolvePaymentAmounts(firestoreDoc, total);

  return [
    identificationNumber,                       // 1. RNC/Cédula/Pasaporte
    identificationType,                         // 2. Tipo de Identificación
    ncf,                                        // 3. NCF
    isCredit ? (originalNcf ?? '') : '',        // 4. NCF Modificado
    '1',                                        // 5. Tipo de Ingreso
    formatDate(issuedAt),                       // 6. Fecha del Comprobante
    '',                                         // 7. Fecha de Retención
    formatAmount(monto),                        // 8. Monto Facturado
    formatAmount(tax),                          // 9. ITBIS Facturado
    '0.00',                                     // 10. ITBIS Retenido por Terceros
    '0.00',                                     // 11. ITBIS Percibido
    '0.00',                                     // 12. Retención Renta por Terceros
    '0.00',                                     // 13. ISR Percibido
    '0.00',                                     // 14. Impuesto Selectivo al Consumo
    '0.00',                                     // 15. Otros Impuestos/Tasas
    '0.00',                                     // 16. Monto Propina Legal
    formatAmount(payments.efectivo),            // 17. Efectivo
    formatAmount(payments.chequeTransferencia), // 18. Cheque/Transferencia/Depósito
    formatAmount(payments.tarjeta),             // 19. Tarjeta Débito/Crédito
    formatAmount(payments.ventaCredito),        // 20. Venta a Crédito
    formatAmount(payments.bonos),               // 21. Bonos o Certificados de Regalo
    formatAmount(payments.permuta),             // 22. Permuta
    formatAmount(payments.otras),               // 23. Otras Formas de Ventas
  ].join('|');
};

/**
 * Construye el contenido completo del archivo TXT 607.
 * Primera línea: encabezado `607|RNC_EMISOR|YYYYMM`.
 * Líneas siguientes: filas de detalle.
 */
export const buildDgii607TxtContent = ({ businessRnc, periodKey, rows }) => {
  const period = periodKey.replace('-', ''); // "2026-04" → "202604"
  const header = `607|${businessRnc}|${period}`;
  return [header, ...rows].join('\r\n');
};

/**
 * Nombre de archivo sugerido: `607_<RNC>_<YYYYMM>.txt`
 */
export const buildDgii607TxtFileName = ({ businessRnc, periodKey }) => {
  const period = periodKey.replace('-', '');
  return `607_${businessRnc}_${period}.txt`;
};
