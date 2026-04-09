import { ensureArray } from '@/utils/array/ensureArray';
import { toNumber } from '@/utils/number/toNumber';
import type {
  CashCountBanknote,
  CashCountExpense,
  CashCountInvoice,
} from '@/utils/cashCount/types';
import type {
  InvoiceData as InvoiceDataBase,
  InvoicePaymentMethod,
  InvoiceMonetaryValue,
} from '@/types/invoice';
import type { CashMovement } from '@/types/payments';

interface ReceivablePaymentMethod {
  method?: string;
  value?: number;
}

interface ReceivablePaymentRecord {
  amount?: number;
  method?: ReceivablePaymentMethod[];
  totalPaid?: number;
  paymentMethods?: ReceivablePaymentMethod[];
}

interface InvoiceSnapshot {
  cart?: {
    totalPurchase?: { value?: number } | number;
    change?: { value?: number } | number;
  };
}

type InvoiceData = InvoiceDataBase & {
  snapshot?: InvoiceSnapshot;
  payment?: InvoiceDataBase['payment'] & {
    paymentMethod?: InvoicePaymentMethod[];
  };
};

type InvoiceDoc =
  | { data?: InvoiceData }
  | InvoiceData
  | CashCountInvoice
  | null;

type InvoiceMetrics = {
  card: number;
  transfer: number;
  collected: number;
  invoiced: number;
};

type MovementMetrics = {
  count: number;
  card: number;
  transfer: number;
  total: number;
};

interface CashCountForMeta {
  opening?: { banknotes?: CashCountBanknote[] };
  closing?: { banknotes?: CashCountBanknote[] };
  receivablePayments?: ReceivablePaymentRecord[];
}

const CARD_METHODS = new Set(['card', 'credit_card', 'debit_card']);
const TRANSFER_METHODS = new Set(['transfer', 'bank_transfer', 'check']);
const REGISTER_METHODS = new Set(['cash', 'card', 'transfer', 'credit_card', 'debit_card', 'bank_transfer', 'check']);

const normalizeMethod = (value?: string) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const isCardMethod = (value?: string) => CARD_METHODS.has(normalizeMethod(value));
const isTransferMethod = (value?: string) =>
  TRANSFER_METHODS.has(normalizeMethod(value));
const impactsRegister = (value?: string) =>
  REGISTER_METHODS.has(normalizeMethod(value));

const getBanknoteTotal = (notes: CashCountBanknote[] = []) =>
  notes.reduce(
    (t, { value = 0, quantity = 0 }) => t + value * toNumber(quantity),
    0,
  );

const sumExpenses = (expenses: CashCountExpense[] = []) =>
  ensureArray(expenses)
    .filter((e) => e?.payment?.method === 'open_cash')
    .reduce((t, expense) => t + toNumber(expense?.amount), 0);

const sumReceivableMetrics = (payments: ReceivablePaymentRecord[] = []) =>
  ensureArray(payments).reduce(
    (acc, p) => {
      acc.collected += toNumber(p.amount ?? p.totalPaid);
      const methods = ensureArray(p.method ?? p.paymentMethods);
      methods.forEach((m) => {
        if (isCardMethod(m.method)) acc.card += toNumber(m.value);
        if (isTransferMethod(m.method)) acc.transfer += toNumber(m.value);
      });
      return acc;
    },
    { card: 0, transfer: 0, collected: 0 },
  );

const sumCashMovementMetrics = (
  movements: CashMovement[] = [],
  sourceType: CashMovement['sourceType'],
): MovementMetrics =>
  ensureArray(movements).reduce<MovementMetrics>(
    (acc, movement) => {
      if (
        movement?.sourceType !== sourceType ||
        movement?.direction !== 'in' ||
        movement?.status === 'void'
      ) {
        return acc;
      }

      const amount = toNumber(movement?.amount);
      if (amount <= 0) {
        return acc;
      }

      acc.count += 1;
      acc.total += amount;
      if (isCardMethod(movement?.method)) acc.card += amount;
      if (isTransferMethod(movement?.method)) acc.transfer += amount;
      return acc;
    },
    { count: 0, card: 0, transfer: 0, total: 0 },
  );

const sumExpenseCashMovementTotal = (movements: CashMovement[] = []) =>
  ensureArray(movements).reduce(
    (acc, movement) => {
      if (
        movement?.sourceType !== 'expense' ||
        movement?.direction !== 'out' ||
        movement?.status === 'void'
      ) {
        return acc;
      }

      const amount = toNumber(movement?.amount);
      if (amount <= 0) {
        return acc;
      }

      acc.count += 1;
      acc.total += amount;
      return acc;
    },
    { count: 0, total: 0 },
  );

const resolveValue = (
  value?:
    | number
    | string
    | { value?: number | string | null }
    | InvoiceMonetaryValue
    | null,
): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (value && typeof value === 'object') {
    const raw = (value as { value?: number | string | null }).value;
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }
  return undefined;
};

