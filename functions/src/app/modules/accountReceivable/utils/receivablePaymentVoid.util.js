import { buildAccountsReceivablePaymentState } from './receivablePaymentPlan.util.js';
import { reverseReceivableMonetarySettlement } from './receivableMonetary.util.js';

const THRESHOLD = 0.01;

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value) => Math.round(safeNumber(value) * 100) / 100;

const resolveAccountTotal = (account) => {
  const record = asRecord(account);
  const paymentState = asRecord(record.paymentState);
  return roundToTwoDecimals(
    paymentState.total ??
      record.totalReceivable ??
      record.totalAmount ??
      record.amount,
  );
};

const resolveAccountBalance = (account) => {
  const record = asRecord(account);
  const paymentState = asRecord(record.paymentState);
  return roundToTwoDecimals(
    paymentState.balance ?? record.arBalance ?? resolveAccountTotal(record),
  );
};

const resolveInstallmentAmount = (installment) => {
  const record = asRecord(installment);
  return roundToTwoDecimals(
    record.installmentAmount ?? record.amount ?? record.installmentBalance,
  );
};

const resolveInstallmentBalance = (installment) => {
  const record = asRecord(installment);
  return roundToTwoDecimals(
    record.installmentBalance ??
      record.balance ??
      record.installmentAmount ??
      record.amount,
  );
};

const countRemainingInstallments = (installments) =>
  (Array.isArray(installments) ? installments : []).filter(
    (installment) => resolveInstallmentBalance(installment) > THRESHOLD,
  ).length;

const resolveNextPaymentAt = (installments) => {
  const activeInstallments = (Array.isArray(installments) ? installments : [])
    .filter((installment) => resolveInstallmentBalance(installment) > THRESHOLD)
    .sort((left, right) => {
      const leftValue = safeNumber(left?.installmentDate?.toMillis?.() ?? left?.installmentDate);
      const rightValue = safeNumber(
        right?.installmentDate?.toMillis?.() ?? right?.installmentDate,
      );
      return leftValue - rightValue;
    });

  return activeInstallments[0]?.installmentDate ?? null;
};

const resolveInstallmentStatus = ({ installmentBalance, installmentAmount }) => {
  if (installmentBalance <= THRESHOLD) {
    return 'paid';
  }
  if (installmentBalance + THRESHOLD >= installmentAmount) {
    return 'pending';
  }
  return 'partial';
};

