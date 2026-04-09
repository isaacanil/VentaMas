import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, Timestamp, FieldValue } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { LIMIT_OPERATION_KEYS } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import {
  buildAccountingEvent,
  buildAccountingEventId,
  resolveAccountingPaymentChannel,
  resolvePrimaryBankAccountId,
} from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import { assertAccountingPeriodOpenInTransaction } from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import { buildReceivablePaymentVoidCashMovements } from '../../../versions/v2/accounting/utils/cashMovement.util.js';
import { buildClientPendingBalanceUpdate } from '../utils/clientPendingBalance.util.js';
import { buildVoidReceivablePaymentPlan } from '../utils/receivablePaymentVoid.util.js';

const THRESHOLD = 0.01;

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value) => Math.round(safeNumber(value) * 100) / 100;

const sanitizeForResponse = (value) => {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForResponse(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const next = {};
  Object.entries(value).forEach(([key, nestedValue]) => {
    if (nestedValue === undefined) return;
    next[key] = sanitizeForResponse(nestedValue);
  });
  return next;
};

const toEpochMillis = (value) => {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (value?.toMillis instanceof Function) {
    return value.toMillis();
  }
  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveCashCountEmployeeId = (employee) => {
  if (typeof employee === 'string' && employee.trim()) {
    return employee.trim();
  }
  if (!employee || typeof employee !== 'object') {
    return null;
  }

  const record = employee;
  if (typeof record.id === 'string' && record.id.trim()) {
    return record.id.trim();
  }
  if (typeof record.uid === 'string' && record.uid.trim()) {
    return record.uid.trim();
  }
  if (typeof record.path === 'string' && record.path.trim()) {
    const parts = record.path.split('/').filter(Boolean);
    return parts[parts.length - 1] || null;
  }

  const serializedPath = record?._key?.path?.segments;
  if (Array.isArray(serializedPath) && serializedPath.length) {
    const last = serializedPath[serializedPath.length - 1];
    return typeof last === 'string' && last.trim() ? last.trim() : null;
  }

  return null;
};

const resolveCashCountState = async ({ businessId, authUid }) => {
  const snap = await db
    .collection(`businesses/${businessId}/cashCounts`)
    .where('cashCount.state', 'in', ['open', 'closing'])
    .get();

  if (snap.empty) {
    return { state: 'closed', cashCountId: null };
  }

  let openForUser = null;
  let closingForUser = null;
  let hasClosing = false;

  snap.docs.forEach((docSnap) => {
    const cashCount = asRecord(docSnap.data().cashCount);
    const employeeId = resolveCashCountEmployeeId(cashCount?.opening?.employee);
    const state = toCleanString(cashCount.state)?.toLowerCase() || 'closed';

    if (state === 'closing') {
      hasClosing = true;
    }
    if (employeeId !== authUid) {
      return;
    }
    if (state === 'open' && !openForUser) {
      openForUser = docSnap.id;
    }
    if (state === 'closing' && !closingForUser) {
      closingForUser = docSnap.id;
    }
  });

  if (openForUser) {
    return { state: 'open', cashCountId: openForUser };
  }
  if (closingForUser || hasClosing) {
    return { state: 'closing', cashCountId: closingForUser };
  }

  return { state: 'closed', cashCountId: null };
};

const paymentMethodsRequireCashCount = (paymentMethods) =>
  (Array.isArray(paymentMethods) ? paymentMethods : []).some((method) => {
    const methodCode = toCleanString(method?.method)?.toLowerCase() || null;
    return methodCode === 'cash' || methodCode === 'open_cash';
  });

const resolvePaymentAmount = (paymentRecord) => {
  const totalApplied = roundToTwoDecimals(paymentRecord?.totalApplied);
  if (totalApplied > THRESHOLD) {
    return totalApplied;
  }

  const paymentMethods = Array.isArray(paymentRecord?.paymentMethods)
    ? paymentRecord.paymentMethods
    : [];
  const paymentMethodsTotal = roundToTwoDecimals(
    paymentMethods.reduce(
      (sum, method) =>
        sum +
        roundToTwoDecimals(
          method?.status === false ? 0 : method?.value ?? method?.amount,
        ),
      0,
    ),
  );

  if (paymentMethodsTotal > THRESHOLD) {
    return paymentMethodsTotal;
  }

  return roundToTwoDecimals(
    paymentRecord?.totalApplied ??
      paymentRecord?.totalPaid ??
      paymentRecord?.amount ??
      paymentRecord?.totalAmount,
  );
};

const resolvePaymentStatus = ({ accumulatedPaid, balanceDue }) => {
  if (balanceDue <= THRESHOLD) return 'paid';
  if (accumulatedPaid > 0) return 'partial';
  return 'unpaid';
};

const buildInvoiceVoidUpdate = ({
  invoice,
  amountPaid,
  paymentMethods,
  now,
  paymentId,
}) => {
  if (!invoice?.id) return null;

  const invoiceData = asRecord(invoice.data || invoice);
  const totalPurchase = asRecord(invoiceData.totalPurchase);
  const preorderDetails = asRecord(invoiceData.preorderDetails);
  const totalAmount = roundToTwoDecimals(
    invoiceData.totalAmount ?? totalPurchase.value ?? 0,
  );
  const currentAccumulated = roundToTwoDecimals(
    invoiceData.accumulatedPaid ?? invoiceData.totalPaid ?? 0,
  );
  const nextAccumulatedPaid = roundToTwoDecimals(
    Math.max(currentAccumulated - amountPaid, 0),
  );
  const nextBalanceDue = roundToTwoDecimals(
    Math.max(totalAmount - nextAccumulatedPaid, 0),
  );
  const paymentStatus = resolvePaymentStatus({
    accumulatedPaid: nextAccumulatedPaid,
    balanceDue: nextBalanceDue,
  });
  const paymentHistoryEntry = {
    date: now,
    amount: roundToTwoDecimals(amountPaid),
    methods: paymentMethods,
    type: 'ar_payment_void',
    reversedPaymentId: paymentId,
  };
  const receivableState = {
    accumulatedPaid: nextAccumulatedPaid,
    balanceDue: nextBalanceDue,
    paymentStatus,
    lastPaymentAt: now,
    lastPaymentId: paymentId,
    lastEventType: 'void',
  };

  const payload = {
    accumulatedPaid: nextAccumulatedPaid,
    balanceDue: nextBalanceDue,
    paymentStatus,
    receivableState,
    'data.accumulatedPaid': nextAccumulatedPaid,
    'data.balanceDue': nextBalanceDue,
    'data.paymentStatus': paymentStatus,
    'data.receivableState': receivableState,
    paymentHistory: FieldValue.arrayUnion(paymentHistoryEntry),
    'data.paymentHistory': FieldValue.arrayUnion(paymentHistoryEntry),
  };

  const isPreorder =
    invoiceData.type === 'preorder' || preorderDetails.isOrWasPreorder === true;
  if (isPreorder) {
    payload['preorderDetails.paymentStatus'] = paymentStatus;
    payload['data.preorderDetails.paymentStatus'] = paymentStatus;
    payload['preorderDetails.balanceDue'] = nextBalanceDue;
    payload['data.preorderDetails.balanceDue'] = nextBalanceDue;
    payload['preorderDetails.accumulatedPaid'] = nextAccumulatedPaid;
    payload['data.preorderDetails.accumulatedPaid'] = nextAccumulatedPaid;
  }

  return {
    invoiceId: invoice.id,
    payload,
  };
};

const buildFallbackEntriesFromInstallmentPayments = (installmentPaymentDocs) => {
  const groupedEntries = new Map();

  (Array.isArray(installmentPaymentDocs) ? installmentPaymentDocs : []).forEach(
    (docSnap) => {
      const data = asRecord(docSnap?.data ? docSnap.data() : docSnap);
      const arId = toCleanString(data.arId);
      const installmentId = toCleanString(data.installmentId);
      const amount = roundToTwoDecimals(data.paymentAmount);
      if (!arId || !installmentId || amount <= THRESHOLD) {
        return;
      }

      const current = groupedEntries.get(arId) || {
        arId,
        paidInstallments: [],
        totalPaid: 0,
      };
      current.paidInstallments.push({
        id: installmentId,
        amount,
      });
      current.totalPaid = roundToTwoDecimals(current.totalPaid + amount);
      groupedEntries.set(arId, current);
    },
  );

  return Array.from(groupedEntries.values());
};

const loadVoidAccountContext = async ({
  transaction,
  businessId,
  accountEntry,
}) => {
  const normalizedEntry = asRecord(accountEntry);
  const arId = toCleanString(normalizedEntry.arId ?? normalizedEntry.accountId);
  if (!arId) {
    throw new HttpsError(
      'failed-precondition',
      'El pago no contiene una cuenta por cobrar válida para revertir.',
    );
  }

  const accountRef = db.doc(`businesses/${businessId}/accountsReceivable/${arId}`);
  const accountSnap = await transaction.get(accountRef);
  if (!accountSnap.exists) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta por cobrar asociada al pago no existe.',
    );
  }

  const account = {
    id: accountSnap.id,
    ...accountSnap.data(),
  };
  const installmentsQuery = db
    .collection(`businesses/${businessId}/accountsReceivableInstallments`)
    .where('arId', '==', arId)
    .orderBy('installmentDate', 'asc');
  const installmentsSnap = await transaction.get(installmentsQuery);
  const installments = installmentsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  let invoice = null;
  const invoiceId = toCleanString(account.invoiceId ?? normalizedEntry.invoiceId);
  if (invoiceId) {
    const invoiceRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);
    const invoiceSnap = await transaction.get(invoiceRef);
    if (invoiceSnap.exists) {
      invoice = {
        id: invoiceSnap.id,
        ...invoiceSnap.data(),
      };
    }
  }

  return {
    account,
    installments,
    invoice,
  };
};

