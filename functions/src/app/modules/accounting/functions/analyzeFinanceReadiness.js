import { https, logger } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
  getUserAccessProfile,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';

const ALL_BUSINESSES_SENTINEL = 'ALL';
const DEFAULT_DOCUMENT_LIMIT = 300;
const MAX_DOCUMENT_LIMIT = 1000;
const BUSINESS_LIMIT = 100;
const ISSUE_SAMPLE_LIMIT = 25;
const BANK_METHODS = new Set(['card', 'credit_card', 'debit_card', 'transfer', 'bank_transfer', 'check']);
const CASH_METHODS = new Set(['cash', 'open_cash']);
const COMPLETED_PURCHASE_STATUSES = new Set(['completed', 'delivered', 'posted']);
const VOID_STATUSES = new Set(['void', 'voided', 'canceled', 'cancelled']);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toUpperCleanString = (value) => toCleanString(value)?.toUpperCase() ?? null;

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toMillis = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
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
  const record = asRecord(value);
  const seconds =
    typeof record.seconds === 'number'
      ? record.seconds
      : typeof record._seconds === 'number'
        ? record._seconds
        : null;
  if (seconds == null) return null;
  return seconds * 1000;
};

const normalizeLimit = (value) => {
  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_DOCUMENT_LIMIT;
  return Math.min(parsed, MAX_DOCUMENT_LIMIT);
};

const normalizeMethodCode = (value) =>
  toCleanString(value)?.toLowerCase() ?? null;

const isBankMethod = (value) => BANK_METHODS.has(normalizeMethodCode(value));
const isCashMethod = (value) => CASH_METHODS.has(normalizeMethodCode(value));

const resolveBusinessName = (businessRecord, businessId) => {
  const business = asRecord(businessRecord.business);
  return (
    toCleanString(businessRecord.name) ??
    toCleanString(businessRecord.businessName) ??
    toCleanString(business.name) ??
    toCleanString(business.businessName) ??
    businessId
  );
};

const resolveStatus = (record) =>
  toCleanString(record.workflowStatus ?? record.status)?.toLowerCase() ?? null;

const resolvePurchaseTotal = (purchase) => {
  const monetary = asRecord(purchase.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  return (
    safeNumber(asRecord(purchase.paymentState).total) ??
    safeNumber(documentTotals.total ?? documentTotals.gross) ??
    safeNumber(purchase.totalAmount ?? purchase.total ?? purchase.amount) ??
    0
  );
};

const resolveCurrency = (record) => {
  const monetary = asRecord(record.monetary);
  const documentCurrency = asRecord(monetary.documentCurrency);
  return toUpperCleanString(
    documentCurrency.code ??
      monetary.currency ??
      record.currency ??
      record.documentCurrency,
  );
};

const resolveFunctionalCurrency = (settings) =>
  toUpperCleanString(settings.functionalCurrency) ?? 'DOP';

const resolvePaymentMethods = (record) => {
  const candidates = [
    record.paymentMethods,
    record.paymentMethod,
    asRecord(record.payment).paymentMethod,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate.map((entry) => asRecord(entry));
    }
  }

  const method = toCleanString(record.method ?? asRecord(record.payment).method);
  const amount = safeNumber(record.amount ?? record.totalAmount ?? record.value);
  return method
    ? [
        {
          method,
          amount,
          value: amount,
        },
      ]
    : [];
};

const resolveAccountingCutoverAt = (settings) => {
  const rollout = asRecord(settings.rollout);
  const financeRollout = asRecord(settings.financeRollout);
  return toMillis(
    financeRollout.cutoverAt ??
      rollout.cutoverAt ??
      settings.cutoverAt ??
      settings.accountingCutoverAt,
  );
};

const buildInitialModule = () => ({
  status: 'ready',
  metrics: {},
  issues: [],
});

const addIssue = (module, issue) => {
  module.status = issue.severity === 'blocker' ? 'blocked' : module.status;
  if (module.status !== 'blocked' && issue.severity === 'warning') {
    module.status = 'needs_preparation';
  }
  if (module.issues.length < ISSUE_SAMPLE_LIMIT) {
    module.issues.push(issue);
  }
};

