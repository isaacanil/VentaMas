import { ensureArray } from '@/utils/array/ensureArray';
import { toNumber } from '@/utils/validators';

const getBanknoteTotal = (notes = []) =>
  notes.reduce((t, { value = 0, quantity = 0 }) => t + value * quantity, 0);

const sumExpenses = (expenses = []) =>
  ensureArray(expenses)
    .filter((e) => e?.payment?.method === 'open_cash')
    .reduce((t, expense) => t + toNumber(expense?.amount), 0);

const sumReceivableMetrics = (payments = []) =>
  ensureArray(payments).reduce(
    (acc, p) => {
      acc.collected += toNumber(p.amount);
      const methods = ensureArray(p.method);
      methods.forEach((m) => {
        if (m.method === 'card') acc.card += toNumber(m.value);
        if (m.method === 'transfer') acc.transfer += toNumber(m.value);
      });
      return acc;
    },
    { card: 0, transfer: 0, collected: 0 },
  );

const invoiceTotalFromData = (data) =>
  toNumber(
    data?.totalPurchase?.value ??
      data?.totalPurchase ??
      data?.snapshot?.cart?.totalPurchase?.value ??
      data?.snapshot?.cart?.totalPurchase ??
      0,
  );

const invoiceChangeFromData = (data) =>
  toNumber(
    data?.change?.value ??
      data?.change ??
      data?.snapshot?.cart?.change?.value ??
      data?.snapshot?.cart?.change ??
      0,
  );

const sumInvoiceMetrics = (invoices) =>
  ensureArray(invoices).reduce(
    (acc, invoiceDoc) => {
      const data = invoiceDoc?.data ?? invoiceDoc ?? null;
      if (!data) return acc;

      const paymentMethods = ensureArray(
        data?.paymentMethod ?? data?.payment?.paymentMethod ?? [],
      );

      const impactsRegister = (method) =>
        method === 'cash' || method === 'card' || method === 'transfer';

      const paidGross = paymentMethods.reduce((sum, method) => {
        if (!method?.status) return sum;
        if (!impactsRegister(method.method)) return sum;
        return sum + toNumber(method.value);
      }, 0);

      const invoiceTotal = invoiceTotalFromData(data);
      const change = invoiceChangeFromData(data);
      const paidNet = Math.max(0, paidGross - Math.max(0, change));

      const collectedAmount =
        paidGross > 0 || data?.isAddedToReceivables ? paidNet : invoiceTotal;

      const invoicedAmount =
        invoiceTotal > 0 ? invoiceTotal : Math.max(0, paidGross - change);

      acc.collected += collectedAmount;
      acc.invoiced += invoicedAmount;

      paymentMethods.forEach((p) => {
        if (!p?.status) return;
        if (!impactsRegister(p.method)) return;
        if (p.method === 'card') acc.card += toNumber(p.value);
        if (p.method === 'transfer') acc.transfer += toNumber(p.value);
      });

      return acc;
    },
    { card: 0, transfer: 0, collected: 0, invoiced: 0 },
  );

/**
 * Calculates and returns metadata for cash count.
 * @param {Object} cashCount - The cash count object.
 * @param {Array} invoices - The array of invoices.
 * @param {Array} expenses - The array of expenses.
 * @param {Array} arPayments - The array of AR payments (Accounts Receivable).
 * @returns {Object} - The metadata object containing various totals.
 */
export const CashCountMetaData = (
  cashCount,
  invoices = [],
  expenses = [],
  arPayments = [],
) => {
  if (!cashCount) return null;

  const {
    opening = {},
    closing = {},
    receivablePayments = [],
  } = cashCount;

  const openBank = getBanknoteTotal(opening.banknotes);
  const closeBank = getBanknoteTotal(closing.banknotes);
  const totalExpenses = sumExpenses(expenses);

  const invoiceMetrics = sumInvoiceMetrics(invoices);
  const paymentsSource = ensureArray(arPayments).length
    ? arPayments
    : receivablePayments;
  const arMetrics = sumReceivableMetrics(paymentsSource);

  const totalCard = invoiceMetrics.card + arMetrics.card;
  const totalTransfer = invoiceMetrics.transfer + arMetrics.transfer;

  const register = closeBank + totalCard + totalTransfer;

  // System = Sales Collected + AR Collected + OpenBank - Expenses
  const system =
    invoiceMetrics.collected + arMetrics.collected + openBank - totalExpenses;

  const discrepancy = register - system;

  return {
    totalCard,
    totalTransfer,
    totalRegister: register,
    totalSystem: system,
    totalDiscrepancy: discrepancy,
    totalCharged: invoiceMetrics.invoiced, // Map Invoiced Amount to 'totalCharged' for UI 'Total Facturado'
    totalReceivables: arMetrics.collected,
    totalExpenses: totalExpenses,
  };
};
