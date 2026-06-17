import { db } from '../../../../core/config/firebase.js';

const unwrapInvoiceDoc = (invoice) => {
  if (!invoice || typeof invoice !== 'object') return {};
  return invoice.data && typeof invoice.data === 'object'
    ? invoice.data
    : invoice;
};

const extractPositiveNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
};

export const getReceivableMetadata = (invoice) => {
  const payload = unwrapInvoiceDoc(invoice);
  const snapshot = payload?.snapshot || {};
  const cart = snapshot?.cart || payload?.cart || {};
  const candidates = [
    snapshot?.accountsReceivable,
    cart?.accountsReceivable,
    payload?.accountsReceivable,
  ].filter(Boolean);

  const totalInstallments = candidates.reduce((max, candidate) => {
    const count = extractPositiveNumber(candidate?.totalInstallments);
    return count > max ? count : max;
  }, 0);

  const isAdded =
    Boolean(cart?.isAddedToReceivables) ||
    Boolean(snapshot?.isAddedToReceivables) ||
    Boolean(payload?.isAddedToReceivables) ||
    candidates.some((candidate) => Boolean(candidate?.isAddedToReceivables));

  return {
    isAdded,
    totalInstallments,
  };
};

export const expectsAccountsReceivable = (invoice) => {
  const meta = getReceivableMetadata(invoice);
  return Boolean(meta.isAdded && meta.totalInstallments > 0);
};

export async function hasAccountsReceivable({ businessId, invoiceId }) {
  const snap = await db
    .collection(`businesses/${businessId}/accountsReceivable`)
    .where('invoiceId', '==', invoiceId)
    .limit(1)
    .get();
  return !snap.empty;
}
