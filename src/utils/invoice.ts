import DateUtils from './date/dateUtils';
import { normalizeInvoiceTimestamp } from './invoice/date';
import { roundDecimals } from './pricing';
import { isReference } from './referenceUtils';
import type { InvoiceData } from '@/types/invoice';
import { buildPaymentState } from '@/utils/payments/paymentState';
import type { TimestampLike } from '@/utils/date/types';

export {
  convertInvoiceDateToMillis,
  normalizeInvoiceTimestamp,
  resolveInvoiceDateMillis,
  formatInvoiceDate,
} from './invoice/date';
export {
  abbreviatePaymentMethods,
  getActivePaymentMethods,
  resolveInvoicePaymentLabel,
  resolveInvoicePaymentMethods,
  translatePaymentMethods,
} from './invoice/paymentMethods';
export {
  calculateInvoicesTotal,
  countInvoices,
  getInvoiceGeneralDiscount,
  getInvoiceIndividualDiscounts,
  getInvoiceSubtotal,
  getInvoiceSubtotalWithTax,
  getInvoiceTaxTotal,
  getInvoiceTotalsSnapshot,
} from './invoice/totals';

type PaymentHistoryEntry = {
  date?: TimestampLike | null;
  [key: string]: unknown;
};
type InvoicePaymentSource = {
  accumulatedPaid?: unknown;
  payment?: { value?: unknown } | null;
  change?: { value?: unknown } | null;
  totalPurchase?: { value?: unknown } | null;
  totalAmount?: unknown;
  paymentHistory?: unknown;
  data?: Record<string, unknown> | null;
  [key: string]: unknown;
};
type FirestoreTimestampLike = {
  seconds: number;
  nanoseconds: number;
};
type ReduxSerializable =
  | string
  | number
  | boolean
  | null
  | ReduxSerializable[]
  | { [key: string]: ReduxSerializable };
type SanitizedReduxValue = ReduxSerializable | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getUnknownRecordArray = (value: unknown): PaymentHistoryEntry[] =>
  Array.isArray(value) ? (value as PaymentHistoryEntry[]) : [];

export function getInvoicePaymentInfo(
  invoice: InvoicePaymentSource | null | undefined,
) {
  const accumulatedPaidRaw = Number(invoice?.accumulatedPaid);
  const hasAccumulatedPaid = Number.isFinite(accumulatedPaidRaw);

  const paymentGross = Number(invoice?.payment?.value ?? 0);
  const changeGross = Number(invoice?.change?.value ?? 0);
  const paidFromSnapshot = Number.isFinite(paymentGross)
    ? Math.max(0, paymentGross - (Number.isFinite(changeGross) ? changeGross : 0))
    : 0;

  const paidAmount = hasAccumulatedPaid ? accumulatedPaidRaw : paidFromSnapshot;

  const totalPurchase = Number(
    invoice?.totalPurchase?.value ?? invoice?.totalAmount ?? 0,
  );

  const safePaid = Number.isFinite(paidAmount) ? paidAmount : 0;
  const safeTotal = Number.isFinite(totalPurchase) ? totalPurchase : 0;
  const pending = Math.max(safeTotal - safePaid, 0);

  return {
    paid: safePaid,
    total: safeTotal,
    pending,
    isPaidInFull:
      safeTotal === 0 ? safePaid === safeTotal : safePaid >= safeTotal - 0.01, // Tolerance
  };
}

export function isInvoicePaidInFull(
  invoice: InvoicePaymentSource | null | undefined,
) {
  return getInvoicePaymentInfo(invoice).isPaidInFull;
}

export function getInvoicePaymentState(
  invoice: InvoicePaymentSource | null | undefined,
) {
  const paymentInfo = getInvoicePaymentInfo(invoice);
  const nestedData = isRecord(invoice?.data) ? invoice.data : null;
  const paymentHistory = Array.isArray(invoice?.paymentHistory)
    ? getUnknownRecordArray(invoice.paymentHistory)
    : Array.isArray(nestedData?.paymentHistory)
      ? getUnknownRecordArray(nestedData.paymentHistory)
      : [];
  const lastPaymentEntry =
    paymentHistory.length > 0 ? paymentHistory[paymentHistory.length - 1] : null;

  return buildPaymentState({
    total: paymentInfo.total,
    paid: paymentInfo.paid,
    balance: paymentInfo.pending,
    paymentCount: paymentHistory.length,
    lastPaymentAt: lastPaymentEntry?.date ?? null,
  });
}

export const normalizeInvoiceChange = (value: unknown): number => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return 0;

  const rounded = roundDecimals(numericValue, 2);
  return Math.abs(rounded) < 0.005 ? 0 : rounded;
};

export const calculateInvoiceChange = (
  invoice: InvoicePaymentSource | null | undefined,
): number => {
  const snapshotChange = Number(invoice?.change?.value);

  if (Number.isFinite(snapshotChange)) {
    return normalizeInvoiceChange(snapshotChange);
  }

  const payment = Number(invoice?.payment?.value ?? 0);
  const totalPurchase = Number(
    invoice?.totalPurchase?.value ?? invoice?.totalAmount ?? 0,
  );

  return normalizeInvoiceChange(payment - totalPurchase);
};

const isFirestoreTimestampLike = (
  value: unknown,
): value is FirestoreTimestampLike =>
  isRecord(value) &&
  typeof value.seconds === 'number' &&
  typeof value.nanoseconds === 'number';

const sanitizeForRedux = (value: unknown): SanitizedReduxValue => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value === 'function') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForRedux).filter((item) => item !== undefined);
  }

  if (isReference(value)) {
    return {
      path: value.path,
      id: value.id,
    };
  }

  if (isFirestoreTimestampLike(value)) {
    return DateUtils.convertTimestampToMillis(value);
  }

  if (isRecord(value)) {
    const result: Record<string, ReduxSerializable> = {};
    Object.entries(value).forEach(([key, entryValue]) => {
      const sanitized = sanitizeForRedux(entryValue);
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    });
    return result;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  return undefined;
};

export const prepareInvoiceForEdit = (
  invoice: InvoiceData | null | undefined,
): InvoiceData | null => {
  if (!invoice) return null;

  const activePayment = Array.isArray(invoice.paymentMethod)
    ? invoice.paymentMethod.find((method) => method.status === true)
    : null;

  const normalized = {
    ...invoice,
    date: normalizeInvoiceTimestamp(invoice.date),
    updateAt: normalizeInvoiceTimestamp(invoice.updateAt),
    payWith: activePayment?.value ?? activePayment?.method ?? null,
    cancel: invoice?.cancel
      ? {
          ...invoice.cancel,
          cancelledAt: normalizeInvoiceTimestamp(invoice.cancel.cancelledAt),
        }
      : null,
  };

  const sanitized = sanitizeForRedux(normalized);
  return isRecord(sanitized) ? (sanitized as InvoiceData) : null;
};
