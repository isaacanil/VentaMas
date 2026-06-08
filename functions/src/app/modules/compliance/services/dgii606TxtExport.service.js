import {
  isDgiiCreditOrDebitNoteNcf,
  isValidDgiiNcf,
} from './dgiiNcf.util.js';

const PERIOD_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_YYYYMMDD_REGEX = /^\d{8}$/;
const AMOUNT_TOLERANCE = 0.01;

const VALID_EXPENSE_TYPES = new Set([
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
]);
const VALID_PAYMENT_FORMS = new Set(['01', '02', '03', '04', '05', '06', '07']);
const VALID_ISR_RETENTION_TYPES = new Set([
  '',
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
]);

const CASH_PAYMENT_METHODS = new Set(['cash', 'open_cash', 'efectivo']);
const BANK_PAYMENT_METHODS = new Set([
  'transfer',
  'bank_transfer',
  'wire',
  'check',
  'cheque',
  'deposit',
  'deposito',
]);
const CARD_PAYMENT_METHODS = new Set([
  'card',
  'credit_card',
  'debit_card',
  'tarjeta',
  'tarjeta_credito',
  'tarjeta_debito',
]);
const CREDIT_NOTE_PAYMENT_METHODS = new Set([
  'suppliercreditnote',
  'supplier_credit_note',
  'supplier_creditnote',
  'supplier_credit',
  'suppliercredit',
  'credit_note',
  'nota_credito',
]);
const BARTER_PAYMENT_METHODS = new Set(['barter', 'permuta']);

export const DGII_606_FIELD_DEFINITIONS = Object.freeze([
  Object.freeze({ key: 'identificationNumber', label: 'RNC o Cedula' }),
  Object.freeze({ key: 'identificationType', label: 'Tipo Id' }),
  Object.freeze({
    key: 'expenseType',
    label: 'Tipo Bienes y Servicios Comprados',
  }),
  Object.freeze({ key: 'ncf', label: 'NCF' }),
  Object.freeze({ key: 'modifiedNcf', label: 'NCF o Documento Modificado' }),
  Object.freeze({ key: 'issuedDate', label: 'Fecha Comprobante' }),
  Object.freeze({ key: 'paymentDate', label: 'Fecha Pago' }),
  Object.freeze({
    key: 'serviceAmount',
    label: 'Monto Facturado en Servicios',
  }),
  Object.freeze({ key: 'goodsAmount', label: 'Monto Facturado en Bienes' }),
  Object.freeze({ key: 'totalAmount', label: 'Total Monto Facturado' }),
  Object.freeze({ key: 'itbisBilled', label: 'ITBIS Facturado' }),
  Object.freeze({ key: 'itbisWithheld', label: 'ITBIS Retenido' }),
  Object.freeze({
    key: 'itbisProportionality',
    label: 'ITBIS sujeto a Proporcionalidad',
  }),
  Object.freeze({ key: 'itbisCost', label: 'ITBIS llevado al Costo' }),
  Object.freeze({ key: 'itbisToAdvance', label: 'ITBIS por Adelantar' }),
  Object.freeze({ key: 'itbisReceived', label: 'ITBIS percibido en compras' }),
  Object.freeze({ key: 'isrRetentionType', label: 'Tipo de Retencion en ISR' }),
  Object.freeze({ key: 'incomeTaxWithheld', label: 'Monto Retencion Renta' }),
  Object.freeze({
    key: 'incomeTaxReceived',
    label: 'ISR Percibido en compras',
  }),
  Object.freeze({
    key: 'selectiveTax',
    label: 'Impuesto Selectivo al Consumo',
  }),
  Object.freeze({ key: 'otherTaxes', label: 'Otros Impuestos/Tasas' }),
  Object.freeze({ key: 'legalTip', label: 'Monto Propina Legal' }),
  Object.freeze({ key: 'paymentForm', label: 'Forma de Pago' }),
]);