const mergeBusinessStatus = (modules) => {
  const values = Object.values(modules).map((module) => module.status);
  if (values.includes('blocked')) return 'blocked';
  if (values.includes('needs_preparation')) return 'needs_preparation';
  return 'ready';
};

const fetchCollection = async (businessId, collectionName, maxDocuments) => {
  const snap = await db
    .collection(`businesses/${businessId}/${collectionName}`)
    .limit(maxDocuments)
    .get();
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...asRecord(docSnap.data()),
  }));
};

const fetchAccountingSettings = async (businessId) => {
  const snap = await db.doc(`businesses/${businessId}/settings/accounting`).get();
  return snap.exists ? asRecord(snap.data()) : {};
};

const buildEventIndex = (events) =>
  events.reduce((index, event) => {
    const eventType = toCleanString(event.eventType);
    const sourceId = toCleanString(event.sourceId ?? event.sourceDocumentId);
    if (eventType && sourceId) {
      index.add(`${eventType}:${sourceId}`);
    }
    return index;
  }, new Set());

const analyzeBusiness = async ({ businessId, businessRecord = {}, maxDocuments }) => {
  const [
    settings,
    purchases,
    vendorBills,
    accountsPayablePayments,
    accountsReceivablePayments,
    bankAccounts,
    cashCounts,
    cashMovements,
    accountingEvents,
    journalEntries,
    exchangeRates,
  ] = await Promise.all([
    fetchAccountingSettings(businessId),
    fetchCollection(businessId, 'purchases', maxDocuments),
    fetchCollection(businessId, 'vendorBills', maxDocuments),
    fetchCollection(businessId, 'accountsPayablePayments', maxDocuments),
    fetchCollection(businessId, 'accountsReceivablePayments', maxDocuments),
    fetchCollection(businessId, 'bankAccounts', maxDocuments),
    fetchCollection(businessId, 'cashCounts', maxDocuments),
    fetchCollection(businessId, 'cashMovements', maxDocuments),
    fetchCollection(businessId, 'accountingEvents', maxDocuments),
    fetchCollection(businessId, 'journalEntries', maxDocuments),
    fetchCollection(businessId, 'exchangeRates', maxDocuments),
  ]);

  const modules = {
    cxp: buildInitialModule(),
    treasury: buildInitialModule(),
    currency: buildInitialModule(),
    accounting: buildInitialModule(),
  };
  const functionalCurrency = resolveFunctionalCurrency(settings);
  const accountingCutoverAt = resolveAccountingCutoverAt(settings);
  const vendorBillIds = new Set(vendorBills.map((bill) => bill.id));
  const activeBankAccountIds = new Set(
    bankAccounts
      .filter((bankAccount) => {
        const status = resolveStatus(bankAccount);
        return !status || status === 'active';
      })
      .map((bankAccount) => bankAccount.id),
  );
  const cashCountIds = new Set(cashCounts.map((cashCount) => cashCount.id));
  const eventIndex = buildEventIndex(accountingEvents);

  const completedPurchases = purchases.filter((purchase) => {
    const status = resolveStatus(purchase);
    return status ? COMPLETED_PURCHASE_STATUSES.has(status) : false;
  });

  modules.cxp.metrics = {
    purchases: purchases.length,
    completedPurchases: completedPurchases.length,
    vendorBills: vendorBills.length,
    accountsPayablePayments: accountsPayablePayments.length,
  };

  completedPurchases.forEach((purchase) => {
    const canonicalVendorBillId = `purchase:${purchase.id}`;
    if (!vendorBillIds.has(canonicalVendorBillId)) {
      addIssue(modules.cxp, {
        severity: 'warning',
        code: 'purchase_missing_vendor_bill',
        message: 'Compra completada sin CxP materializada.',
        collection: 'purchases',
        documentId: purchase.id,
      });
    }

    const supplierId =
      toCleanString(purchase.supplierId) ??
      toCleanString(purchase.providerId) ??
      toCleanString(asRecord(purchase.provider).id);
    if (!supplierId) {
      addIssue(modules.cxp, {
        severity: 'blocker',
        code: 'purchase_missing_supplier',
        message: 'Compra no tiene suplidor resoluble.',
        collection: 'purchases',
        documentId: purchase.id,
      });
    }

    if (resolvePurchaseTotal(purchase) <= 0) {
      addIssue(modules.cxp, {
        severity: 'blocker',
        code: 'purchase_invalid_total',
        message: 'Compra completada tiene total inválido.',
        collection: 'purchases',
        documentId: purchase.id,
      });
    }

    if (!asRecord(purchase.paymentState).status) {
      addIssue(modules.cxp, {
        severity: 'warning',
        code: 'purchase_missing_payment_state',
        message: 'Compra completada no tiene estado CxP normalizado.',
        collection: 'purchases',
        documentId: purchase.id,
      });
    }
  });

  modules.treasury.metrics = {
    bankAccounts: bankAccounts.length,
    activeBankAccounts: activeBankAccountIds.size,
    cashCounts: cashCounts.length,
    cashMovements: cashMovements.length,
  };

  [...accountsPayablePayments, ...accountsReceivablePayments].forEach((payment) => {
    if (VOID_STATUSES.has(resolveStatus(payment))) return;
    const paymentMethods = resolvePaymentMethods(payment);
    paymentMethods.forEach((method, index) => {
      const methodCode = normalizeMethodCode(method.method);
      const bankAccountId = toCleanString(method.bankAccountId ?? payment.bankAccountId);
      const cashCountId = toCleanString(method.cashCountId ?? payment.cashCountId);
      const cashAccountId = toCleanString(method.cashAccountId ?? payment.cashAccountId);
      if (isBankMethod(methodCode) && !bankAccountId) {
        addIssue(modules.treasury, {
          severity: 'blocker',
          code: 'payment_bank_method_missing_bank_account',
          message: 'Pago con método bancario no tiene cuenta bancaria.',
          collection: payment.purchaseId ? 'accountsPayablePayments' : 'accountsReceivablePayments',
          documentId: payment.id,
          methodIndex: index,
        });
      }
      if (bankAccountId && !activeBankAccountIds.has(bankAccountId)) {
        addIssue(modules.treasury, {
          severity: 'warning',
          code: 'payment_bank_account_inactive_or_missing',
          message: 'Pago apunta a cuenta bancaria inexistente o inactiva.',
          collection: payment.purchaseId ? 'accountsPayablePayments' : 'accountsReceivablePayments',
          documentId: payment.id,
          methodIndex: index,
        });
      }
      if (isCashMethod(methodCode) && !cashCountId && !cashAccountId) {
        addIssue(modules.treasury, {
          severity: 'warning',
          code: 'payment_cash_method_missing_cash_destination',
          message: 'Pago en efectivo no tiene cuadre ni cuenta de caja.',
          collection: payment.purchaseId ? 'accountsPayablePayments' : 'accountsReceivablePayments',
          documentId: payment.id,
          methodIndex: index,
        });
      }
      if (cashCountId && !cashCountIds.has(cashCountId)) {
        addIssue(modules.treasury, {
          severity: 'warning',
          code: 'payment_cash_count_missing',
          message: 'Pago apunta a cuadre de caja no encontrado en muestra.',
          collection: payment.purchaseId ? 'accountsPayablePayments' : 'accountsReceivablePayments',
          documentId: payment.id,
          methodIndex: index,
        });
      }
    });
  });

  cashMovements.forEach((movement) => {
    if (VOID_STATUSES.has(resolveStatus(movement))) return;
    if (
      (movement.impactsBankLedger === true || isBankMethod(movement.method)) &&
      !toCleanString(movement.bankAccountId)
    ) {
      addIssue(modules.treasury, {
        severity: 'blocker',
        code: 'cash_movement_missing_bank_account',
        message: 'Movimiento bancario no tiene bankAccountId.',
        collection: 'cashMovements',
        documentId: movement.id,
      });
    }
    if (
      (movement.impactsCashDrawer === true || isCashMethod(movement.method)) &&
      !toCleanString(movement.cashCountId) &&
      !toCleanString(movement.cashAccountId)
    ) {
      addIssue(modules.treasury, {
        severity: 'warning',
        code: 'cash_movement_missing_cash_destination',
        message: 'Movimiento de caja no tiene cashCountId ni cashAccountId.',
        collection: 'cashMovements',
        documentId: movement.id,
      });
    }
  });

  const monetaryDocuments = [
    ...completedPurchases.map((record) => ({ collection: 'purchases', record })),
    ...accountsPayablePayments.map((record) => ({
      collection: 'accountsPayablePayments',
      record,
    })),
    ...accountsReceivablePayments.map((record) => ({
      collection: 'accountsReceivablePayments',
      record,
    })),
  ];

  modules.currency.metrics = {
    functionalCurrency,
    exchangeRates: exchangeRates.length,
    monetaryDocuments: monetaryDocuments.length,
  };

  monetaryDocuments.forEach(({ collection, record }) => {
    const currency = resolveCurrency(record);
    if (!record.monetary) {
      addIssue(modules.currency, {
        severity: 'warning',
        code: 'document_missing_monetary_snapshot',
        message: 'Documento financiero no tiene snapshot monetary.',
        collection,
        documentId: record.id,
      });
      return;
    }
    if (
      currency &&
      currency !== functionalCurrency &&
      !record.exchangeRateSnapshot &&
      !asRecord(record.monetary).exchangeRateSnapshot
    ) {
      addIssue(modules.currency, {
        severity: 'blocker',
        code: 'foreign_currency_missing_exchange_rate',
        message: 'Documento en moneda extranjera no tiene tasa capturada.',
        collection,
        documentId: record.id,
      });
    }
  });

  modules.accounting.metrics = {
    accountingEvents: accountingEvents.length,
    journalEntries: journalEntries.length,
    cutoverAt: accountingCutoverAt,
  };

  accountingEvents.forEach((event) => {
    const projection = asRecord(event.projection);
    const status = toCleanString(projection.status ?? event.projectionStatus);
    if (status === 'failed' || status === 'error') {
      addIssue(modules.accounting, {
        severity: 'blocker',
        code: 'accounting_event_projection_failed',
        message: 'Evento contable tiene proyección fallida.',
        collection: 'accountingEvents',
        documentId: event.id,
      });
    }
  });

  if (accountingCutoverAt) {
    completedPurchases.forEach((purchase) => {
      const occurredAt = toMillis(
        purchase.completedAt ?? purchase.updatedAt ?? purchase.createdAt,
      );
      if (
        occurredAt &&
        occurredAt >= accountingCutoverAt &&
        !eventIndex.has(`purchase.committed:${purchase.id}`)
      ) {
        addIssue(modules.accounting, {
          severity: 'warning',
          code: 'purchase_after_cutover_missing_accounting_event',
          message: 'Compra posterior al corte no tiene evento contable.',
          collection: 'purchases',
          documentId: purchase.id,
        });
      }
    });

    accountsPayablePayments.forEach((payment) => {
      const occurredAt = toMillis(
        payment.occurredAt ?? payment.createdAt ?? payment.updatedAt,
      );
      if (
        occurredAt &&
        occurredAt >= accountingCutoverAt &&
        !eventIndex.has(`accounts_payable.payment.recorded:${payment.id}`)
      ) {
        addIssue(modules.accounting, {
          severity: 'warning',
          code: 'payable_payment_after_cutover_missing_accounting_event',
          message: 'Pago CxP posterior al corte no tiene evento contable.',
          collection: 'accountsPayablePayments',
          documentId: payment.id,
        });
      }
    });
  }

  const status = mergeBusinessStatus(modules);
  const issueCounts = Object.values(modules).reduce(
    (counts, module) => {
      module.issues.forEach((issue) => {
        if (issue.severity === 'blocker') counts.blockers += 1;
        if (issue.severity === 'warning') counts.warnings += 1;
      });
      return counts;
    },
    { blockers: 0, warnings: 0 },
  );

  return {
    businessId,
    businessName: resolveBusinessName(businessRecord, businessId),
    status,
    issueCounts,
    modules,
  };
};