const resolveInvoiceData = (invoiceDoc: InvoiceDoc): InvoiceData | null => {
  if (!invoiceDoc) return null;
  if (typeof invoiceDoc === 'object' && 'data' in invoiceDoc) {
    return (invoiceDoc as { data?: InvoiceData }).data ?? null;
  }
  return invoiceDoc as InvoiceData;
};

const invoiceTotalFromData = (data: InvoiceData | null) =>
  toNumber(
    resolveValue(data?.totalPurchase) ??
      resolveValue(data?.snapshot?.cart?.totalPurchase) ??
      0,
  );

const invoiceChangeFromData = (data: InvoiceData | null) =>
  toNumber(
    resolveValue(data?.change) ??
      resolveValue(data?.snapshot?.cart?.change) ??
      0,
  );

const sumInvoiceMetrics = (invoices: InvoiceDoc[]) =>
  ensureArray(invoices).reduce<InvoiceMetrics>(
    (acc, invoiceDoc) => {
      const data = resolveInvoiceData(invoiceDoc);
      if (!data) return acc;

      const paymentMethods = ensureArray<InvoicePaymentMethod>(
        data?.paymentMethod ?? data?.payment?.paymentMethod ?? [],
      );

      const paidGross = paymentMethods.reduce((sum, method) => {
        if (!method?.status) return sum;
        if (!impactsRegister(method.method)) return sum;
        return sum + toNumber(method.value);
      }, 0);

      const invoiceTotal = invoiceTotalFromData(data);
      const change = invoiceChangeFromData(data);
      const paidNet = Math.max(0, paidGross - Math.max(0, change));

      // IMPORTANT (Accounting / Cash Reconciliation):
      // Collected amount must reflect *real money collected in this cash count*.
      // - Sales collected at POS: comes from payment methods (paidNet) or explicit payment snapshot.
      // - Credit/receivable sales: collected is 0 at sale time (money is counted when AR payments happen).
      //
      // Never fallback to invoiceTotal when there is no evidence of POS collection.
      const paymentSnapshotGross = toNumber(resolveValue(data?.payment) ?? 0);
      const paidNetFromSnapshot = Math.max(
        0,
        paymentSnapshotGross - Math.max(0, change),
      );
      const hasPosCollectionEvidence = paidGross > 0 || paidNetFromSnapshot > 0;
      const collectedAmount = hasPosCollectionEvidence ? (paidGross > 0 ? paidNet : paidNetFromSnapshot) : 0;

      const invoicedAmount =
        invoiceTotal > 0 ? invoiceTotal : Math.max(0, paidGross - change);

      acc.collected += collectedAmount;
      acc.invoiced += invoicedAmount;

      paymentMethods.forEach((p) => {
        if (!p?.status) return;
        if (!impactsRegister(p.method)) return;
        if (isCardMethod(p.method)) acc.card += toNumber(p.value);
        if (isTransferMethod(p.method)) acc.transfer += toNumber(p.value);
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
  cashCount: CashCountForMeta | null | undefined,
  invoices: InvoiceDoc[] = [],
  expenses: CashCountExpense[] = [],
  arPayments: ReceivablePaymentRecord[] = [],
  cashMovements: CashMovement[] = [],
) => {
  if (!cashCount) return null;

  const { opening = {}, closing = {}, receivablePayments = [] } = cashCount;

  const openBank = getBanknoteTotal(opening.banknotes || []);
  const closeBank = getBanknoteTotal(closing.banknotes || []);
  const paymentsSource = ensureArray(arPayments).length
    ? arPayments
    : receivablePayments;
  const movementInvoiceMetrics = sumCashMovementMetrics(
    cashMovements,
    'invoice_pos',
  );
  const movementReceivableMetrics = sumCashMovementMetrics(
    cashMovements,
    'receivable_payment',
  );
  const movementExpenseMetrics = sumExpenseCashMovementTotal(cashMovements);

  const legacyInvoiceMetrics = sumInvoiceMetrics(invoices);
  const legacyReceivableMetrics = sumReceivableMetrics(paymentsSource);
  const legacyTotalExpenses = sumExpenses(expenses);

  const invoiceMetrics: InvoiceMetrics =
    movementInvoiceMetrics.count > 0
      ? {
          card: movementInvoiceMetrics.card,
          transfer: movementInvoiceMetrics.transfer,
          collected: movementInvoiceMetrics.total,
          invoiced: movementInvoiceMetrics.total,
        }
      : legacyInvoiceMetrics;
  const arMetrics =
    movementReceivableMetrics.count > 0
      ? {
          card: movementReceivableMetrics.card,
          transfer: movementReceivableMetrics.transfer,
          collected: movementReceivableMetrics.total,
        }
      : legacyReceivableMetrics;
  const totalExpenses =
    movementExpenseMetrics.count > 0
      ? movementExpenseMetrics.total
      : legacyTotalExpenses;

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
    totalCharged: invoiceMetrics.collected,
    totalReceivables: arMetrics.collected,
    totalExpenses: totalExpenses,
  };
};