const NUMERIC_FIELD_KEYS = Object.freeze([
  'serviceAmount',
  'goodsAmount',
  'totalAmount',
  'itbisBilled',
  'itbisWithheld',
  'itbisProportionality',
  'itbisCost',
  'itbisToAdvance',
  'itbisReceived',
  'incomeTaxWithheld',
  'incomeTaxReceived',
  'selectiveTax',
  'otherTaxes',
  'legalTip',
]);

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeDigits = (value) =>
  (toCleanString(value) ?? '').replace(/\D/g, '');

const normalizeTwoDigitCode = (value, max) => {
  const digits = normalizeDigits(value);
  if (!digits) return '';
  const numericValue = Number(digits);
  if (
    !Number.isInteger(numericValue) ||
    numericValue < 1 ||
    numericValue > max
  ) {
    return '';
  }
  return String(numericValue).padStart(2, '0');
};

const normalizeLookupKey = (value) =>
  (toCleanString(value) ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const normalizeDgii606IdentificationNumber = (value) => {
  const normalized = toCleanString(value);
  if (!normalized) return '';

  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 9 || digits.length === 11) return digits;
  return normalized.toUpperCase();
};

export const resolveDgii606IdentificationType = (value) => {
  const digits = normalizeDigits(value);
  if (digits.length === 9) return '1';
  if (digits.length === 11) return '2';
  return '';
};

const formatDate = (value) => {
  if (!value) return '';
  const normalized = new Date(value);
  if (Number.isNaN(normalized.getTime())) return '';

  const year = normalized.getUTCFullYear();
  const month = String(normalized.getUTCMonth() + 1).padStart(2, '0');
  const day = String(normalized.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const formatAmount = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return '0.00';
  return Math.abs(normalized).toFixed(2);
};

const parseAmount = (value) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : NaN;
};

const appendIssue = (issues, fieldKey, code, message, severity = 'error') => {
  issues.push({ fieldKey, code, message, severity });
};

const resolveFieldLabel = (fieldKey) =>
  DGII_606_FIELD_DEFINITIONS.find((field) => field.key === fieldKey)?.label ??
  fieldKey;

const buildStatusText = (issues = []) =>
  issues
    .map((issue) => `${resolveFieldLabel(issue.fieldKey)} - ${issue.message}`)
    .join('; ');

const resolveOptionalAmount = (...values) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const resolvePaymentDate = ({ record, payments = [] }) =>
  payments
    .map((payment) => payment?.occurredAt)
    .filter(Boolean)
    .sort()[0] ??
  record?.paymentAt ??
  '';

const resolvePaymentFormFromPayments = (payments = []) => {
  const paymentForms = new Set();

  payments.forEach((payment) => {
    const methods = Array.isArray(payment?.paymentMethods)
      ? payment.paymentMethods
      : [];

    methods.forEach((method) => {
      const methodKey = normalizeLookupKey(method?.method ?? method?.type);
      const amount = Number(method?.amount ?? method?.value ?? 0);
      if (!methodKey || (Number.isFinite(amount) && amount <= 0)) return;

      if (CASH_PAYMENT_METHODS.has(methodKey)) paymentForms.add('01');
      else if (BANK_PAYMENT_METHODS.has(methodKey)) paymentForms.add('02');
      else if (CARD_PAYMENT_METHODS.has(methodKey)) paymentForms.add('03');
      else if (BARTER_PAYMENT_METHODS.has(methodKey)) paymentForms.add('05');
      else if (CREDIT_NOTE_PAYMENT_METHODS.has(methodKey)) {
        paymentForms.add('06');
      } else {
        paymentForms.add('07');
      }
    });
  });

  if (paymentForms.size === 0) return '';
  if (paymentForms.size > 1) return '07';
  return Array.from(paymentForms)[0];
};

