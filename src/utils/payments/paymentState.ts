import type { PaymentState, PaymentStateStatus } from '@/types/payments';

const THRESHOLD = 0.01;

const toFiniteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

export interface BuildPaymentStateInput
  extends Omit<PaymentState, 'status' | 'total' | 'paid' | 'balance'> {
  total?: unknown;
  paid?: unknown;
  balance?: unknown;
  status?: PaymentStateStatus;
}

export const resolvePaymentStateStatus = ({
  total,
  paid,
  balance,
}: {
  total?: unknown;
  paid?: unknown;
  balance?: unknown;
}): PaymentStateStatus => {
  const safeTotal = roundToTwoDecimals(toFiniteNumber(total));
  const safePaid = roundToTwoDecimals(toFiniteNumber(paid));
  const safeBalance = roundToTwoDecimals(Math.max(toFiniteNumber(balance), 0));

  if (safePaid > safeTotal + THRESHOLD) {
    return 'overpaid';
  }
  if (safeBalance <= THRESHOLD) {
    return 'paid';
  }
  if (safePaid > THRESHOLD) {
    return 'partial';
  }
  return 'unpaid';
};

export const isSettledPaymentStateStatus = (
  status: PaymentStateStatus | string | null | undefined,
): boolean => status === 'paid' || status === 'overpaid';

export const buildPaymentState = (
  input: BuildPaymentStateInput,
): PaymentState => {
  const total = roundToTwoDecimals(toFiniteNumber(input.total));
  const paid = roundToTwoDecimals(toFiniteNumber(input.paid));
  const resolvedBalance =
    input.balance == null
      ? Math.max(roundToTwoDecimals(total - paid), 0)
      : roundToTwoDecimals(Math.max(toFiniteNumber(input.balance), 0));

  const paymentState: PaymentState = {
    status:
      input.status ??
      resolvePaymentStateStatus({ total, paid, balance: resolvedBalance }),
    total,
    paid,
    balance: resolvedBalance,
    lastPaymentAt: input.lastPaymentAt ?? null,
    nextPaymentAt: input.nextPaymentAt ?? null,
    lastPaymentId: input.lastPaymentId ?? null,
  };

  if (input.paymentCount !== undefined) {
    paymentState.paymentCount = input.paymentCount;
  }

  if (input.requiresReview !== undefined) {
    paymentState.requiresReview = input.requiresReview;
  }

  if (input.migratedFromLegacy !== undefined) {
    paymentState.migratedFromLegacy = input.migratedFromLegacy;
  }

  return paymentState;
};
