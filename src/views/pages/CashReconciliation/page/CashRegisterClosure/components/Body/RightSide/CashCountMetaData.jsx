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
      const { paymentMethod = [], totalPaid, payment, totalPurchase = {} } = data;
      
      // Fix: Use totalPaid (collected) instead of totalPurchase (revenue) to exclude credit
      // Logic: totalPaid (explicit) -> payment.value (cart payment) -> totalPurchase.value (legacy/fallback)
      let chargedAmount = 0;
      if (totalPaid !== undefined && totalPaid !== null) {
        chargedAmount = toNumber(totalPaid);
      } else if (payment?.value !== undefined && payment?.value !== null) {
        chargedAmount = toNumber(payment.value);
      } else {
        chargedAmount = toNumber(totalPurchase?.value);
      }

      acc.charged += chargedAmount;
      paymentMethod.forEach((p) => {
        if (!p.status) return;
        if (p.method === 'card') acc.card += toNumber(p.value);
        if (p.method === 'transfer') acc.transfer += toNumber(p.value);
      });
      return acc;
    },
    { card: 0, transfer: 0, charged: 0 },
  );

/**
 * Calculates and returns metadata for cash count.
 * @param {Array} invoices - The array of invoices.
 * @param {Object} cashCount - The cash count object.
 * @returns {Object} - The metadata object containing various totals.
 */
export const CashCountMetaData = (cashCount, invoices = [], expenses = []) => {
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
    invoiceMetrics.charged + arMetrics.collected + openBank - totalExpenses;
    
  const discrepancy = register - system;

  return {
    totalCard,
    totalTransfer,
    totalRegister: register,
    totalSystem: system,
    totalDiscrepancy: discrepancy,
    totalCharged: invoiceMetrics.charged,
    totalReceivables: arMetrics.collected, // New field
    totalExpenses: totalExpenses,
  };
};