export const buildDgii606Draft = ({ record, payments = [] }) => {
  const identificationNumber = normalizeDgii606IdentificationNumber(
    record?.counterparty?.identification?.number,
  );
  const itbisBilled = resolveOptionalAmount(record?.taxBreakdown?.itbisTotal);
  const itbisCost = resolveOptionalAmount(
    record?.taxBreakdown?.itbisCost,
    record?.fiscalAmounts?.itbisCost,
  );

  return {
    fields: {
      identificationNumber,
      identificationType:
        resolveDgii606IdentificationType(identificationNumber),
      expenseType:
        normalizeTwoDigitCode(record?.classification?.dgii606ExpenseType, 11) ||
        normalizeTwoDigitCode(record?.expenseType, 11),
      ncf: toCleanString(record?.taxReceipt?.ncf) ?? '',
      modifiedNcf: toCleanString(record?.taxReceipt?.modifiedNcf) ?? '',
      issuedDate: formatDate(record?.issuedAt),
      paymentDate: formatDate(resolvePaymentDate({ record, payments })),
      serviceAmount: formatAmount(record?.fiscalAmounts?.serviceAmount),
      goodsAmount: formatAmount(record?.fiscalAmounts?.goodsAmount),
      totalAmount: formatAmount(record?.fiscalAmounts?.totalAmount),
      itbisBilled: formatAmount(itbisBilled),
      itbisWithheld: formatAmount(record?.taxBreakdown?.itbisWithheld),
      itbisProportionality: formatAmount(
        record?.taxBreakdown?.itbisProportionality,
      ),
      itbisCost: formatAmount(itbisCost),
      itbisToAdvance: formatAmount(
        record?.fiscalAmounts?.itbisToAdvance ?? itbisBilled - itbisCost,
      ),
      itbisReceived: formatAmount(record?.taxBreakdown?.itbisReceived),
      isrRetentionType:
        normalizeTwoDigitCode(record?.taxBreakdown?.isrRetentionType, 9) ||
        normalizeTwoDigitCode(record?.isrRetentionType, 9),
      incomeTaxWithheld: formatAmount(record?.taxBreakdown?.incomeTaxWithheld),
      incomeTaxReceived: formatAmount(record?.taxBreakdown?.incomeTaxReceived),
      selectiveTax: formatAmount(record?.taxBreakdown?.selectiveTax),
      otherTaxes: formatAmount(record?.taxBreakdown?.otherTaxes),
      legalTip: formatAmount(record?.taxBreakdown?.legalTip),
      paymentForm:
        normalizeTwoDigitCode(record?.paymentInfo?.formCode, 7) ||
        resolvePaymentFormFromPayments(payments),
    },
  };
};

export const validateDgii606Header = ({
  businessRnc,
  periodKey,
  rowCount = 0,
}) => {
  const issues = [];
  const normalizedBusinessRnc =
    normalizeDgii606IdentificationNumber(businessRnc);
  const businessDigits = normalizeDigits(normalizedBusinessRnc);

  if (!normalizedBusinessRnc) {
    appendIssue(
      issues,
      'businessRnc',
      'missing-business-rnc',
      'RNC o cédula del emisor requerido.',
    );
  } else if (![9, 11].includes(businessDigits.length)) {
    appendIssue(
      issues,
      'businessRnc',
      'invalid-business-rnc',
      'RNC o cédula del emisor debe tener 9 u 11 dígitos.',
    );
  }

  if (!PERIOD_KEY_REGEX.test(toCleanString(periodKey) ?? '')) {
    appendIssue(
      issues,
      'periodKey',
      'invalid-period',
      'Periodo invalido. Use AAAA-MM.',
    );
  }

  if (!Number.isInteger(rowCount) || rowCount < 0 || rowCount > 10000) {
    appendIssue(
      issues,
      'rowCount',
      'invalid-row-count',
      'Cantidad de registros invalida. Debe estar entre 0 y 10,000.',
    );
  }

  return {
    ok: issues.length === 0,
    normalizedBusinessRnc,
    normalizedPeriodKey: toCleanString(periodKey) ?? '',
    issues,
    statusText: buildStatusText(issues),
  };
};

