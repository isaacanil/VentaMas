const PERIOD_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_YYYYMMDD_REGEX = /^\d{8}$/;
const AMOUNT_TOLERANCE = 0.01;

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

const VALID_INCOME_TYPES = new Set(['1', '2', '3', '4', '5', '6']);

export const DGII_607_CONSUMER_FINAL_MINIMUM = 250000;

export const DGII_607_FIELD_DEFINITIONS = Object.freeze([
  Object.freeze({ key: 'identificationNumber', label: 'RNC/Cedula o Pasaporte' }),
  Object.freeze({ key: 'identificationType', label: 'Tipo Identificacion' }),
  Object.freeze({ key: 'ncf', label: 'Numero Comprobante Fiscal' }),
  Object.freeze({ key: 'modifiedNcf', label: 'Numero Comprobante Fiscal Modificado' }),
  Object.freeze({ key: 'incomeType', label: 'Tipo de Ingreso' }),
  Object.freeze({ key: 'issuedDate', label: 'Fecha Comprobante' }),
  Object.freeze({ key: 'retentionDate', label: 'Fecha de Retencion' }),
  Object.freeze({ key: 'billedAmount', label: 'Monto Facturado' }),
  Object.freeze({ key: 'itbisBilled', label: 'ITBIS Facturado' }),
  Object.freeze({ key: 'itbisWithheld', label: 'ITBIS Retenido por Terceros' }),
  Object.freeze({ key: 'itbisReceived', label: 'ITBIS Percibido' }),
  Object.freeze({ key: 'incomeTaxWithheld', label: 'Retencion Renta por Terceros' }),
  Object.freeze({ key: 'incomeTaxReceived', label: 'ISR Percibido' }),
  Object.freeze({ key: 'selectiveTax', label: 'Impuesto Selectivo al Consumo' }),
  Object.freeze({ key: 'otherTaxes', label: 'Otros Impuestos/Tasas' }),
  Object.freeze({ key: 'legalTip', label: 'Monto Propina Legal' }),
  Object.freeze({ key: 'cash', label: 'Efectivo' }),
  Object.freeze({ key: 'bank', label: 'Cheque/Transferencia/Deposito' }),
  Object.freeze({ key: 'card', label: 'Tarjeta Debito/Credito' }),
  Object.freeze({ key: 'creditSale', label: 'Venta a Credito' }),
  Object.freeze({ key: 'giftCertificates', label: 'Bonos o Certificados de Regalo' }),
  Object.freeze({ key: 'barter', label: 'Permuta' }),
  Object.freeze({ key: 'otherSales', label: 'Otras Formas de Ventas' }),
]);

const NUMERIC_FIELD_KEYS = Object.freeze([
  'billedAmount',
  'itbisBilled',
  'itbisWithheld',
  'itbisReceived',
  'incomeTaxWithheld',
  'incomeTaxReceived',
  'selectiveTax',
  'otherTaxes',
  'legalTip',
  'cash',
  'bank',
  'card',
  'creditSale',
  'giftCertificates',
  'barter',
  'otherSales',
]);

const PAYMENT_FIELD_KEYS = Object.freeze([
  'cash',
  'bank',
  'card',
  'creditSale',
  'giftCertificates',
  'barter',
  'otherSales',
]);

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

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  const normalized = new Date(isoString);
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

const isValidNcfStructure = (value) =>
  /^[A-Z0-9]{11,19}$/i.test(value);

const resolveFieldLabel = (fieldKey) =>
  DGII_607_FIELD_DEFINITIONS.find((field) => field.key === fieldKey)?.label ??
  fieldKey;

export const resolvePaymentAmounts = (firestoreDoc, grossTotal) => {
  const result = {
    cash: 0,
    bank: 0,
    card: 0,
    creditSale: 0,
    giftCertificates: 0,
    barter: 0,
    otherSales: 0,
  };

  const invoiceData = firestoreDoc?.data ?? firestoreDoc ?? {};
  const paymentBreakdown = firestoreDoc?.paymentBreakdown;
  if (paymentBreakdown && typeof paymentBreakdown === 'object') {
    const overrideResult = {
      ...result,
    };

    let assigned = 0;
    for (const key of Object.keys(overrideResult)) {
      const amount = Number(paymentBreakdown[key] ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      overrideResult[key] = amount;
      assigned += amount;
    }

    const remainder = grossTotal - assigned;
    if (remainder > 0.005) {
      overrideResult.otherSales += remainder;
    }

    return overrideResult;
  }

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
    result.otherSales = grossTotal;
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
    if (CASH_METHODS.has(type)) result.cash += amount;
    else if (CARD_METHODS.has(type)) result.card += amount;
    else if (TRANSFER_METHODS.has(type)) result.bank += amount;
    else if (CREDIT_METHODS.has(type)) result.creditSale += amount;
    else result.otherSales += amount;
  }

  const remainder = grossTotal - assigned;
  if (remainder > 0.005) result.otherSales += remainder;

  return result;
};