const resolveRequestedBusinessIds = async ({ businessId, allBusinesses }) => {
  const requestedBusinessId = toCleanString(businessId);
  const requestedAll =
    Boolean(allBusinesses) ||
    requestedBusinessId?.toUpperCase() === ALL_BUSINESSES_SENTINEL;

  if (!requestedBusinessId && !requestedAll) {
    throw new https.HttpsError('invalid-argument', 'businessId es requerido.');
  }

  if (!requestedAll) {
    const snap = await db.doc(`businesses/${requestedBusinessId}`).get();
    return [
      {
        id: requestedBusinessId,
        data: snap.exists ? asRecord(snap.data()) : {},
      },
    ];
  }

  const snap = await db.collection('businesses').limit(BUSINESS_LIMIT).get();
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    data: asRecord(docSnap.data()),
  }));
};

const assertReadAccess = async ({ authUid, businessIds, allBusinesses }) => {
  if (allBusinesses) {
    const profile = await getUserAccessProfile(authUid);
    if (!profile.userSnap?.exists || !profile.hasGlobalUnscopedAccess) {
      throw new https.HttpsError(
        'permission-denied',
        'Solo usuarios dev pueden analizar todos los negocios.',
      );
    }
    return;
  }

  await assertUserAccess({
    authUid,
    businessId: businessIds[0],
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
  });
};

