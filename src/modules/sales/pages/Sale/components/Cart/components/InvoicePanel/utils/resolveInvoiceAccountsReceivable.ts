import { calculateAmountPerInstallment } from '@/utils/accountsReceivable/accountsReceivable';
import { calculatePaymentDates } from '@/domain/accountsReceivable/paymentDates';
import type { AccountsReceivablePaymentFrequency } from '@/utils/accountsReceivable/types';
import { toMillis } from '@/utils/date/dateUtils';
import { calculateInvoiceChange } from '@/utils/invoice';
import { setNumPrecision } from '@/utils/pricing';

type AccountsReceivableDraft = Record<string, unknown>;

type CartLike = {
  change?: { value?: unknown } | null;
  payment?: { value?: unknown } | null;
  totalAmount?: unknown;
  totalPurchase?: { value?: unknown } | null;
};

type ResolveInvoiceAccountsReceivableArgs = {
  accountsReceivable: AccountsReceivableDraft;
  cart: CartLike | null | undefined;
};

const DEFAULT_PAYMENT_FREQUENCY: AccountsReceivablePaymentFrequency = 'monthly';

const getPositive = (value: number) => (value < 0 ? -value : value);

const normalizeInstallments = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.trunc(parsed);
};

const normalizePaymentFrequency = (
  value: unknown,
): AccountsReceivablePaymentFrequency => {
  if (typeof value !== 'string') return DEFAULT_PAYMENT_FREQUENCY;
  const trimmed = value.trim();
  return trimmed || DEFAULT_PAYMENT_FREQUENCY;
};

const resolvePaymentDate = (
  value: unknown,
  paymentFrequency: AccountsReceivablePaymentFrequency,
  totalInstallments: number,
): number | null => {
  const existingPaymentDate = toMillis(value);
  if (existingPaymentDate) return existingPaymentDate;

  return calculatePaymentDates(paymentFrequency, totalInstallments)
    .nextPaymentDate;
};

export const resolveInvoiceAccountsReceivable = ({
  accountsReceivable,
  cart,
}: ResolveInvoiceAccountsReceivableArgs): AccountsReceivableDraft => {
  const paymentFrequency = normalizePaymentFrequency(
    accountsReceivable.paymentFrequency,
  );
  const totalInstallments = normalizeInstallments(
    accountsReceivable.totalInstallments,
  );
  const totalReceivable = getPositive(calculateInvoiceChange(cart));
  const installmentAmount = getPositive(
    setNumPrecision(
      calculateAmountPerInstallment(totalReceivable, totalInstallments),
    ),
  );

  return {
    ...accountsReceivable,
    paymentFrequency,
    totalInstallments,
    installmentAmount,
    totalReceivable,
    paymentDate: resolvePaymentDate(
      accountsReceivable.paymentDate,
      paymentFrequency,
      totalInstallments,
    ),
  };
};
