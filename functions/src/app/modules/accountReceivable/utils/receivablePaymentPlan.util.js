import {
  applyOverduePaymentState,
  buildPaymentState,
} from '../../../versions/v2/accounting/utils/paymentState.util.js';
import { applyReceivableMonetarySettlement } from './receivableMonetary.util.js';

const THRESHOLD = 0.01;

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value) => Math.round(safeNumber(value) * 100) / 100;

const resolveAccountTotal = (account) => {
  const accountRecord = asRecord(account);
  const paymentState = asRecord(accountRecord.paymentState);
  return roundToTwoDecimals(
    paymentState.total ??
      accountRecord.totalReceivable ??
      accountRecord.totalAmount ??
      accountRecord.amount,
  );
};

const resolveAccountBalance = (account) => {
  const accountRecord = asRecord(account);
  const paymentState = asRecord(accountRecord.paymentState);
  return roundToTwoDecimals(
    paymentState.balance ?? accountRecord.arBalance ?? resolveAccountTotal(accountRecord),
  );
};

const resolveInstallmentBalance = (installment) => {
  const installmentRecord = asRecord(installment);
  return roundToTwoDecimals(
    installmentRecord.installmentBalance ??
      installmentRecord.balance ??
      installmentRecord.installmentAmount ??
      installmentRecord.amount,
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

export const buildAccountsReceivablePaymentState = ({
  account,
  balance,
  lastPaymentAt = null,
  lastPaymentId = null,
  paymentCount,
  nextPaymentAt = null,
  remainingInstallments,
}) => {
  const accountRecord = asRecord(account);
  const currentPaymentState = asRecord(accountRecord.paymentState);
  const total = resolveAccountTotal(accountRecord);
  const resolvedBalance = roundToTwoDecimals(balance);
  const resolvedPaymentCount = Math.max(
    Math.trunc(
      paymentCount ?? currentPaymentState.paymentCount ?? accountRecord.paymentCount ?? 0,
    ),
    0,
  );

  const paymentState = applyOverduePaymentState(
    buildPaymentState({
      total,
      paid: roundToTwoDecimals(Math.max(total - resolvedBalance, 0)),
      balance: resolvedBalance,
      lastPaymentAt,
      lastPaymentId,
      paymentCount: resolvedPaymentCount,
      nextPaymentAt,
    }),
  );

  if (remainingInstallments !== undefined) {
    paymentState.remainingInstallments = Math.max(
      Math.trunc(safeNumber(remainingInstallments)),
      0,
    );
  }

  return paymentState;
};

export const applyReceivablePaymentToContext = ({
  context,
  mode,
  remainingAmount,
  paymentId,
  clientId,
  authUid,
  now,
}) => {
  const account = asRecord(context?.account);
  const installments = Array.isArray(context?.installments)
    ? context.installments.map((installment) => ({ ...installment }))
    : [];
  const activeInstallments = Array.isArray(context?.activeInstallments)
    ? context.activeInstallments.map((installment) => ({ ...installment }))
    : [];
  const invoice = context?.invoice ? { ...context.invoice } : null;

  let nextRemainingAmount = roundToTwoDecimals(remainingAmount);
  if (nextRemainingAmount <= THRESHOLD) {
    return {
      remainingAmount: nextRemainingAmount,
      accountEntry: null,
      accountUpdate: null,
      installmentUpdates: [],
      installmentPaymentWrites: [],
      invoiceAggregate: null,
    };
  }

  const originalBalance = resolveAccountBalance(account);
  const selectedInstallments =
    mode === 'installment' ? activeInstallments.slice(0, 1) : activeInstallments;
  const paidInstallments = [];
  const paidInstallmentIds = new Set(account.paidInstallments || []);
  const installmentUpdates = [];
  const installmentPaymentWrites = [];
  let accountPaid = 0;

  selectedInstallments.forEach((installment) => {
    if (nextRemainingAmount <= THRESHOLD) return;
    const currentInstallmentBalance = resolveInstallmentBalance(installment);
    if (currentInstallmentBalance <= THRESHOLD) return;

    const amountToApply = roundToTwoDecimals(
      Math.min(nextRemainingAmount, currentInstallmentBalance),
    );
    if (amountToApply <= THRESHOLD) return;

    const nextInstallmentBalance = roundToTwoDecimals(
      currentInstallmentBalance - amountToApply,
    );
    const installmentPaymentId = `${paymentId}_${installment.id}`;

    installmentUpdates.push({
      installmentId: installment.id,
      payload: {
        installmentBalance: nextInstallmentBalance,
        isActive: nextInstallmentBalance > THRESHOLD,
        updatedAt: now,
        updatedBy: authUid,
        status: nextInstallmentBalance <= THRESHOLD ? 'paid' : 'partial',
      },
    });
    installmentPaymentWrites.push({
      installmentPaymentId,
      payload: {
        id: installmentPaymentId,
        installmentId: installment.id,
        paymentId,
        paymentAmount: amountToApply,
        createdAt: now,
        updatedAt: now,
        createdBy: authUid,
        updatedBy: authUid,
        isActive: true,
        clientId,
        arId: account.id,
      },
    });

    nextRemainingAmount = roundToTwoDecimals(nextRemainingAmount - amountToApply);
    accountPaid = roundToTwoDecimals(accountPaid + amountToApply);
    if (nextInstallmentBalance <= THRESHOLD) {
      paidInstallmentIds.add(installment.id);
    }
    paidInstallments.push({
      number: installment.installmentNumber,
      id: installment.id,
      amount: amountToApply,
      status: nextInstallmentBalance <= THRESHOLD ? 'paid' : 'partial',
    });
  });

  if (accountPaid <= THRESHOLD) {
    return {
      remainingAmount: nextRemainingAmount,
      accountEntry: null,
      accountUpdate: null,
      installmentUpdates,
      installmentPaymentWrites,
      invoiceAggregate: null,
    };
  }

  const nextArBalance = roundToTwoDecimals(Math.max(originalBalance - accountPaid, 0));
  const installmentUpdateMap = new Map(
    installmentUpdates.map((entry) => [
      entry.installmentId,
      entry.payload.installmentBalance,
    ]),
  );
  const resultingInstallments = installments.map((installment) => ({
    ...installment,
    installmentBalance:
      installmentUpdateMap.get(installment.id) ?? resolveInstallmentBalance(installment),
  }));
  const remainingInstallments = countRemainingInstallments(resultingInstallments);
  const nextPaymentAt = resolveNextPaymentAt(resultingInstallments);
  const currentPaymentState = asRecord(account.paymentState);
  const monetarySettlement = applyReceivableMonetarySettlement({
    accountMonetary: account.monetary,
    appliedDocumentAmount: accountPaid,
  });
  const paymentState = buildAccountsReceivablePaymentState({
    account,
    balance: nextArBalance,
    lastPaymentAt: now,
    lastPaymentId: paymentId,
    paymentCount:
      Math.max(
        Math.trunc(
          safeNumber(currentPaymentState.paymentCount ?? account.paymentCount ?? 0),
        ),
        0,
      ) + 1,
    nextPaymentAt,
    remainingInstallments,
  });

  const accountEntry = {
    arNumber: account.numberId ?? account.arNumber ?? null,
    arId: account.id,
    accountType:
      typeof account.type === 'string' && account.type.trim()
        ? account.type.trim()
        : null,
    invoiceNumber: invoice?.numberID ?? invoice?.number ?? account.invoiceNumber ?? 'N/A',
    documentLabel:
      invoice?.type === 'preorder' || invoice?.preorderDetails?.isOrWasPreorder === true
        ? 'PREVENTA'
        : 'FACTURA',
    documentNumber:
      invoice?.type === 'preorder' || invoice?.preorderDetails?.isOrWasPreorder === true
        ? (invoice?.preorderDetails?.numberID ??
          invoice?.preorderDetails?.number ??
          invoice?.numberID ??
          invoice?.number ??
          null)
        : (invoice?.numberID ?? invoice?.number ?? null),
    documentType:
      invoice?.type === 'preorder' || invoice?.preorderDetails?.isOrWasPreorder === true
        ? 'preorder'
        : 'invoice',
    invoiceId: account.invoiceId ?? invoice?.id ?? account.preorderId ?? null,
    paidInstallments,
    remainingInstallments,
    totalInstallments: safeNumber(account.totalInstallments),
    totalPaid: accountPaid,
    arBalance: nextArBalance,
    paymentState,
    monetaryBefore: account.monetary ?? null,
    monetaryAfter: monetarySettlement.nextMonetary,
    historicalFunctionalSettled: monetarySettlement.historicalFunctionalAmount,
  };

  return {
    remainingAmount: nextRemainingAmount,
    accountEntry,
    accountUpdate: {
      arId: account.id,
      payload: {
        arBalance: nextArBalance,
        lastPaymentDate: now,
        lastPayment: accountPaid,
        isActive: nextArBalance > THRESHOLD,
        isClosed: nextArBalance <= THRESHOLD,
        paidInstallments: Array.from(paidInstallmentIds),
        paymentState,
        ...(monetarySettlement.nextMonetary
          ? { monetary: monetarySettlement.nextMonetary }
          : {}),
      },
    },
    installmentUpdates,
    installmentPaymentWrites,
    invoiceAggregate:
      invoice?.id != null
        ? {
            invoiceId: invoice.id,
            invoice,
            amountPaid: accountPaid,
          }
        : null,
  };
};