export const analyzeFinanceReadiness = https.onCall(async (data, context) => {
  const authUid = context?.auth?.uid;
  if (!authUid) {
    throw new https.HttpsError('unauthenticated', 'Usuario no autenticado.');
  }

  const maxDocuments = normalizeLimit(data?.maxDocuments);
  const requestedAll =
    Boolean(data?.allBusinesses) ||
    toCleanString(data?.businessId)?.toUpperCase() === ALL_BUSINESSES_SENTINEL;
  const businesses = await resolveRequestedBusinessIds({
    businessId: data?.businessId,
    allBusinesses: requestedAll,
  });
  const businessIds = businesses.map((business) => business.id);

  await assertReadAccess({
    authUid,
    businessIds,
    allBusinesses: requestedAll,
  });

  const businessResults = [];
  for (const business of businesses) {
    try {
      businessResults.push(
        await analyzeBusiness({
          businessId: business.id,
          businessRecord: business.data,
          maxDocuments,
        }),
      );
    } catch (error) {
      logger.warn('Finance readiness analysis failed for business', {
        businessId: business.id,
        error: error?.message || String(error),
      });
      businessResults.push({
        businessId: business.id,
        businessName: resolveBusinessName(business.data, business.id),
        status: 'blocked',
        issueCounts: { blockers: 1, warnings: 0 },
        modules: {
          cxp: {
            ...buildInitialModule(),
            status: 'blocked',
            issues: [
              {
                severity: 'blocker',
                code: 'analysis_failed',
                message: error?.message || String(error),
              },
            ],
          },
          treasury: buildInitialModule(),
          currency: buildInitialModule(),
          accounting: buildInitialModule(),
        },
      });
    }
  }

  const summary = businessResults.reduce(
    (accumulator, result) => {
      accumulator[result.status] += 1;
      accumulator.blockers += result.issueCounts.blockers;
      accumulator.warnings += result.issueCounts.warnings;
      return accumulator;
    },
    {
      ready: 0,
      needs_preparation: 0,
      blocked: 0,
      blockers: 0,
      warnings: 0,
    },
  );

  return {
    status: 'done',
    mode: 'read-only',
    runId: `finance-readiness-${Date.now()}`,
    createdAt: Date.now(),
    maxDocuments,
    businessIds,
    summary,
    businessResults,
  };
});
