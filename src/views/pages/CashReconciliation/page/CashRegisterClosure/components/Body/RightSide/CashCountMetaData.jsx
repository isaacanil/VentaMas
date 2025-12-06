import { ensureArray } from '../../../../../../../../utils/array/ensureArray';
import { toNumber } from '../../../../../../../../utils/validators';

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

const sumInvoiceMetrics = (invoices) =>
  invoices.reduce(
    (acc, { data }) => {
      const { paymentMethod = [], payment } = data;

      // Collected Amount (Cash Flow) - What was actually paid/received
      const collectedAmount = toNumber(payment?.value) || 0;

      // Invoiced Amount (Revenue) - Total value of the invoice
      const invoicedAmount = toNumber(payment?.value) || 0;

      acc.collected += collectedAmount;
      acc.invoiced += invoicedAmount;

      paymentMethod.forEach((p) => {
        if (!p.status) return;
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
  const arMetrics = sumReceivableMetrics(receivablePayments);

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