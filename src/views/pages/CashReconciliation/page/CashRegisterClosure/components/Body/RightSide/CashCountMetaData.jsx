import { ensureArray } from '../../../../../../../../utils/array/ensureArray';
import { toNumber } from '../../../../../../../../utils/validators';

const getBanknoteTotal = (notes = []) =>
  notes.reduce((t, { value = 0, quantity = 0 }) => t + value * quantity, 0);

const sumExpenses = (expenses = []) =>
  ensureArray(expenses)
    .filter((e) => e?.payment?.method === 'open_cash')
    .reduce((t, expense) => t + toNumber(expense?.amount), 0);

const sumInvoiceMetrics = (invoices) =>
  invoices.reduce(
    (acc, { data }) => {
      const { paymentMethod = [], totalPurchase = {} } = data;
      acc.charged += toNumber(totalPurchase?.value);
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

  const { opening = {}, closing = {} } = cashCount;

  const openBank = getBanknoteTotal(opening.banknotes);
  const closeBank = getBanknoteTotal(closing.banknotes);
  const totalExpenses = sumExpenses(expenses);
  const { card, transfer, charged } = sumInvoiceMetrics(invoices);

  const register = closeBank + card + transfer;
  const system = charged + openBank - totalExpenses;
  const discrepancy = register - system;

  return {
    totalCard: card,
    totalTransfer: transfer,
    totalRegister: register,
    totalSystem: system,
    totalDiscrepancy: discrepancy,
    totalCharged: charged,
    totalExpenses: totalExpenses,
  };
};