const resolveFallbackLastPaymentForAccount = async ({
  transaction,
  businessId,
  arId,
  excludingPaymentId,
}) => {
  const installmentPaymentsQuery = db
    .collection(`businesses/${businessId}/accountsReceivableInstallmentPayments`)
    .where('arId', '==', arId);
  const installmentPaymentsSnap = await transaction.get(installmentPaymentsQuery);
  const installmentPaymentDocs = [...installmentPaymentsSnap.docs].sort((left, right) => {
    const rightTime = toEpochMillis(
      right.get('createdAt') ?? right.get('updatedAt') ?? null,
    );
    const leftTime = toEpochMillis(
      left.get('createdAt') ?? left.get('updatedAt') ?? null,
    );
    return rightTime - leftTime;
  });

  const seenPaymentIds = new Set();
  for (const docSnap of installmentPaymentDocs) {
    const data = asRecord(docSnap.data());
    const paymentId = toCleanString(data.paymentId);
    if (
      !paymentId ||
      paymentId === excludingPaymentId ||
      seenPaymentIds.has(paymentId) ||
      data.isActive === false
    ) {
      continue;
    }

    seenPaymentIds.add(paymentId);
    const paymentRef = db.doc(
      `businesses/${businessId}/accountsReceivablePayments/${paymentId}`,
    );
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists) {
      continue;
    }

    const paymentRecord = asRecord(paymentSnap.data());
    const paymentStatus = toCleanString(paymentRecord.status)?.toLowerCase();
    if (paymentStatus === 'void') {
      continue;
    }

    return {
      lastPaymentId: paymentId,
      lastPaymentAt:
        paymentRecord.date ??
        paymentRecord.updatedAt ??
        paymentRecord.createdAt ??
        docSnap.get('createdAt') ??
        null,
      lastPaymentAmount: resolvePaymentAmount(paymentRecord),
    };
  }

  return {
    lastPaymentId: null,
    lastPaymentAt: null,
    lastPaymentAmount: 0,
  };
};