const resolveRecordNcf = (record) =>
  toCleanString(record?.data?.NCF) ?? toCleanString(record?.ncf) ?? '';

export const isExcludedStatus = (status) => {
  const normalized =
    typeof status === 'string' ? status.trim().toLowerCase() : null;
  return normalized ? EXCLUDED_STATUSES.has(normalized) : false;
};

export const normalizeIdentificationNumber = (value) => {
  const normalized = toCleanString(value);
  if (!normalized) return '';

  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 9 || digits.length === 11) {
    return digits;
  }

  return normalized.toUpperCase();
};

export const resolveIdentType = (rncOrCedula) => {
  const normalized = normalizeIdentificationNumber(rncOrCedula);
  if (!normalized) return '';

  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 9) return '1';
  if (digits.length === 11) return '2';
  return '3';
};

export const isConsumerFinalNcf = (ncf) =>
  (toCleanString(ncf)?.toUpperCase() ?? '').startsWith('B02');

export const buildDgii607Draft = ({
  record,
  firestoreDoc,
  isCredit = false,
  originalNcf = null,
}) => {
  const identificationNumber = normalizeIdentificationNumber(
    record?.counterparty?.identification?.number,
  );
  const identificationType = resolveIdentType(identificationNumber);
  const ncf = resolveRecordNcf(record);
  const modifiedNcf = isCredit ? (toCleanString(originalNcf) ?? '') : '';
  const issuedAt = record?.issuedAt ?? record?.createdAt ?? '';
  const retentionDate = record?.retentionDate ?? '';
  const total = Number(record?.totals?.total) || 0;
  const tax = Number(record?.totals?.tax ?? record?.totals?.itbis ?? 0) || 0;
  const billedAmount = Math.max(0, total - tax);
  const payments = resolvePaymentAmounts(firestoreDoc ?? record, total);
  const itbisWithheld = Number(record?.itbisWithheld) || 0;
  const incomeTaxWithheld = Number(record?.incomeTaxWithheld) || 0;

  return {
    isCredit,
    total,
    fields: {
      identificationNumber,
      identificationType,
      ncf,
      modifiedNcf,
      incomeType: '1',
      issuedDate: formatDate(issuedAt),
      retentionDate: formatDate(retentionDate),
      billedAmount: formatAmount(billedAmount),
      itbisBilled: formatAmount(tax),
      itbisWithheld: formatAmount(itbisWithheld),
      itbisReceived: '0.00',
      incomeTaxWithheld: formatAmount(incomeTaxWithheld),
      incomeTaxReceived: '0.00',
      selectiveTax: '0.00',
      otherTaxes: '0.00',
      legalTip: '0.00',
      cash: formatAmount(payments.cash),
      bank: formatAmount(payments.bank),
      card: formatAmount(payments.card),
      creditSale: formatAmount(payments.creditSale),
      giftCertificates: formatAmount(payments.giftCertificates),
      barter: formatAmount(payments.barter),
      otherSales: formatAmount(payments.otherSales),
    },
  };
};

export const buildDgii607StatusText = (issues = []) =>
  issues
    .map((issue) => `${resolveFieldLabel(issue.fieldKey)} - ${issue.message}`)
    .join('; ');

export const validateDgii607Header = ({
  businessRnc,
  periodKey,
  rowCount = 0,
}) => {
  const issues = [];
  const normalizedBusinessRnc = normalizeIdentificationNumber(businessRnc);
  const businessDigits = normalizedBusinessRnc.replace(/\D/g, '');

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
    appendIssue(issues, 'periodKey', 'invalid-period', 'Periodo invalido. Use AAAA-MM.');
  }

  if (!Number.isInteger(rowCount) || rowCount < 0 || rowCount > 65000) {
    appendIssue(
      issues,
      'rowCount',
      'invalid-row-count',
      'Cantidad de registros invalida. Debe estar entre 0 y 65,000.',
    );
  }

  return {
    ok: issues.length === 0,
    normalizedBusinessRnc,
    normalizedPeriodKey: toCleanString(periodKey) ?? '',
    issues,
    statusText: buildDgii607StatusText(issues),
  };
};

export const assertValidDgii607Header = (input) => {
  const validation = validateDgii607Header(input);
  if (!validation.ok) {
    const firstIssue = validation.issues[0];
    throw new Error(firstIssue?.message ?? 'Encabezado DGII 607 invalido.');
  }

  return validation;
};

