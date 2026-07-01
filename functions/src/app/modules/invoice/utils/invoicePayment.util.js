export const PAYMENT_METHOD_TOLERANCE = 0.05;

export const safePaymentNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const roundPaymentAmount = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const stripAccents = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const normalizePaymentToken = (value) =>
  stripAccents(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const CREDIT_NOTE_TOKENS = new Set([
  'creditnote',
  'creditnotes',
  'creditmemo',
  'notacredito',
  'notadecredito',
  'notacreditos',
  'notasdecredito',
]);

const RECEIVABLE_TOKENS = new Set([
  'credit',
  'credito',
  'creditocliente',
  'clientecredito',
  'customercredit',
  'clientcredit',
  'accountsreceivable',
  'accountreceivable',
  'receivable',
  'cuentaporcobrar',
  'cuentasporcobrar',
  'pagodiferido',
  'deferredpayment',
  'installment',
  'installments',
  'financing',
  'financiamiento',
]);

const readPaymentMethodTokens = (method) => {
  if (!method || typeof method !== 'object' || Array.isArray(method)) {
    return [];
  }

  return [
    method.method,
    method.paymentMethod,
    method.type,
    method.code,
    method.id,
    method.name,
    method.label,
    method.displayName,
  ]
    .map(normalizePaymentToken)
    .filter(Boolean);
};

export const isCreditNotePaymentMethod = (method) =>
  readPaymentMethodTokens(method).some((token) =>
    CREDIT_NOTE_TOKENS.has(token),
  );

export const isReceivablePaymentMethod = (method) =>
  readPaymentMethodTokens(method).some((token) => RECEIVABLE_TOKENS.has(token));

export const getActivePaymentMethods = (cart) =>
  (Array.isArray(cart?.paymentMethod) ? cart.paymentMethod : []).filter(
    (method) =>
      method &&
      method.status === true &&
      safePaymentNumber(method.value) != null,
  );

export const sumActivePaymentMethods = (cart, { predicate } = {}) => {
  const activeMethods = getActivePaymentMethods(cart).filter((method) =>
    predicate ? predicate(method) : true,
  );
  if (!activeMethods.length) return null;

  return roundPaymentAmount(
    activeMethods.reduce(
      (sum, method) => sum + safePaymentNumber(method.value),
      0,
    ),
  );
};

export const sumActiveCreditNotePaymentMethods = (cart) =>
  sumActivePaymentMethods(cart, { predicate: isCreditNotePaymentMethod }) ?? 0;

export const sumActiveNonReceivablePaymentMethods = (cart) =>
  sumActivePaymentMethods(cart, {
    predicate: (method) =>
      !isCreditNotePaymentMethod(method) && !isReceivablePaymentMethod(method),
  });

export const sumCreditNoteApplications = (cart) => {
  const creditNotes = Array.isArray(cart?.creditNotePayment)
    ? cart.creditNotePayment
    : [];
  if (!creditNotes.length) return 0;

  return roundPaymentAmount(
    creditNotes.reduce((sum, note) => {
      const amount =
        safePaymentNumber(note?.amountUsed) ??
        safePaymentNumber(note?.amount) ??
        safePaymentNumber(note?.value) ??
        safePaymentNumber(note?.total) ??
        0;
      return amount > 0 ? sum + amount : sum;
    }, 0),
  );
};