export const assertValidDgii606Header = (input) => {
  const validation = validateDgii606Header(input);
  if (!validation.ok) {
    const firstIssue = validation.issues[0];
    throw new Error(firstIssue?.message ?? 'Encabezado DGII 606 invalido.');
  }

  return validation;
};

export const validateDgii606Draft = (draft) => {
  const issues = [];
  const fields = draft?.fields ?? {};
  const identificationNumber = normalizeDgii606IdentificationNumber(
    fields.identificationNumber,
  );
  const identificationType = toCleanString(fields.identificationType) ?? '';
  const ncf = toCleanString(fields.ncf) ?? '';
  const modifiedNcf = toCleanString(fields.modifiedNcf) ?? '';

  if (!identificationNumber) {
    appendIssue(
      issues,
      'identificationNumber',
      'missing-identification',
      `Falta identificación del proveedor para exportar el NCF ${ncf || '(sin NCF)'}.`,
    );
  }

  if (!['1', '2'].includes(identificationType)) {
    appendIssue(
      issues,
      'identificationType',
      'invalid-identification-type',
      'Tipo de identificación inválido para 606. Solo se permiten RNC o cédula.',
    );
  } else if (
    identificationType === '1' &&
    normalizeDigits(identificationNumber).length !== 9
  ) {
    appendIssue(
      issues,
      'identificationType',
      'identification-mismatch',
      'Tipo de identificación 1 requiere un RNC de 9 dígitos.',
    );
  } else if (
    identificationType === '2' &&
    normalizeDigits(identificationNumber).length !== 11
  ) {
    appendIssue(
      issues,
      'identificationType',
      'identification-mismatch',
      'Tipo de identificación 2 requiere una cédula de 11 dígitos.',
    );
  }

  if (!VALID_EXPENSE_TYPES.has(toCleanString(fields.expenseType) ?? '')) {
    appendIssue(
      issues,
      'expenseType',
      'invalid-expense-type',
      'Tipo de bienes y servicios comprado inválido. Use códigos 01 al 11.',
    );
  }

  if (!ncf) {
    appendIssue(
      issues,
      'ncf',
      'missing-ncf',
      'Numero de comprobante fiscal requerido.',
    );
  } else if (!isValidDgiiNcf(ncf)) {
    appendIssue(
      issues,
      'ncf',
      'invalid-ncf',
      'NCF inválido. Debe tener entre 11 y 19 posiciones alfanuméricas.',
    );
  }

  if (isDgiiCreditOrDebitNoteNcf(ncf) && !modifiedNcf) {
    appendIssue(
      issues,
      'modifiedNcf',
      'missing-modified-ncf',
      'Notas de crédito o débito requieren el NCF o documento modificado.',
    );
  } else if (modifiedNcf && !isValidDgiiNcf(modifiedNcf)) {
    appendIssue(
      issues,
      'modifiedNcf',
      'invalid-modified-ncf',
      'NCF modificado inválido. Debe tener entre 11 y 19 posiciones alfanuméricas.',
    );
  }

  if (!DATE_YYYYMMDD_REGEX.test(toCleanString(fields.issuedDate) ?? '')) {
    appendIssue(
      issues,
      'issuedDate',
      'invalid-issued-date',
      'Fecha del comprobante invalida. Use AAAAMMDD.',
    );
  }

  if (
    toCleanString(fields.paymentDate) &&
    !DATE_YYYYMMDD_REGEX.test(toCleanString(fields.paymentDate))
  ) {
    appendIssue(
      issues,
      'paymentDate',
      'invalid-payment-date',
      'Fecha de pago invalida. Use AAAAMMDD.',
    );
  }

  for (const fieldKey of NUMERIC_FIELD_KEYS) {
    const amount = parseAmount(fields[fieldKey]);
    if (!Number.isFinite(amount) || amount < 0) {
      appendIssue(
        issues,
        fieldKey,
        'invalid-amount',
        'Monto invalido. Debe ser numerico y mayor o igual que cero.',
      );
    }
  }

  const serviceAmount = parseAmount(fields.serviceAmount);
  const goodsAmount = parseAmount(fields.goodsAmount);
  const totalAmount = parseAmount(fields.totalAmount);
  if (
    Number.isFinite(serviceAmount) &&
    Number.isFinite(goodsAmount) &&
    Number.isFinite(totalAmount)
  ) {
    if (
      Math.abs(serviceAmount + goodsAmount - totalAmount) > AMOUNT_TOLERANCE
    ) {
      appendIssue(
        issues,
        'totalAmount',
        'total-mismatch',
        'Total facturado debe ser servicios + bienes, sin incluir impuestos.',
      );
    }

    if (serviceAmount + goodsAmount <= AMOUNT_TOLERANCE) {
      appendIssue(
        issues,
        'serviceAmount',
        'missing-taxable-base',
        'Debe existir monto facturado en servicios o bienes.',
      );
    }
  }

  const itbisWithheld = parseAmount(fields.itbisWithheld);
  const incomeTaxWithheld = parseAmount(fields.incomeTaxWithheld);
  if (
    Number.isFinite(itbisWithheld) &&
    Number.isFinite(incomeTaxWithheld) &&
    itbisWithheld + incomeTaxWithheld > AMOUNT_TOLERANCE &&
    !toCleanString(fields.paymentDate)
  ) {
    appendIssue(
      issues,
      'paymentDate',
      'missing-payment-date',
      'Debe indicar fecha de pago cuando existan retenciones.',
    );
  }

  if (
    Number.isFinite(incomeTaxWithheld) &&
    incomeTaxWithheld > AMOUNT_TOLERANCE &&
    !VALID_ISR_RETENTION_TYPES.has(toCleanString(fields.isrRetentionType) ?? '')
  ) {
    appendIssue(
      issues,
      'isrRetentionType',
      'missing-isr-retention-type',
      'Debe indicar tipo de retención en ISR cuando exista retención de renta.',
    );
  }

  if (!VALID_PAYMENT_FORMS.has(toCleanString(fields.paymentForm) ?? '')) {
    appendIssue(
      issues,
      'paymentForm',
      'invalid-payment-form',
      'Forma de pago 606 inválida. Use códigos 01 al 07.',
    );
  }

  return {
    ok: issues.length === 0,
    issues,
    statusText: buildStatusText(issues),
  };
};