export const buildVoidReceivablePaymentPlan = ({
  context,
  accountEntry,
  paymentId,
  fallbackLastPaymentAt = null,
  fallbackLastPaymentId = null,
  fallbackLastPaymentAmount = 0,
  authUid,
  now,
}) => {
  const account = asRecord(context?.account);
  const installments = Array.isArray(context?.installments)
    ? context.installments.map((installment) => ({ ...installment }))
    : [];
  const invoice = context?.invoice ? { ...context.invoice } : null;
  const normalizedAccountEntry = asRecord(accountEntry);
  const paidInstallments = Array.isArray(normalizedAccountEntry.paidInstallments)
    ? normalizedAccountEntry.paidInstallments.map((entry) => asRecord(entry))
    : [];

  const restoreByInstallmentId = paidInstallments.reduce((accumulator, entry) => {
    const installmentId =
      typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : null;
    const amount = roundToTwoDecimals(entry.amount);
    if (!installmentId || amount <= THRESHOLD) {
      return accumulator;
    }

    accumulator.set(
      installmentId,
      roundToTwoDecimals((accumulator.get(installmentId) || 0) + amount),
    );
    return accumulator;
  }, new Map());

  if (!restoreByInstallmentId.size) {
    return {
      restoredAmount: 0,
      accountUpdate: null,
      installmentUpdates: [],
      installmentPaymentUpdates: [],
      invoiceAggregate: null,
    };
  }

  const paidInstallmentIds = new Set(account.paidInstallments || []);
  const installmentUpdates = [];
  const installmentPaymentUpdates = [];
  let restoredAmount = 0;

  const resultingInstallments = installments.map((installment) => {
    const installmentId = installment.id;
    const restoreAmount = roundToTwoDecimals(
      restoreByInstallmentId.get(installmentId) || 0,
    );
    if (restoreAmount <= THRESHOLD) {
      return installment;
    }

    const currentBalance = resolveInstallmentBalance(installment);
    const installmentAmount = resolveInstallmentAmount(installment);
    const nextInstallmentBalance = roundToTwoDecimals(
      Math.min(currentBalance + restoreAmount, installmentAmount),
    );
    const appliedRestoreAmount = roundToTwoDecimals(
      nextInstallmentBalance - currentBalance,
    );
    if (appliedRestoreAmount <= THRESHOLD) {
      return installment;
    }

    restoredAmount = roundToTwoDecimals(restoredAmount + appliedRestoreAmount);
    if (nextInstallmentBalance > THRESHOLD) {
      paidInstallmentIds.delete(installmentId);
    } else {
      paidInstallmentIds.add(installmentId);
    }

    installmentUpdates.push({
      installmentId,
      payload: {
        installmentBalance: nextInstallmentBalance,
        isActive: nextInstallmentBalance > THRESHOLD,
        updatedAt: now,
        updatedBy: authUid,
        status: resolveInstallmentStatus({
          installmentBalance: nextInstallmentBalance,
          installmentAmount,
        }),
      },
    });
    installmentPaymentUpdates.push({
      installmentPaymentId: `${paymentId}_${installmentId}`,
      payload: {
        isActive: false,
        status: 'void',
        updatedAt: now,
        updatedBy: authUid,
        voidedAt: now,
        voidedBy: authUid,
      },
    });

    return {
      ...installment,
      installmentBalance: nextInstallmentBalance,
    };
  });

  if (restoredAmount <= THRESHOLD) {
    return {
      restoredAmount,
      accountUpdate: null,
      installmentUpdates,
      installmentPaymentUpdates,
      invoiceAggregate: null,
    };
  }

  const currentPaymentState = asRecord(account.paymentState);
  const total = resolveAccountTotal(account);
  const nextArBalance = roundToTwoDecimals(
    Math.min(resolveAccountBalance(account) + restoredAmount, total),
  );
  const remainingInstallments = countRemainingInstallments(resultingInstallments);
  const nextPaymentAt = resolveNextPaymentAt(resultingInstallments);
  const shouldReplaceLastPayment =
    !currentPaymentState.lastPaymentId ||
    currentPaymentState.lastPaymentId === paymentId;
  const lastPaymentAt = shouldReplaceLastPayment
    ? fallbackLastPaymentAt
    : currentPaymentState.lastPaymentAt ?? fallbackLastPaymentAt;
  const lastPaymentId = shouldReplaceLastPayment
    ? fallbackLastPaymentId
    : currentPaymentState.lastPaymentId ?? fallbackLastPaymentId;
  const paymentCount = Math.max(
    Math.trunc(
      safeNumber(currentPaymentState.paymentCount ?? account.paymentCount ?? 0),
    ) - 1,
    0,
  );
  const monetaryReversal = reverseReceivableMonetarySettlement({
    accountMonetary: account.monetary,
    restoredDocumentAmount: restoredAmount,
    restoredHistoricalFunctionalAmount:
      normalizedAccountEntry.historicalFunctionalSettled ?? 0,
  });
  const paymentState = buildAccountsReceivablePaymentState({
    account,
    balance: nextArBalance,
    lastPaymentAt,
    lastPaymentId,
    paymentCount,
    nextPaymentAt,
    remainingInstallments,
  });

  return {
    restoredAmount,
    accountUpdate: {
      arId: account.id,
      payload: {
        arBalance: nextArBalance,
        lastPaymentDate: lastPaymentAt ?? null,
        lastPayment: shouldReplaceLastPayment
          ? roundToTwoDecimals(fallbackLastPaymentAmount)
          : roundToTwoDecimals(account.lastPayment),
        isActive: nextArBalance > THRESHOLD,
        isClosed: nextArBalance <= THRESHOLD,
        paidInstallments: Array.from(paidInstallmentIds),
        paymentState,
        ...(monetaryReversal.nextMonetary
          ? { monetary: monetaryReversal.nextMonetary }
          : {}),
      },
    },
    installmentUpdates,
    installmentPaymentUpdates,
    invoiceAggregate:
      invoice?.id != null
        ? {
            invoiceId: invoice.id,
            invoice,
            amountToReverse: restoredAmount,
          }
        : null,
  };
};
