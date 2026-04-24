import { createHash } from 'node:crypto';

import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

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
  resolvePilotMonetarySnapshotForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import {
  buildAccountingEvent,
  resolveAccountingPaymentChannel,
  resolvePrimaryBankAccountId,
} from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import { assertAccountingPeriodOpenInTransaction } from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import { buildReceivablePaymentCashMovements } from '../../../versions/v2/accounting/utils/cashMovement.util.js';
import { buildClientPendingBalanceUpdate } from '../utils/clientPendingBalance.util.js';
import {
  allocateFunctionalAmountsByDocument,
  buildReceivableFxSettlementRecord,
  resolvePaymentAppliedDocumentAmount,
  resolvePaymentCollectedFunctionalAmount,
  shouldTrackFxSettlement,
} from '../utils/receivableMonetary.util.js';
import { applyReceivablePaymentToContext } from '../utils/receivablePaymentPlan.util.js';

const THRESHOLD = 0.01;
const BANK_METHODS_REQUIRING_BANK_ACCOUNT = new Set(['card', 'transfer']);

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

const stableSerialize = (value) => {
  if (value == null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  const record = asRecord(value);
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(',')}}`;
};

const buildIdempotencyRequestHash = (value) =>
  createHash('sha256').update(stableSerialize(value)).digest('hex');

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

const normalizeActivePaymentMethods = (paymentMethods) =>
  Array.isArray(paymentMethods)
    ? paymentMethods
      .filter((method) => method?.status === true)
      .map((method) => ({
        ...method,
        value: roundToTwoDecimals(method?.value),
        status: roundToTwoDecimals(method?.value) > 0,
      }))
      .filter((method) => method.status)
    : [];

const paymentMethodsRequireCashCount = (paymentMethods) =>
  (Array.isArray(paymentMethods) ? paymentMethods : []).some((method) => {
    const methodCode = toCleanString(method?.method)?.toLowerCase() || null;
    return methodCode === 'cash' || methodCode === 'open_cash';
  });

const validatePaymentMethods = ({ expectedAmount, paymentMethods }) => {
  const normalizedMethods = normalizeActivePaymentMethods(paymentMethods);
  const totalFromMethods = roundToTwoDecimals(
    normalizedMethods.reduce(
      (sum, method) => sum + safeNumber(method?.value),
      0,
    ),
  );
  const expected = roundToTwoDecimals(expectedAmount);
  if (Math.abs(totalFromMethods - expected) > 0.01) {
    throw new HttpsError(
      'invalid-argument',
      `Los metodos de pago (${totalFromMethods}) no coinciden con el total pagado (${expected}).`,
    );
  }

  return normalizedMethods;
};

const toDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (typeof value?.toDate === 'function') {
    const normalized = value.toDate();
    return normalized instanceof Date && !Number.isNaN(normalized.getTime())
      ? normalized
      : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const plainDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (plainDateMatch) {
      return new Date(
        Date.UTC(
          Number(plainDateMatch[1]),
          Number(plainDateMatch[2]) - 1,
          Number(plainDateMatch[3]),
          0,
          0,
          0,
          0,
        ),
      );
    }

    const normalized = new Date(trimmed);
    return Number.isNaN(normalized.getTime()) ? null : normalized;
  }

  return null;
};

const normalizeThirdPartyWithholding = (withholding) => {
  const record = asRecord(withholding);
  const retentionDate = toDateValue(record.retentionDate);
  const itbisWithheld = roundToTwoDecimals(record.itbisWithheld);
  const incomeTaxWithheld = roundToTwoDecimals(record.incomeTaxWithheld);

  if (itbisWithheld < 0 || incomeTaxWithheld < 0) {
    throw new HttpsError(
      'invalid-argument',
      'Las retenciones sufridas no pueden tener montos negativos.',
    );
  }

  if (itbisWithheld <= THRESHOLD && incomeTaxWithheld <= THRESHOLD) {
    return null;
  }

  if (!retentionDate) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar la fecha de retención cuando existan retenciones sufridas.',
    );
  }

  return {
    retentionDate,
    itbisWithheld,
    incomeTaxWithheld,
  };
};

const resolveInvoiceTotalsForWithholding = (invoice) => {
  const invoiceData = asRecord(invoice?.data);
  const total =
    roundToTwoDecimals(invoiceData?.totalPurchase?.value) ||
    roundToTwoDecimals(invoiceData?.totalPurchase);
  const tax =
    roundToTwoDecimals(invoiceData?.totalTaxes?.value) ||
    roundToTwoDecimals(invoiceData?.totalTaxes);

  return {
    totalAmount: total,
    taxAmount: tax,
  };
};

const buildThirdPartyWithholdingDoc = ({
  businessId,
  paymentId,
  receiptId,
  paymentScope,
  paymentOption,
  clientId,
  arId,
  invoiceAggregate,
  withholding,
  now,
}) => {
  const invoice = invoiceAggregate?.invoice;
  const invoiceData = asRecord(invoice?.data);
  const client = asRecord(invoiceData?.client);
  const { totalAmount, taxAmount } = resolveInvoiceTotalsForWithholding(invoice);

  return {
    id: paymentId,
    businessId,
    paymentId,
    receiptId,
    invoiceId: toCleanString(invoice?.id) ?? null,
    arId: toCleanString(arId) ?? null,
    clientId: toCleanString(clientId) ?? null,
    documentNumber:
      toCleanString(invoiceData?.numberID) ??
      toCleanString(invoiceData?.id) ??
      toCleanString(invoice?.id),
    documentFiscalNumber:
      toCleanString(invoiceData?.NCF) ??
      toCleanString(invoiceData?.comprobante) ??
      null,
    issuedAt: toDateValue(invoiceData?.date) ?? now.toDate(),
    retentionDate: Timestamp.fromDate(withholding.retentionDate),
    itbisWithheld: withholding.itbisWithheld,
    incomeTaxWithheld: withholding.incomeTaxWithheld,
    totalAmount,
    taxAmount,
    counterparty: {
      id:
        toCleanString(client?.id) ??
        toCleanString(invoiceData?.clientId) ??
        null,
      identification: {
        number:
          toCleanString(client?.rnc) ??
          toCleanString(client?.personalID) ??
          toCleanString(client?.personalId) ??
          null,
      },
    },
    status: 'recorded',
    source: {
      kind: 'accountsReceivablePayment',
      paymentScope: toCleanString(paymentScope) ?? null,
      paymentOption: toCleanString(paymentOption) ?? null,
      paymentPath: `businesses/${businessId}/accountsReceivablePayments/${paymentId}`,
      invoicePath: invoice?.id
        ? `businesses/${businessId}/invoices/${invoice.id}`
        : null,
    },
    createdAt: now,
    updatedAt: now,
  };
};

const assertPilotBankAccountsForPaymentMethods = async ({
  businessId,
  paymentMethods,
}) => {
  if (!isAccountingRolloutEnabledForBusiness(businessId)) {
    return;
  }

  const accountingSettings =
    await getPilotAccountingSettingsForBusiness(businessId);
  if (accountingSettings?.bankAccountsEnabled === false) {
    return;
  }

  const invalidMethod = (
    Array.isArray(paymentMethods) ? paymentMethods : []
  ).find((method) => {
    const methodCode = toCleanString(method?.method)?.toLowerCase() || null;
    if (!methodCode || !BANK_METHODS_REQUIRING_BANK_ACCOUNT.has(methodCode)) {
      return false;
    }
    return !toCleanString(method?.bankAccountId);
  });

  if (invalidMethod) {
    throw new HttpsError(
      'invalid-argument',
      'Los pagos con tarjeta o transferencia requieren una cuenta bancaria activa en este negocio piloto.',
    );
  }
};

const getUserDisplayName = async (authUid) => {
  const userSnap = await db.doc(`users/${authUid}`).get();
  if (!userSnap.exists) {
    return 'Usuario';
  }
  const userData = userSnap.data() || {};
  return (
    toCleanString(userData.displayName) ||
    toCleanString(userData.name) ||
    'Usuario'
  );
};

const resolvePaymentStatus = ({ accumulatedPaid, balanceDue }) => {
  if (balanceDue <= THRESHOLD) return 'paid';
  if (accumulatedPaid > 0) return 'partial';
  return 'unpaid';
};

const buildReceiptDoc = ({
  receiptId: providedReceiptId = null,
  businessId,
  authUid,
  userDisplayName,
  client,
  clientId,
  payment,
  paymentMethods,
  accounts,
  totalAmount,
  change,
  now,
}) => {
  const receiptId = providedReceiptId || nanoid();
  const flattenedInstallments = accounts.flatMap(
    (account) => account.paidInstallments || [],
  );

  return {
    id: receiptId,
    receiptId,
    receiptNumber: receiptId,
    businessId,
    clientId: clientId || null,
    client: client || null,
    user: {
      id: authUid,
      displayName: userDisplayName,
    },
    createdBy: authUid,
    updatedBy: authUid,
    createdAt: now,
    updatedAt: now,
    totalAmount: roundToTwoDecimals(totalAmount),
    paymentMethod: paymentMethods,
    paymentMethods,
    payment,
    account: accounts[0] || null,
    accounts,
    installmentsPaid: flattenedInstallments,
    change: roundToTwoDecimals(change),
  };
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

const buildInvoiceUpdate = ({
  invoice,
  amountPaid,
  paymentMethods,
  paymentId,
  now,
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
  const newAccumulatedPaid = roundToTwoDecimals(
    currentAccumulated + amountPaid,
  );
  const newBalanceDue = roundToTwoDecimals(
    Math.max(totalAmount - newAccumulatedPaid, 0),
  );
  const paymentStatus = resolvePaymentStatus({
    accumulatedPaid: newAccumulatedPaid,
    balanceDue: newBalanceDue,
  });
  const paymentHistoryEntry = {
    date: now,
    amount: roundToTwoDecimals(amountPaid),
    methods: paymentMethods,
    type: 'ar_payment',
  };
  const receivableState = {
    accumulatedPaid: newAccumulatedPaid,
    balanceDue: newBalanceDue,
    paymentStatus,
    lastPaymentAt: now,
    lastPaymentId: paymentId,
  };

  const payload = {
    accumulatedPaid: newAccumulatedPaid,
    balanceDue: newBalanceDue,
    paymentStatus,
    receivableState,
    'data.accumulatedPaid': newAccumulatedPaid,
    'data.balanceDue': newBalanceDue,
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
    payload['preorderDetails.balanceDue'] = newBalanceDue;
    payload['data.preorderDetails.balanceDue'] = newBalanceDue;
    payload['preorderDetails.accumulatedPaid'] = newAccumulatedPaid;
    payload['data.preorderDetails.accumulatedPaid'] = newAccumulatedPaid;
  }

  return {
    invoiceId: invoice.id,
    amountPaid: roundToTwoDecimals(amountPaid),
    payload,
  };
};

const buildTransactionAccountContext = async ({
  transaction,
  businessId,
  accountSnap,
}) => {
  if (!accountSnap.exists) {
    throw new HttpsError(
      'not-found',
      'Cuenta por cobrar no encontrada.',
    );
  }

  const account = {
    id: accountSnap.id,
    ...accountSnap.data(),
  };
  const currentBalance = roundToTwoDecimals(
    account.paymentState?.balance ?? account.arBalance,
  );
  if (account.isClosed === true || currentBalance <= THRESHOLD) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta no tiene balance pendiente.',
    );
  }

  const installmentsQuery = db
    .collection(`businesses/${businessId}/accountsReceivableInstallments`)
    .where('arId', '==', account.id)
    .orderBy('installmentDate', 'asc');
  const installmentsSnap = await transaction.get(installmentsQuery);
  const installments = installmentsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
  const activeInstallments = installments.filter(
    (installment) =>
      roundToTwoDecimals(installment.installmentBalance) > THRESHOLD,
  );
  if (!activeInstallments.length) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta no tiene cuotas activas para aplicar el pago.',
    );
  }

  let invoice = null;
  const invoiceId = toCleanString(account.invoiceId);
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
    activeInstallments,
    invoice,
  };
};

const loadTransactionPaymentContexts = async ({
  transaction,
  businessId,
  clientId,
  paymentScope,
  arId,
}) => {
  if (paymentScope === 'account') {
    if (!arId) {
      throw new HttpsError(
        'invalid-argument',
        'arId es requerido para este pago.',
      );
    }

    const accountRef = db.doc(
      `businesses/${businessId}/accountsReceivable/${arId}`,
    );
    const accountSnap = await transaction.get(accountRef);
    return [
      await buildTransactionAccountContext({
        transaction,
        businessId,
        accountSnap,
      }),
    ];
  }

  if (paymentScope !== 'balance') {
    throw new HttpsError('invalid-argument', 'paymentScope no valido.');
  }

  const accountsQuery = db
    .collection(`businesses/${businessId}/accountsReceivable`)
    .where('clientId', '==', clientId)
    .orderBy('createdAt', 'asc');
  const accountsSnap = await transaction.get(accountsQuery);

  const activeAccountSnaps = accountsSnap.docs.filter((docSnap) => {
    const account = {
      id: docSnap.id,
      ...docSnap.data(),
    };
    return (
      account.isClosed !== true &&
      roundToTwoDecimals(account.paymentState?.balance ?? account.arBalance) >
        THRESHOLD
    );
  });

  const contexts = [];
  for (const accountSnap of activeAccountSnaps) {
    contexts.push(
      await buildTransactionAccountContext({
        transaction,
        businessId,
        accountSnap,
      }),
    );
  }
  if (!contexts.length) {
    throw new HttpsError(
      'failed-precondition',
      'El cliente no tiene cuentas con balance pendiente.',
    );
  }
  return contexts;
};

export const processAccountsReceivablePayment = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const paymentDetails = asRecord(payload.paymentDetails);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const idempotencyKey = toCleanString(payload.idempotencyKey);
  const paymentScope = toCleanString(paymentDetails.paymentScope);
  const paymentOption = toCleanString(paymentDetails.paymentOption);
  const clientId = toCleanString(paymentDetails.clientId);
  const arId = toCleanString(paymentDetails.arId);
  const accountingRolloutEnabled = isAccountingRolloutEnabledForBusiness(
    businessId,
  );
  const thirdPartyWithholding = normalizeThirdPartyWithholding(
    paymentDetails.thirdPartyWithholding,
  );
  const totalPaid = roundToTwoDecimals(paymentDetails.totalPaid);
  const paymentMethods = normalizeActivePaymentMethods(
    paymentDetails.paymentMethods,
  );
  const pilotMonetarySnapshot = accountingRolloutEnabled
    ? await resolvePilotMonetarySnapshotForBusiness({
      businessId,
      monetary: paymentDetails.monetary,
      operationType: 'receivable-payment',
      source: paymentDetails,
      totals: {
        total: paymentDetails.totalAmount ?? paymentDetails.totalPaid,
        paid: paymentDetails.totalPaid,
        balance: 0,
      },
      capturedBy: authUid,
    })
    : null;
  const appliedDocumentAmount = resolvePaymentAppliedDocumentAmount({
    pilotMonetarySnapshot,
    fallbackAmount: totalPaid,
  });
  const collectedFunctionalAmount = resolvePaymentCollectedFunctionalAmount({
    pilotMonetarySnapshot,
    fallbackAmount: totalPaid,
  });

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }
  if (!idempotencyKey) {
    throw new HttpsError('invalid-argument', 'idempotencyKey es requerido');
  }
  if (!paymentScope) {
    throw new HttpsError('invalid-argument', 'paymentScope es requerido');
  }
  if (!clientId) {
    throw new HttpsError('invalid-argument', 'clientId es requerido');
  }
  if (appliedDocumentAmount <= 0) {
    throw new HttpsError(
      'invalid-argument',
      'El monto aplicado debe ser mayor que 0.',
    );
  }
  if (!paymentMethods.length) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar al menos un metodo de pago.',
    );
  }
  validatePaymentMethods({
    expectedAmount: collectedFunctionalAmount,
    paymentMethods,
  });
  const requestHash = buildIdempotencyRequestHash({
    businessId,
    clientId,
    arId,
    paymentScope,
    paymentOption: paymentOption || null,
    totalPaid,
    appliedDocumentAmount,
    collectedFunctionalAmount,
    comments: toCleanString(paymentDetails.comments) || null,
    originType: toCleanString(paymentDetails.originType) || null,
    originId: toCleanString(paymentDetails.originId) || null,
    preorderId: toCleanString(paymentDetails.preorderId) || null,
    originStage: toCleanString(paymentDetails.originStage) || null,
    createdFrom: toCleanString(paymentDetails.createdFrom) || null,
    thirdPartyWithholding: thirdPartyWithholding
      ? {
          retentionDate: thirdPartyWithholding.retentionDate.toISOString(),
          itbisWithheld: thirdPartyWithholding.itbisWithheld,
          incomeTaxWithheld: thirdPartyWithholding.incomeTaxWithheld,
        }
      : null,
    paymentMethods: paymentMethods.map((method) => ({
      method: toCleanString(method?.method)?.toLowerCase() || null,
      value: roundToTwoDecimals(method?.value),
      reference: toCleanString(method?.reference) || null,
      bankAccountId: toCleanString(method?.bankAccountId) || null,
    })),
  });
  await assertPilotBankAccountsForPaymentMethods({
    businessId,
    paymentMethods,
  });

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
  });
  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    operation: LIMIT_OPERATION_KEYS.ACCOUNTS_RECEIVABLE_PAYMENT,
  });

  const requiresCashCount = paymentMethodsRequireCashCount(paymentMethods);
  const cashCountState = requiresCashCount
    ? await resolveCashCountState({ businessId, authUid })
    : { state: 'not-required', cashCountId: null };
  if (requiresCashCount && cashCountState.state === 'closing') {
    throw new HttpsError(
      'failed-precondition',
      'No se puede procesar el pago: La caja está en proceso de cierre.',
    );
  }
  if (requiresCashCount && cashCountState.state === 'closed') {
    throw new HttpsError(
      'failed-precondition',
      'No se puede procesar el pago: No hay un cuadre de caja abierto.',
    );
  }

  const now = Timestamp.now();
  const userDisplayName = await getUserDisplayName(authUid);
  const clientSnap = await db
    .doc(`businesses/${businessId}/clients/${clientId}`)
    .get();
  const client = clientSnap.exists
    ? asRecord(clientSnap.data().client || clientSnap.data())
    : null;
  const paymentId = nanoid();
  const receiptId = nanoid();
  const idempotencyRef = db.doc(
    `businesses/${businessId}/accountsReceivablePaymentIdempotency/${idempotencyKey}`,
  );
  const basePayment = {
    id: paymentId,
    idempotencyKey,
    paymentMethods,
    paymentMethod: paymentMethods,
    amount: collectedFunctionalAmount,
    totalPaid: appliedDocumentAmount,
    totalAmount: collectedFunctionalAmount,
    comments: toCleanString(paymentDetails.comments) || '',
    clientId,
    arId: arId || null,
    originType: toCleanString(paymentDetails.originType) || null,
    originId: toCleanString(paymentDetails.originId) || null,
    preorderId: toCleanString(paymentDetails.preorderId) || null,
    originStage: toCleanString(paymentDetails.originStage) || null,
    createdFrom: toCleanString(paymentDetails.createdFrom) || null,
    paymentScope,
    paymentOption: paymentOption || null,
    date: now,
    createdAt: now,
    updatedAt: now,
    createdUserId: authUid,
    updatedUserId: authUid,
    isActive: true,
    status: 'posted',
    cashCountId: cashCountState.cashCountId || null,
    receiptId,
  };
  if (thirdPartyWithholding) {
    basePayment.thirdPartyWithholding = {
      retentionDate: Timestamp.fromDate(thirdPartyWithholding.retentionDate),
      itbisWithheld: thirdPartyWithholding.itbisWithheld,
      incomeTaxWithheld: thirdPartyWithholding.incomeTaxWithheld,
    };
  }
  if (pilotMonetarySnapshot) {
    basePayment.monetary = pilotMonetarySnapshot;
  }

  let result = null;

  await db.runTransaction(async (transaction) => {
    const idempotencySnap = await transaction.get(idempotencyRef);
    if (idempotencySnap.exists) {
      const idempotencyRecord = asRecord(idempotencySnap.data());
      const storedHash = toCleanString(idempotencyRecord.requestHash);
      if (storedHash && storedHash !== requestHash) {
        throw new HttpsError(
          'already-exists',
          'La llave de idempotencia ya fue utilizada con otro payload.',
        );
      }

      const existingPaymentId = toCleanString(idempotencyRecord.paymentId);
      if (!existingPaymentId) {
        throw new HttpsError(
          'failed-precondition',
          'El registro de idempotencia no apunta a un pago válido.',
        );
      }

      const existingPaymentRef = db.doc(
        `businesses/${businessId}/accountsReceivablePayments/${existingPaymentId}`,
      );
      const existingPaymentSnap = await transaction.get(existingPaymentRef);
      if (!existingPaymentSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'El pago reutilizado por idempotencia ya no existe.',
        );
      }

      const existingPaymentRecord = asRecord(existingPaymentSnap.data());
      const existingReceiptId =
        toCleanString(idempotencyRecord.receiptId) ||
        toCleanString(existingPaymentRecord.receiptId);
      if (!existingReceiptId) {
        throw new HttpsError(
          'failed-precondition',
          'El pago reutilizado por idempotencia no tiene comprobante asociado.',
        );
      }

      const existingReceiptRef = db.doc(
        `businesses/${businessId}/accountsReceivablePaymentReceipt/${existingReceiptId}`,
      );
      const existingReceiptSnap = await transaction.get(existingReceiptRef);
      if (!existingReceiptSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'El comprobante reutilizado por idempotencia ya no existe.',
        );
      }

      result = {
        ok: true,
        businessId,
        paymentId: existingPaymentId,
        receipt: sanitizeForResponse({
          id: existingReceiptSnap.id,
          ...existingReceiptSnap.data(),
        }),
        reused: true,
      };
      return;
    }

    if (accountingRolloutEnabled) {
      const accountingSettingsRef = db.doc(
        `businesses/${businessId}/settings/accounting`,
      );
      const accountingSettingsSnap = await transaction.get(accountingSettingsRef);

      await assertAccountingPeriodOpenInTransaction({
        transaction,
        businessId,
        effectiveDate: now,
        settings: accountingSettingsSnap.exists
          ? accountingSettingsSnap.data() || {}
          : {},
        rolloutEnabled: accountingRolloutEnabled,
        operationLabel: 'registrar este cobro',
        createError: (message) =>
          new HttpsError('failed-precondition', message),
      });
    }

    if (requiresCashCount && cashCountState.cashCountId) {
      const cashCountRef = db.doc(
        `businesses/${businessId}/cashCounts/${cashCountState.cashCountId}`,
      );
      const cashCountSnap = await transaction.get(cashCountRef);
      if (!cashCountSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'El cuadre de caja seleccionado ya no existe.',
        );
      }

      const currentCashCountState =
        toCleanString(cashCountSnap.get('cashCount.state'))?.toLowerCase() ||
        'closed';
      if (currentCashCountState !== 'open') {
        throw new HttpsError(
          'failed-precondition',
          'La caja cambió de estado antes de registrar el pago.',
        );
      }
    }

    const contexts = await loadTransactionPaymentContexts({
      transaction,
      businessId,
      clientId,
      paymentScope,
      arId,
    });
    const clientRef = db.doc(`businesses/${businessId}/clients/${clientId}`);
    const clientBalanceSnap = await transaction.get(clientRef);
    const mode =
      paymentScope === 'account' && paymentOption === 'installment'
        ? 'installment'
        : paymentScope === 'account' && paymentOption === 'partial'
          ? 'partial'
          : 'balance';
    let remainingAmount = appliedDocumentAmount;
    const accountEntries = [];
    const invoiceAggregates = new Map();

    contexts.forEach((context) => {
      const plan = applyReceivablePaymentToContext({
        context,
        mode: paymentScope === 'balance' ? 'balance' : mode,
        remainingAmount,
        paymentId,
        clientId,
        authUid,
        now,
      });
      remainingAmount = plan.remainingAmount;

      if (plan.accountUpdate) {
        transaction.update(
          db.doc(
            `businesses/${businessId}/accountsReceivable/${plan.accountUpdate.arId}`,
          ),
          plan.accountUpdate.payload,
        );
      }

      plan.installmentUpdates.forEach((entry) => {
        transaction.update(
          db.doc(
            `businesses/${businessId}/accountsReceivableInstallments/${entry.installmentId}`,
          ),
          entry.payload,
        );
      });

      plan.installmentPaymentWrites.forEach((entry) => {
        transaction.set(
          db.doc(
            `businesses/${businessId}/accountsReceivableInstallmentPayments/${entry.installmentPaymentId}`,
          ),
          entry.payload,
        );
      });

      if (plan.invoiceAggregate) {
        const current = invoiceAggregates.get(plan.invoiceAggregate.invoiceId) || {
          invoice: plan.invoiceAggregate.invoice,
          amountPaid: 0,
        };
        current.amountPaid = roundToTwoDecimals(
          current.amountPaid + plan.invoiceAggregate.amountPaid,
        );
        invoiceAggregates.set(plan.invoiceAggregate.invoiceId, current);
      }

      if (plan.accountEntry) {
        accountEntries.push(plan.accountEntry);
      }
    });

    if (!accountEntries.length) {
      throw new HttpsError(
        'failed-precondition',
        'No se pudo aplicar el pago a ninguna cuenta con balance pendiente.',
      );
    }

    const withholdingDoc = thirdPartyWithholding
      ? (() => {
          if (invoiceAggregates.size !== 1) {
            throw new HttpsError(
              'failed-precondition',
              'Las retenciones sufridas solo se pueden registrar cuando el cobro impacta una sola factura.',
            );
          }

          const [invoiceAggregate] = Array.from(invoiceAggregates.values());
          if (!invoiceAggregate?.invoice) {
            throw new HttpsError(
              'failed-precondition',
              'No se pudo resolver la factura asociada para registrar la retención sufrida.',
            );
          }

          return buildThirdPartyWithholdingDoc({
            businessId,
            paymentId,
            receiptId,
            paymentScope,
            paymentOption,
            clientId,
            arId,
            invoiceAggregate,
            withholding: thirdPartyWithholding,
            now,
          });
        })()
      : null;

    const change = roundToTwoDecimals(Math.max(remainingAmount, 0));
    const appliedAmount = roundToTwoDecimals(
      Math.max(appliedDocumentAmount - change, 0),
    );
    const functionalSettlements = allocateFunctionalAmountsByDocument({
      entries: accountEntries,
      totalFunctionalAmount: collectedFunctionalAmount,
      amountField: 'totalPaid',
    });
    const fxSettlements = [];
    const enrichedAccountEntries = accountEntries.map((entry, index) => {
      const settlementFunctionalAmount = roundToTwoDecimals(
        functionalSettlements[index] ?? 0,
      );
      const normalizedEntry = {
        ...entry,
        settlementFunctionalAmount,
        fxGainLossAmount: roundToTwoDecimals(
          settlementFunctionalAmount -
            roundToTwoDecimals(entry.historicalFunctionalSettled),
        ),
      };

      if (
        shouldTrackFxSettlement({
          accountMonetary: normalizedEntry.monetaryBefore,
          paymentMonetary: pilotMonetarySnapshot,
        })
      ) {
        const fxSettlement = buildReceivableFxSettlementRecord({
          businessId,
          paymentId,
          arId: normalizedEntry.arId,
          invoiceId: normalizedEntry.invoiceId,
          clientId,
          accountMonetaryBefore: normalizedEntry.monetaryBefore,
          accountMonetaryAfter: normalizedEntry.monetaryAfter,
          paymentMonetary: pilotMonetarySnapshot,
          appliedDocumentAmount: normalizedEntry.totalPaid,
          historicalFunctionalAmount:
            normalizedEntry.historicalFunctionalSettled ?? 0,
          settlementFunctionalAmount,
          occurredAt: now,
          createdAt: now,
          createdBy: authUid,
        });
        normalizedEntry.fxSettlementId = fxSettlement.id;
        fxSettlements.push(fxSettlement);
      }

      return normalizedEntry;
    });
    const payment = {
      ...basePayment,
      totalApplied: appliedAmount,
      totalCollected: collectedFunctionalAmount,
      unappliedAmount: change,
      accountEntries: enrichedAccountEntries,
      fxSettlementSummary: fxSettlements.length ? {
        settlementCount: fxSettlements.length,
        totalGainLossAmount: roundToTwoDecimals(
          fxSettlements.reduce(
            (sum, settlement) => sum + settlement.fxGainLossAmount,
            0,
          ),
        ),
        functionalCurrency:
          pilotMonetarySnapshot?.functionalCurrency?.code ?? null,
      } : null,
    };

    transaction.set(
      db.doc(`businesses/${businessId}/accountsReceivablePayments/${paymentId}`),
      payment,
    );
    if (withholdingDoc) {
      transaction.set(
        db.doc(
          `businesses/${businessId}/salesThirdPartyWithholdings/${withholdingDoc.id}`,
        ),
        withholdingDoc,
      );
    }
    if (appliedAmount > THRESHOLD) {
      transaction.set(
        clientRef,
        buildClientPendingBalanceUpdate({
          currentClientDoc: clientBalanceSnap.exists
            ? clientBalanceSnap.data()
            : null,
          delta: -appliedAmount,
        }),
        { merge: true },
      );
    }

    if (accountingRolloutEnabled) {
      const cashMovements = buildReceivablePaymentCashMovements({
        businessId,
        payment,
        paymentMethods,
        cashCountId: cashCountState.cashCountId,
        clientId,
        accountEntries: enrichedAccountEntries,
        createdAt: now,
        createdBy: authUid,
      });

      cashMovements.forEach((movement) => {
        transaction.set(
          db.doc(`businesses/${businessId}/cashMovements/${movement.id}`),
          movement,
        );
      });

      const accountingEvent = buildAccountingEvent({
        businessId,
        eventType: 'accounts_receivable.payment.recorded',
        sourceType: 'accountsReceivablePayment',
        sourceId: paymentId,
        sourceDocumentType: 'accountsReceivablePayment',
        sourceDocumentId: paymentId,
        counterpartyType: 'client',
        counterpartyId: clientId,
        currency: pilotMonetarySnapshot?.documentCurrency?.code ?? null,
        functionalCurrency:
          pilotMonetarySnapshot?.functionalCurrency?.code ?? null,
        monetary: {
          amount: appliedAmount,
          functionalAmount: collectedFunctionalAmount,
        },
        treasury: {
          cashCountId: cashCountState.cashCountId || null,
          bankAccountId: resolvePrimaryBankAccountId(paymentMethods),
          paymentChannel: resolveAccountingPaymentChannel(paymentMethods),
        },
        idempotencyKey,
        payload: {
          paymentScope,
          paymentOption: paymentOption || null,
          receiptNumber:
            toCleanString(payment?.receiptNumber) ??
            toCleanString(payment?.receiptId) ??
            null,
          reference:
            toCleanString(payment?.reference) ??
            toCleanString(payment?.referenceNumber) ??
            null,
          accountEntryCount: enrichedAccountEntries.length,
          fxSettlementCount: fxSettlements.length,
          unappliedAmount: change,
          paymentMethods: paymentMethods.map((method) => ({
            method: toCleanString(method?.method) || null,
            value: roundToTwoDecimals(method?.value),
            bankAccountId: toCleanString(method?.bankAccountId),
          })),
        },
        occurredAt: now,
        recordedAt: now,
        createdAt: now,
        createdBy: authUid,
      });

      transaction.set(
        db.doc(
          `businesses/${businessId}/accountingEvents/${accountingEvent.id}`,
        ),
        accountingEvent,
      );
    }
    fxSettlements.forEach((settlement) => {
      transaction.set(
        db.doc(
          `businesses/${businessId}/accountsReceivableFxSettlements/${settlement.id}`,
        ),
        settlement,
      );
    });

    invoiceAggregates.forEach(({ invoice, amountPaid }) => {
      const invoiceUpdate = buildInvoiceUpdate({
        invoice,
        amountPaid,
        paymentMethods,
        paymentId,
        now,
      });
      if (!invoiceUpdate) return;
      transaction.update(
        db.doc(`businesses/${businessId}/invoices/${invoiceUpdate.invoiceId}`),
        invoiceUpdate.payload,
      );
    });

    const receipt = buildReceiptDoc({
      receiptId,
      businessId,
      authUid,
      userDisplayName,
      client,
      clientId,
      payment,
      paymentMethods,
      accounts: enrichedAccountEntries,
      totalAmount: collectedFunctionalAmount,
      change,
      now,
    });
    transaction.set(
      db.doc(
        `businesses/${businessId}/accountsReceivablePaymentReceipt/${receipt.id}`,
      ),
      receipt,
    );
    transaction.set(idempotencyRef, {
      id: idempotencyKey,
      paymentId,
      receiptId: receipt.id,
      clientId,
      arId: arId || null,
      requestHash,
      createdAt: now,
      createdBy: authUid,
    });

    result = {
      ok: true,
      businessId,
      paymentId,
      receipt: sanitizeForResponse(receipt),
    };
  });

  return result;
});