export const assertValidDgii606Draft = (draft) => {
  const validation = validateDgii606Draft(draft);
  if (!validation.ok) {
    const firstIssue = validation.issues[0];
    throw new Error(firstIssue?.message ?? 'Fila DGII 606 invalida.');
  }

  return validation;
};

export const serializeDgii606Draft = (draft) =>
  DGII_606_FIELD_DEFINITIONS.map(({ key }) => draft?.fields?.[key] ?? '').join(
    '|',
  );

export const buildDgii606TxtRow = ({ record, payments = [] }) => {
  const draft = buildDgii606Draft({ record, payments });
  assertValidDgii606Draft(draft);
  return serializeDgii606Draft(draft);
};

export const buildDgii606TxtContent = ({ businessRnc, periodKey, rows }) => {
  const period = periodKey.replace('-', '');
  const header = [
    '606',
    normalizeDgii606IdentificationNumber(businessRnc),
    period,
    String(rows.length).padStart(12, '0'),
  ].join('|');
  return [header, ...rows].join('\r\n');
};

export const buildDgii606TxtFileName = ({ businessRnc, periodKey }) => {
  const period = periodKey.replace('-', '');
  return `DGII_F_606_${normalizeDgii606IdentificationNumber(businessRnc)}_${period}.TXT`;
};