const buildVoidResponse = ({
  paymentRecord,
  restoredAccounts,
  alreadyVoided = false,
}) => ({
  ok: true,
  alreadyVoided,
  paymentId: paymentRecord.id,
  restoredAccounts: sanitizeForResponse(restoredAccounts),
  payment: sanitizeForResponse(paymentRecord),
});

export const voidAccountsReceivablePayment = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const paymentId = toCleanString(payload.paymentId);
  const reason = toCleanString(payload.reason);

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }
  if (!paymentId) {
    throw new HttpsError('invalid-argument', 'paymentId es requerido');
  }

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
  });
  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    operation: LIMIT_OPERATION_KEYS.ACCOUNTS_RECEIVABLE_PAYMENT,
  });
  const accountingRolloutEnabled = isAccountingRolloutEnabledForBusiness(
    businessId,
  );
  const accountingSettings = accountingRolloutEnabled
    ? await getPilotAccountingSettingsForBusiness(businessId)
    : null;

  const paymentRef = db.doc(
    `businesses/${businessId}/accountsReceivablePayments/${paymentId}`,
  );
  const preflightPaymentSnap = await paymentRef.get();
  if (!preflightPaymentSnap.exists) {
    throw new HttpsError('not-found', 'El pago de cuentas por cobrar no existe.');
  }
  const preflightPaymentRecord = asRecord(preflightPaymentSnap.data());
  const preflightPaymentMethods = Array.isArray(preflightPaymentRecord.paymentMethods)
    ? preflightPaymentRecord.paymentMethods
    : [];
  const preflightRequiresCashCount = paymentMethodsRequireCashCount(
    preflightPaymentMethods,
  );
  const preflightCashCountState = preflightRequiresCashCount
    ? await resolveCashCountState({ businessId, authUid })
    : { state: 'not-required', cashCountId: null };
  let result = null;

  await db.runTransaction(async (transaction) => {
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists) {
      throw new HttpsError('not-found', 'El pago de cuentas por cobrar no existe.');
    }

    const paymentRecord = {
      id: paymentSnap.id,
      ...asRecord(paymentSnap.data()),
    };
    const paymentStatus = toCleanString(paymentRecord.status)?.toLowerCase();
    if (paymentStatus === 'void') {
      result = buildVoidResponse({
        paymentRecord,
        restoredAccounts: paymentRecord.metadata?.restoredAccounts ?? [],
        alreadyVoided: true,
      });
      return;
    }

    const paymentMethods = Array.isArray(paymentRecord.paymentMethods)
      ? paymentRecord.paymentMethods
      : [];
    const requiresCashCount = preflightRequiresCashCount;
    const cashCountState = preflightCashCountState;
    if (paymentMethodsRequireCashCount(paymentMethods) !== requiresCashCount) {
      throw new HttpsError(
        'failed-precondition',
        'El pago cambió de métodos de cobro antes de anularse. Reintenta la operación.',
      );
    }
    if (requiresCashCount && cashCountState.state === 'closing') {
      throw new HttpsError(
        'failed-precondition',
        'No se puede anular el pago: La caja está en proceso de cierre.',
      );
    }
    if (requiresCashCount && cashCountState.state === 'closed') {
      throw new HttpsError(
        'failed-precondition',
        'No se puede anular el pago: Debe abrir una caja para registrar la reversa de efectivo.',
      );
    }

    if (requiresCashCount && cashCountState.cashCountId) {
      const cashCountRef = db.doc(
        `businesses/${businessId}/cashCounts/${cashCountState.cashCountId}`,
      );
      const cashCountSnap = await transaction.get(cashCountRef);
      if (!cashCountSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'La caja seleccionada para la reversa ya no existe.',
        );
      }

      const currentCashCountState =
        toCleanString(cashCountSnap.get('cashCount.state'))?.toLowerCase() ||
        'closed';
      if (currentCashCountState !== 'open') {
        throw new HttpsError(
          'failed-precondition',
          'La caja cambió de estado antes de registrar la reversa.',
        );
      }
    }

    const now = Timestamp.now();
    await assertAccountingPeriodOpenInTransaction({
      transaction,
      businessId,
      effectiveDate: now,
      settings: accountingSettings,
      rolloutEnabled: accountingRolloutEnabled,
      operationLabel: 'anular este cobro',
      createError: (message) =>
        new HttpsError('failed-precondition', message),
    });

    const installmentPaymentsQuery = db
      .collection(`businesses/${businessId}/accountsReceivableInstallmentPayments`)
      .where('paymentId', '==', paymentId);
    const installmentPaymentsSnap = await transaction.get(installmentPaymentsQuery);
    const installmentPaymentDocs = installmentPaymentsSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    const storedAccountEntries = Array.isArray(paymentRecord.accountEntries)
      ? paymentRecord.accountEntries
      : [];
    const accountEntries = storedAccountEntries.length
      ? storedAccountEntries
      : buildFallbackEntriesFromInstallmentPayments(installmentPaymentDocs);
    if (!accountEntries.length) {
      throw new HttpsError(
        'failed-precondition',
        'El pago no tiene asignaciones suficientes para poder anularse de forma segura.',
      );
    }

    const clientId = toCleanString(paymentRecord.clientId);
    const clientRef = clientId
      ? db.doc(`businesses/${businessId}/clients/${clientId}`)
      : null;
    const clientSnap = clientRef ? await transaction.get(clientRef) : null;
    const fxSettlementsQuery = db
      .collection(`businesses/${businessId}/accountsReceivableFxSettlements`)
      .where('paymentId', '==', paymentId);
    const fxSettlementsSnap = await transaction.get(fxSettlementsQuery);
    const accountPlans = [];
    for (const accountEntry of accountEntries) {
      const normalizedEntry = asRecord(accountEntry);
      const context = await loadVoidAccountContext({
        transaction,
        businessId,
        accountEntry: normalizedEntry,
      });
      const fallbackLastPayment = await resolveFallbackLastPaymentForAccount({
        transaction,
        businessId,
        arId: context.account.id,
        excludingPaymentId: paymentId,
      });
      const plan = buildVoidReceivablePaymentPlan({
        context,
        accountEntry: normalizedEntry,
        paymentId,
        fallbackLastPaymentAt: fallbackLastPayment.lastPaymentAt,
        fallbackLastPaymentId: fallbackLastPayment.lastPaymentId,
        fallbackLastPaymentAmount: fallbackLastPayment.lastPaymentAmount,
        authUid,
        now,
      });
      accountPlans.push(plan);
    }

    const restoredAccounts = [];
    const invoiceAggregates = new Map();
    let restoredTotal = 0;

    accountPlans.forEach((plan) => {
      if (plan.accountUpdate) {
        transaction.update(
          db.doc(
            `businesses/${businessId}/accountsReceivable/${plan.accountUpdate.arId}`,
          ),
          plan.accountUpdate.payload,
        );
        restoredAccounts.push({
          arId: plan.accountUpdate.arId,
          balance: plan.accountUpdate.payload.arBalance,
          paymentState: plan.accountUpdate.payload.paymentState,
        });
      }

      plan.installmentUpdates.forEach((entry) => {
        transaction.update(
          db.doc(
            `businesses/${businessId}/accountsReceivableInstallments/${entry.installmentId}`,
          ),
          entry.payload,
        );
      });

      plan.installmentPaymentUpdates.forEach((entry) => {
        transaction.set(
          db.doc(
            `businesses/${businessId}/accountsReceivableInstallmentPayments/${entry.installmentPaymentId}`,
          ),
          entry.payload,
          { merge: true },
        );
      });

      if (plan.invoiceAggregate) {
        const current = invoiceAggregates.get(plan.invoiceAggregate.invoiceId) || {
          invoice: plan.invoiceAggregate.invoice,
          amountPaid: 0,
        };
        current.amountPaid = roundToTwoDecimals(
          current.amountPaid + plan.invoiceAggregate.amountToReverse,
        );
        invoiceAggregates.set(plan.invoiceAggregate.invoiceId, current);
      }

      restoredTotal = roundToTwoDecimals(restoredTotal + plan.restoredAmount);
    });

    if (restoredTotal <= THRESHOLD) {
      throw new HttpsError(
        'failed-precondition',
        'No se pudo restaurar saldo sobre ninguna cuenta del pago.',
      );
    }

    if (clientRef) {
      transaction.set(
        clientRef,
        buildClientPendingBalanceUpdate({
          currentClientDoc: clientSnap?.exists ? clientSnap.data() : null,
          delta: restoredTotal,
        }),
        { merge: true },
      );
    }

    invoiceAggregates.forEach(({ invoice, amountPaid }) => {
      const invoiceUpdate = buildInvoiceVoidUpdate({
        invoice,
        amountPaid,
        paymentMethods,
        now,
        paymentId,
      });
      if (!invoiceUpdate) return;

      transaction.update(
        db.doc(`businesses/${businessId}/invoices/${invoiceUpdate.invoiceId}`),
        invoiceUpdate.payload,
      );
    });

    if (isAccountingRolloutEnabledForBusiness(businessId)) {
      const voidedAt = now;
      const reversalMovements = buildReceivablePaymentVoidCashMovements({
        businessId,
        payment: {
          ...paymentRecord,
          voidedAt,
        },
        paymentMethods,
        cashCountId: cashCountState.cashCountId,
        clientId,
        accountEntries,
        createdAt: voidedAt,
        createdBy: authUid,
        voidReason: reason,
      });

      reversalMovements.forEach((movement) => {
        transaction.set(
          db.doc(`businesses/${businessId}/cashMovements/${movement.id}`),
          movement,
        );
      });
    }
    const voidedFxSettlementIds = [];
    fxSettlementsSnap.docs.forEach((docSnap) => {
      voidedFxSettlementIds.push(docSnap.id);
      transaction.set(
        docSnap.ref,
        {
          status: 'void',
          updatedAt: now,
          updatedBy: authUid,
          voidedAt: now,
          voidedBy: authUid,
          voidReason: reason,
        },
        { merge: true },
      );
    });

    const voidedAt = now;
    const nextPaymentRecord = {
      ...paymentRecord,
      status: 'void',
      isActive: false,
      updatedAt: voidedAt,
      updatedUserId: authUid,
      voidedAt,
      voidedBy: authUid,
      voidReason: reason,
      metadata: {
        ...asRecord(paymentRecord.metadata),
        restoredAccounts,
        voidCashCountId: cashCountState.cashCountId || null,
        voidedFxSettlementIds,
      },
    };

    if (isAccountingRolloutEnabledForBusiness(businessId)) {
      const accountingEvent = buildAccountingEvent({
        businessId,
        eventType: 'accounts_receivable.payment.voided',
        sourceType: 'accountsReceivablePayment',
        sourceId: paymentId,
        sourceDocumentType: 'accountsReceivablePayment',
        sourceDocumentId: paymentId,
        counterpartyType: 'client',
        counterpartyId: clientId,
        currency: paymentRecord.monetary?.documentCurrency?.code ?? null,
        functionalCurrency:
          paymentRecord.monetary?.functionalCurrency?.code ?? null,
        monetary: {
          amount: roundToTwoDecimals(
            paymentRecord.totalApplied ?? paymentRecord.totalPaid,
          ),
          functionalAmount: roundToTwoDecimals(
            paymentRecord.totalCollected ?? paymentRecord.amount,
          ),
        },
        treasury: {
          cashCountId:
            cashCountState.cashCountId ||
            toCleanString(paymentRecord.cashCountId),
          bankAccountId: resolvePrimaryBankAccountId(paymentMethods),
          paymentChannel: resolveAccountingPaymentChannel(paymentMethods),
        },
        payload: {
          reason,
          restoredAccounts,
          voidedFxSettlementIds,
          paymentMethods: paymentMethods.map((method) => ({
            method: toCleanString(method?.method) || null,
            value: roundToTwoDecimals(method?.value),
            bankAccountId: toCleanString(method?.bankAccountId),
          })),
        },
        reversalOfEventId: buildAccountingEventId({
          eventType: 'accounts_receivable.payment.recorded',
          sourceId: paymentId,
        }),
        occurredAt: voidedAt,
        recordedAt: voidedAt,
        createdAt: voidedAt,
        createdBy: authUid,
      });

      transaction.set(
        db.doc(
          `businesses/${businessId}/accountingEvents/${accountingEvent.id}`,
        ),
        accountingEvent,
      );
    }

    transaction.set(paymentRef, nextPaymentRecord, { merge: true });

    result = buildVoidResponse({
      paymentRecord: nextPaymentRecord,
      restoredAccounts,
    });
  });

  return result;
});
