import { ensureArray } from '@/utils/array/ensureArray';
import { toNumber } from '@/utils/validators';
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

type InvoiceDoc = { data?: InvoiceData } | InvoiceData | CashCountInvoice | null;

type InvoiceMetrics = {
  card: number;
  transfer: number;
  collected: number;
  invoiced: number;
};

interface CashCountForMeta {
  opening?: { banknotes?: CashCountBanknote[] };
  closing?: { banknotes?: CashCountBanknote[] };
  receivablePayments?: ReceivablePaymentRecord[];
}

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
        if (m.method === 'card') acc.card += toNumber(m.value);
        if (m.method === 'transfer') acc.transfer += toNumber(m.value);
      });
      return acc;
    },
    { card: 0, transfer: 0, collected: 0 },
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
    resolveValue(data?.change) ?? resolveValue(data?.snapshot?.cart?.change) ?? 0,
  );

const sumInvoiceMetrics = (invoices: InvoiceDoc[]) =>
  ensureArray(invoices).reduce<InvoiceMetrics>(
    (acc, invoiceDoc) => {
      const data = resolveInvoiceData(invoiceDoc);
      if (!data) return acc;

      const paymentMethods = ensureArray<InvoicePaymentMethod>(
        data?.paymentMethod ?? data?.payment?.paymentMethod ?? [],
      );

      const impactsRegister = (method?: string) =>
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
  cashCount: CashCountForMeta | null | undefined,
  invoices: InvoiceDoc[] = [],
  expenses: CashCountExpense[] = [],
  arPayments: ReceivablePaymentRecord[] = [],
) => {
  if (!cashCount) return null;

  const { opening = {}, closing = {}, receivablePayments = [] } = cashCount;

  const openBank = getBanknoteTotal(opening.banknotes || []);
  const closeBank = getBanknoteTotal(closing.banknotes || []);
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
    totalCharged: invoiceMetrics.collected,
    totalReceivables: arMetrics.collected,
    totalExpenses: totalExpenses,
  };
};
