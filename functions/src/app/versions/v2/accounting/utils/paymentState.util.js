const THRESHOLD = 0.01;

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value) => Math.round(safeNumber(value) * 100) / 100;

const toMillis = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value?.toMillis === 'function') {
    const parsed = value.toMillis();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value?.toDate === 'function') {
    const dateValue = value.toDate();
    return dateValue instanceof Date ? dateValue.getTime() : null;
  }
  if (typeof value === 'object') {
    const seconds =
      typeof value.seconds === 'number'
        ? value.seconds
        : typeof value._seconds === 'number'
          ? value._seconds
          : null;
    const nanoseconds =
      typeof value.nanoseconds === 'number'
        ? value.nanoseconds
        : typeof value._nanoseconds === 'number'
          ? value._nanoseconds
          : 0;
    if (seconds != null) {
      return seconds * 1000 + Math.floor(nanoseconds / 1e6);
    }
  }
  return null;
};

export const resolvePaymentStateStatus = ({ total, paid, balance }) => {
  const safeTotal = roundToTwoDecimals(total);
  const safePaid = roundToTwoDecimals(paid);
  const safeBalance = roundToTwoDecimals(Math.max(balance, 0));

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

export const buildPaymentState = (input = {}) => {
  const total = roundToTwoDecimals(input.total);
  const paid = roundToTwoDecimals(input.paid);
  const resolvedBalance =
    input.balance == null
      ? Math.max(roundToTwoDecimals(total - paid), 0)
      : roundToTwoDecimals(Math.max(input.balance, 0));

  const paymentState = {
    status:
      input.status ||
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

export const applyOverduePaymentState = (paymentState, now = Date.now()) => {
  if (!paymentState) return paymentState;

  const dueAt = toMillis(paymentState.nextPaymentAt);
  if (dueAt == null) return paymentState;
  if (roundToTwoDecimals(paymentState.balance) <= THRESHOLD) return paymentState;
  if (dueAt >= now) return paymentState;
  if (!['unpaid', 'partial'].includes(paymentState.status)) {
    return paymentState;
  }

  return {
    ...paymentState,
    status: 'overdue',
  };
};
