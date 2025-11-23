import { ensureArray } from '../../../../../../../../utils/array/ensureArray';
import { toNumber } from '../../../../../../../../utils/validators';

const getBanknoteTotal = (notes = []) =>
  notes.reduce((t, { value = 0, quantity = 0 }) => t + value * quantity, 0);

const sumExpenses = (expenses = []) =>
  ensureArray(expenses)
    .filter((e) => e?.payment?.method === 'open_cash')
    .reduce((t, expense) => t + toNumber(expense?.amount), 0);

const sumARPayments = (payments = []) =>
  payments.reduce(
    (acc, payment) => {
      const methods = payment.paymentMethods || [];
      methods.forEach((m) => {
        if (!m.status) return;
        const val = toNumber(m.value);
        if (m.method === 'cash') acc.cash += val;
        if (m.method === 'card') acc.card += val;
        if (m.method === 'transfer') acc.transfer += val;
      });
      return acc;
    },
    { cash: 0, card: 0, transfer: 0 },
  );

const sumInvoiceMetrics = (invoices) =>
  invoices.reduce(
    (acc, { data, snapshot }) => {
      // STRATEGY 1: Snapshot (Golden Source for new data)
      if (snapshot) {
        const methods = snapshot.initialPaymentMethods || [];
        const total = toNumber(snapshot.initialTotalPaid);

        // If it was credit sale with 0 initial payment, it adds 0 to "charged"
        acc.charged += total;

        methods.forEach((p) => {
          if (!p.status) return;
          if (p.method === 'card') acc.card += toNumber(p.value);
          if (p.method === 'transfer') acc.transfer += toNumber(p.value);
          // Note: We don't explicitly sum 'cash' here for the return object,
          // but it's implicitly part of 'charged' which feeds into 'system' total.
        });
        return acc;
      }

      // STRATEGY 2: Old Data Heuristic (Conservative)
      // If it's a credit sale (and no snapshot), assume $0 cash expected.
      if (data.isAddedToReceivables) {
        // We IGNORE this invoice for cash count purposes to avoid "Missing Cash".
        // Any actual money collected will be picked up by sumARPayments if it's in that collection.
        return acc;
      }

      // STRATEGY 3: Old Data Normal Sale
      const { paymentMethod = [], totalPurchase = {} } = data;
      // For normal sales, we assume totalPurchase is fully paid.
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

  const { opening = {}, closing = {} } = cashCount;

  const openBank = getBanknoteTotal(opening.banknotes);
  const closeBank = getBanknoteTotal(closing.banknotes);
  const totalExpenses = sumExpenses(expenses);

  // 1. Invoices Metrics (Money from Direct Sales)
  const invMetrics = sumInvoiceMetrics(invoices);

  // 2. AR Metrics (Money from Debt Collections)
  const arMetrics = sumARPayments(arPayments);

  // 3. Aggregation
  // Expected Cash (System) = (Sales Cash + AR Cash + Opening) - Expenses
  // Note: invMetrics.charged includes all paid amounts (Cash + Card + Transfer).
  // We need to isolate "System Cash" if we want to compare apples to apples,
  // but the current logic simplifies to "Total System Value" vs "Total Register Value".

  const totalCard = invMetrics.card + arMetrics.card;
  const totalTransfer = invMetrics.transfer + arMetrics.transfer;

  // "Charged" here means "Money that SHOULD be in the system from sales/collections"
  // For invoices: calculated by sumInvoiceMetrics (excludes credit)
  // For AR: sum of all payments
  const totalCharged =
    invMetrics.charged +
    (arMetrics.cash + arMetrics.card + arMetrics.transfer);

  // Register (Real World) = Cash in Drawer + Card Slips + Transfer Receipts
  const register = closeBank + totalCard + totalTransfer;

  // System (Expected World) = Total Money In (Sales+AR) + Opening Cash - Cash Expenses
  // Note: openBank is cash. totalExpenses is cash.
  // totalCharged includes cards/transfers.
  // So System = (CashIn + CardIn + TransferIn) + OpeningCash - CashOut
  const system = totalCharged + openBank - totalExpenses;

  const discrepancy = register - system;

  return {
    totalCard,
    totalTransfer,
    totalRegister: register,
    totalSystem: system,
    totalDiscrepancy: discrepancy,
    totalCharged,
    totalExpenses,
  };
};