export const validateDgii607Draft = (draft) => {
  const issues = [];
  const fields = draft?.fields ?? {};
  const identificationNumber = normalizeIdentificationNumber(fields.identificationNumber);
  const identificationType = toCleanString(fields.identificationType) ?? '';
  const ncf = toCleanString(fields.ncf) ?? '';
  const modifiedNcf = toCleanString(fields.modifiedNcf) ?? '';

  if (!identificationNumber) {
    appendIssue(
      issues,
      'identificationNumber',
      'missing-identification',
      `Falta identificación del cliente para exportar el NCF ${ncf || '(sin NCF)'}.`,
    );
  }

  if (!['1', '2', '3'].includes(identificationType)) {
    appendIssue(
      issues,
      'identificationType',
      'invalid-identification-type',
      'Tipo de identificación inválido. Solo se permiten 1, 2 o 3.',
    );
  } else if (identificationType === '1' && identificationNumber.replace(/\D/g, '').length !== 9) {
    appendIssue(
      issues,
      'identificationType',
      'identification-mismatch',
      'Tipo de identificación 1 requiere un RNC de 9 dígitos.',
    );
  } else if (
    identificationType === '2' &&
    identificationNumber.replace(/\D/g, '').length !== 11
  ) {
    appendIssue(
      issues,
      'identificationType',
      'identification-mismatch',
      'Tipo de identificación 2 requiere una cédula de 11 dígitos.',
    );
  }

  if (!ncf) {
    appendIssue(issues, 'ncf', 'missing-ncf', 'Numero de comprobante fiscal requerido.');
  } else if (!isValidNcfStructure(ncf)) {
    appendIssue(
      issues,
      'ncf',
      'invalid-ncf',
      'NCF inválido. Debe tener entre 11 y 19 posiciones alfanuméricas.',
    );
  }

  if (draft?.isCredit && !modifiedNcf) {
    appendIssue(
      issues,
      'modifiedNcf',
      'missing-modified-ncf',
      'Las notas de credito requieren el NCF modificado.',
    );
  } else if (modifiedNcf && !isValidNcfStructure(modifiedNcf)) {
    appendIssue(
      issues,
      'modifiedNcf',
      'invalid-modified-ncf',
      'NCF modificado inválido. Debe tener entre 11 y 19 posiciones alfanuméricas.',
    );
  }

  if (!VALID_INCOME_TYPES.has(toCleanString(fields.incomeType) ?? '')) {
    appendIssue(
      issues,
      'incomeType',
      'invalid-income-type',
      'Tipo de ingreso invalido. Solo se permiten valores del 1 al 6.',
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
    toCleanString(fields.retentionDate) &&
    !DATE_YYYYMMDD_REGEX.test(toCleanString(fields.retentionDate))
  ) {
    appendIssue(
      issues,
      'retentionDate',
      'invalid-retention-date',
      'Fecha de retencion invalida. Use AAAAMMDD.',
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

  const withheldTax =
    parseAmount(fields.itbisWithheld) + parseAmount(fields.incomeTaxWithheld);
  if (withheldTax > AMOUNT_TOLERANCE && !toCleanString(fields.retentionDate)) {
    appendIssue(
      issues,
      'retentionDate',
      'missing-retention-date',
      'Debe indicar fecha de retencion cuando existan retenciones sufridas.',
    );
  }

  const grossTotal =
    parseAmount(fields.billedAmount) +
    parseAmount(fields.itbisBilled) +
    parseAmount(fields.selectiveTax) +
    parseAmount(fields.otherTaxes) +
    parseAmount(fields.legalTip);
  const paymentTotal = PAYMENT_FIELD_KEYS.reduce(
    (sum, fieldKey) => sum + parseAmount(fields[fieldKey]),
    0,
  );

  if (Number.isFinite(grossTotal) && Number.isFinite(paymentTotal)) {
    if (Math.abs(paymentTotal - grossTotal) > AMOUNT_TOLERANCE) {
      appendIssue(
        issues,
        'otherSales',
        'payment-total-mismatch',
        'La suma de formas de venta debe ser igual al total del comprobante.',
      );
    }

    if (paymentTotal <= AMOUNT_TOLERANCE && !draft?.isCredit) {
      appendIssue(
        issues,
        'cash',
        'missing-payment-breakdown',
        'Debe informar al menos una forma de venta entre las columnas 17 y 23.',
      );
    }

    if (
      isConsumerFinalNcf(ncf) &&
      grossTotal < DGII_607_CONSUMER_FINAL_MINIMUM
    ) {
      appendIssue(
        issues,
        'ncf',
        'consumer-final-below-threshold',
        'Las facturas de consumidor final menores a RD$250,000 no deben detallarse en el 607.',
      );
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    statusText: buildDgii607StatusText(issues),
  };
};

export const assertValidDgii607Draft = (draft) => {
  const validation = validateDgii607Draft(draft);
  if (!validation.ok) {
    const firstIssue = validation.issues[0];
    throw new Error(firstIssue?.message ?? 'Fila DGII 607 invalida.');
  }

  return validation;
};

export const serializeDgii607Draft = (draft) =>
  DGII_607_FIELD_DEFINITIONS.map(({ key }) => draft?.fields?.[key] ?? '').join('|');
