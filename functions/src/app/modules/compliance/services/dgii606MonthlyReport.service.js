import { db } from '../../../core/config/firebase.js';
import { validateDgiiMonthlyReportDataset } from './dgiiMonthlyReportValidation.service.js';

const PERIOD_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const EXCLUDED_DGII_606_STATUSES = new Set([
  'cancelled',
  'canceled',
  'void',
  'voided',
  'annulled',
  'annulado',
  'deleted',
  'inactive',
  'disabled',
  'draft',
]);

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
  }
  return null;
};

const toDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value?.toDate === 'function') {
    const normalized = value.toDate();
    return normalized instanceof Date && !Number.isNaN(normalized.getTime())
      ? normalized
      : null;
  }

  if (typeof value?.toMillis === 'function') {
    const millis = value.toMillis();
    if (typeof millis === 'number' && Number.isFinite(millis)) {
      return new Date(millis);
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value);
  }

  if (typeof value === 'string' && value.trim().length) {
    const normalized = new Date(value);
    return Number.isNaN(normalized.getTime()) ? null : normalized;
  }

  if (isRecord(value) && typeof value.seconds === 'number') {
    const milliseconds =
      value.seconds * 1000 +
      Math.floor((Number(value.nanoseconds) || 0) / 1000000);
    const normalized = new Date(milliseconds);
    return Number.isNaN(normalized.getTime()) ? null : normalized;
  }

  return null;
};

const shouldExcludeFromDgii606 = (status) => {
  const normalizedStatus = toCleanString(status)?.toLowerCase() ?? null;
  if (!normalizedStatus) return false;
  return EXCLUDED_DGII_606_STATUSES.has(normalizedStatus);
};

const splitDgii606Records = (records = []) =>
  records.reduce(
    (acc, record) => {
      if (shouldExcludeFromDgii606(record?.status)) {
        acc.excluded.push(record);
        return acc;
      }

      acc.included.push(record);
      return acc;
    },
    { included: [], excluded: [] },
  );

const resolveMonthlyPeriodRange = (periodKey) => {
  const normalizedPeriodKey = toCleanString(periodKey);
  if (!normalizedPeriodKey || !PERIOD_KEY_REGEX.test(normalizedPeriodKey)) {
    throw new Error(`Período mensual inválido: ${periodKey}`);
  }

  const [yearString, monthString] = normalizedPeriodKey.split('-');
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;

  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));

  return {
    periodKey: normalizedPeriodKey,
    start,
    endExclusive,
  };
};

const buildIssueSummary = (issues) =>
  issues.reduce(
    (summary, issue) => {
      const severity = toCleanString(issue?.severity) ?? 'unknown';
      const sourceId = toCleanString(issue?.sourceId) ?? 'unknown';
      const code = toCleanString(issue?.code) ?? 'unknown';

      summary.total += 1;
      summary.bySeverity[severity] = (summary.bySeverity[severity] ?? 0) + 1;
      summary.bySource[sourceId] = (summary.bySource[sourceId] ?? 0) + 1;
      summary.byCode[code] = (summary.byCode[code] ?? 0) + 1;

      return summary;
    },
    {
      total: 0,
      bySeverity: {},
      bySource: {},
      byCode: {},
    },
  );

const buildSourceRecordsSnapshot = (records = []) =>
  records.map((record, index) => ({
    index,
    recordId: record?.metadata?.recordId ?? null,
    sourcePath: record?.metadata?.sourcePath ?? null,
    documentNumber: record?.documentNumber ?? null,
    documentFiscalNumber: record?.taxReceipt?.ncf ?? null,
    purchaseId: record?.purchaseId ?? null,
    supplierId: record?.supplierId ?? record?.counterparty?.id ?? null,
    counterpartyIdentificationNumber:
      record?.counterparty?.identification?.number ?? null,
    documentType: record?.documentType ?? null,
    expenseType:
      record?.classification?.dgii606ExpenseType ?? record?.expenseType ?? null,
    total: record?.totals?.total ?? null,
    itbisTotal: record?.taxBreakdown?.itbisTotal ?? null,
    issuedAt: record?.issuedAt ?? record?.occurredAt ?? null,
    status: record?.status ?? null,
  }));

const enrichIssues = (issues, datasets) =>
  issues.map((issue) => {
    const records = Array.isArray(datasets?.[issue.sourceId])
      ? datasets[issue.sourceId]
      : [];
    const record = records[issue.index] ?? null;
    const metadata = isRecord(record?.metadata) ? record.metadata : null;

    if (!metadata) return issue;

    return {
      ...issue,
      recordId: metadata.recordId ?? null,
      sourcePath: metadata.sourcePath ?? null,
      documentNumber: record?.documentNumber ?? null,
      documentFiscalNumber: record?.taxReceipt?.ncf ?? null,
    };
  });

const resolvePurchasePayload = (purchaseDoc) =>
  isRecord(purchaseDoc?.data) ? purchaseDoc.data : purchaseDoc;

const resolveExpensePayload = (expenseDoc) =>
  isRecord(expenseDoc?.data) ? expenseDoc.data : expenseDoc;

const resolvePaymentPayload = (paymentDoc) =>
  isRecord(paymentDoc?.data) ? paymentDoc.data : paymentDoc;

const resolveCounterpartySource = (record) => {
  if (isRecord(record?.provider?.provider)) return record.provider.provider;
  if (isRecord(record?.supplier?.provider)) return record.supplier.provider;
  if (isRecord(record?.counterparty?.provider)) {
    return record.counterparty.provider;
  }
  if (isRecord(record?.provider)) return record.provider;
  if (isRecord(record?.supplier)) return record.supplier;
  if (isRecord(record?.counterparty)) return record.counterparty;
  return {};
};

const resolveCounterpartyId = (record) =>
  toCleanString(record?.supplierId) ??
  toCleanString(record?.providerId) ??
  toCleanString(record?.provider?.id) ??
  toCleanString(record?.provider?.provider?.id) ??
  toCleanString(record?.supplier?.id) ??
  toCleanString(record?.supplier?.provider?.id) ??
  toCleanString(record?.counterparty?.id) ??
  toCleanString(record?.provider) ??
  toCleanString(record?.supplier) ??
  null;

const resolveCounterpartyIdentificationNumber = (record) => {
  const supplier = resolveCounterpartySource(record);

  return (
    toCleanString(supplier?.rnc) ??
    toCleanString(supplier?.RNC) ??
    toCleanString(supplier?.identification?.number) ??
    toCleanString(supplier?.identificationNumber) ??
    toCleanString(supplier?.taxId) ??
    toCleanString(supplier?.personalID) ??
    toCleanString(supplier?.personalId) ??
    null
  );
};

const mergeCounterpartyProfile = (record, profile) => {
  if (!profile) return record;

  const counterpartyId = record?.counterparty?.id ?? resolveCounterpartyId(profile);
  const currentIdentification = toCleanString(
    record?.counterparty?.identification?.number,
  );
  const profileIdentification = resolveCounterpartyIdentificationNumber(profile);

  if (currentIdentification || !profileIdentification) {
    return {
      ...record,
      counterparty: {
        ...(isRecord(record?.counterparty) ? record.counterparty : {}),
        id: counterpartyId ?? null,
        identification: {
          ...(isRecord(record?.counterparty?.identification)
            ? record.counterparty.identification
            : {}),
          number: currentIdentification ?? null,
        },
      },
      supplierId: record?.supplierId ?? counterpartyId ?? null,
    };
  }

  return {
    ...record,
    counterparty: {
      ...(isRecord(record?.counterparty) ? record.counterparty : {}),
      id: counterpartyId ?? null,
      identification: {
        ...(isRecord(record?.counterparty?.identification)
          ? record.counterparty.identification
          : {}),
        number: profileIdentification,
      },
    },
    supplierId: record?.supplierId ?? counterpartyId ?? null,
  };
};

const resolvePurchaseIssuedAt = (purchaseData) =>
  toDate(purchaseData?.completedAt) ??
  toDate(purchaseData?.createdAt) ??
  toDate(purchaseData?.dates?.paymentDate) ??
  toDate(purchaseData?.dates?.deliveryDate);

const resolveExpenseIssuedAt = (expenseData) =>
  toDate(expenseData?.expenseDate) ??
  toDate(expenseData?.dates?.expenseDate) ??
  toDate(expenseData?.createdAt);

const resolvePurchaseDocumentType = (purchaseData) => {
  const explicitType =
    toCleanString(purchaseData?.documentType) ??
    toCleanString(purchaseData?.financialType) ??
    toCleanString(purchaseData?.purchaseNature);

  if (explicitType) return explicitType;

  return Array.isArray(purchaseData?.replenishments) &&
    purchaseData.replenishments.length
    ? 'inventory'
    : null;
};

export const mapPurchaseDocToDgii606Record = ({
  businessId,
  purchaseId,
  purchaseDoc,
}) => {
  const purchaseData = resolvePurchasePayload(purchaseDoc);
  const issuedAt = resolvePurchaseIssuedAt(purchaseData);
  const supplierId = resolveCounterpartyId(purchaseData);
  const ncf =
    toCleanString(purchaseData?.taxReceipt?.ncf) ??
    toCleanString(purchaseData?.invoice?.ncf) ??
    toCleanString(purchaseData?.proofOfPurchase) ??
    toCleanString(purchaseData?.ncf) ??
    null;
  const total =
    toFiniteNumber(purchaseData?.totals?.total) ??
    toFiniteNumber(purchaseData?.totalAmount) ??
    toFiniteNumber(purchaseData?.paymentState?.total) ??
    toFiniteNumber(purchaseData?.monetary?.totalAmount);
  const itbisTotal =
    toFiniteNumber(purchaseData?.taxBreakdown?.itbisTotal) ??
    toFiniteNumber(purchaseData?.totals?.tax) ??
    toFiniteNumber(purchaseData?.totalTaxes?.value) ??
    0;
  const documentType = resolvePurchaseDocumentType(purchaseData);
  const expenseType =
    toCleanString(purchaseData?.classification?.dgii606ExpenseType) ??
    toCleanString(purchaseData?.expenseType) ??
    null;
  const status =
    toCleanString(purchaseData?.workflowStatus) ??
    toCleanString(purchaseData?.status) ??
    null;

  return {
    businessId,
    issuedAt: issuedAt?.toISOString() ?? null,
    documentNumber:
      toCleanString(purchaseData?.numberId) ??
      toCleanString(purchaseData?.id) ??
      toCleanString(purchaseId),
    counterparty: {
      id: supplierId,
      identification: {
        number: resolveCounterpartyIdentificationNumber(purchaseData),
      },
    },
    supplierId,
    documentType,
    taxReceipt: {
      ncf,
    },
    totals: {
      total,
    },
    taxBreakdown: {
      itbisTotal,
    },
    classification: {
      dgii606ExpenseType: expenseType,
    },
    status,
    metadata: {
      recordId: purchaseId,
      sourcePath: `businesses/${businessId}/purchases/${purchaseId}`,
      issuedAtSource: issuedAt?.toISOString() ?? null,
    },
  };
};

export const mapExpenseDocToDgii606Record = ({
  businessId,
  expenseId,
  expenseDoc,
}) => {
  const expenseData = resolveExpensePayload(expenseDoc);
  const issuedAt = resolveExpenseIssuedAt(expenseData);
  const supplierId = resolveCounterpartyId(expenseData);
  const ncf =
    toCleanString(expenseData?.taxReceipt?.ncf) ??
    toCleanString(expenseData?.invoice?.ncf) ??
    toCleanString(expenseData?.ncf) ??
    null;
  const total =
    toFiniteNumber(expenseData?.totals?.total) ??
    toFiniteNumber(expenseData?.amount) ??
    toFiniteNumber(expenseData?.totalAmount);
  const itbisTotal =
    toFiniteNumber(expenseData?.taxBreakdown?.itbisTotal) ??
    toFiniteNumber(expenseData?.totals?.tax) ??
    toFiniteNumber(expenseData?.itbisTotal) ??
    0;
  const expenseType =
    toCleanString(expenseData?.classification?.dgii606ExpenseType) ??
    toCleanString(expenseData?.expenseType) ??
    toCleanString(expenseData?.categoryId) ??
    toCleanString(expenseData?.category) ??
    null;
  const status = toCleanString(expenseData?.status) ?? null;

  return {
    businessId,
    issuedAt: issuedAt?.toISOString() ?? null,
    documentNumber:
      toCleanString(expenseData?.number) ??
      toCleanString(expenseData?.numberId) ??
      toCleanString(expenseData?.id) ??
      toCleanString(expenseId),
    counterparty: {
      id: supplierId,
      identification: {
        number: resolveCounterpartyIdentificationNumber(expenseData),
      },
    },
    expenseType,
    taxReceipt: {
      ncf,
    },
    totals: {
      total,
    },
    taxBreakdown: {
      itbisTotal,
    },
    classification: {
      dgii606ExpenseType: expenseType,
    },
    status,
    metadata: {
      recordId: expenseId,
      sourcePath: `businesses/${businessId}/expenses/${expenseId}`,
      issuedAtSource: issuedAt?.toISOString() ?? null,
    },
  };
};

export const mapAccountsPayablePaymentDocToDgii606Record = ({
  businessId,
  paymentId,
  paymentDoc,
}) => {
  const paymentData = resolvePaymentPayload(paymentDoc);
  const occurredAt = toDate(paymentData?.occurredAt);
  const status = toCleanString(paymentData?.status) ?? null;

  return {
    purchaseId:
      toCleanString(paymentData?.purchaseId) ??
      toCleanString(paymentData?.metadata?.purchaseId) ??
      null,
    occurredAt: occurredAt?.toISOString() ?? null,
    paymentMethods: Array.isArray(paymentData?.paymentMethods)
      ? paymentData.paymentMethods
      : [],
    paymentStateSnapshot: isRecord(paymentData?.paymentStateSnapshot)
      ? paymentData.paymentStateSnapshot
      : null,
    metadata: {
      recordId: paymentId,
      sourcePath: `businesses/${businessId}/accountsPayablePayments/${paymentId}`,
      appliedCreditNotes: Array.isArray(
        paymentData?.metadata?.appliedCreditNotes,
      )
        ? paymentData.metadata.appliedCreditNotes
        : [],
    },
    status,
  };
};

const toRecordPeriodKey = (record) => {
  const issuedAt =
    toCleanString(record?.issuedAt) ?? toCleanString(record?.occurredAt);
  return issuedAt?.slice(0, 7) ?? null;
};

const loadProviderProfilesById = async ({ businessId, records, firestore }) => {
  const providerIds = Array.from(
    new Set(
      records
        .map((record) => resolveCounterpartyId(record))
        .filter(Boolean),
    ),
  );

  if (!providerIds.length || typeof firestore?.doc !== 'function') {
    return {
      providerProfilesById: {},
      sourceSnapshot: {
        recordsRequested: providerIds.length,
        recordsResolved: 0,
        recordsMissing: providerIds.length,
      },
    };
  }

  const loadedEntries = await Promise.all(
    providerIds.map(async (providerId) => {
      const ref = firestore.doc(
        `businesses/${businessId}/providers/${providerId}`,
      );
      const snap = await ref.get();
      if (!snap?.exists) {
        return {
          providerId,
          exists: false,
          record: null,
        };
      }

      return {
        providerId,
        exists: true,
        record: snap.data(),
      };
    }),
  );

  const providerProfilesById = Object.fromEntries(
    loadedEntries
      .filter((entry) => entry.exists && entry.record)
      .map((entry) => [entry.providerId, entry.record]),
  );
  const recordsResolved = loadedEntries.filter((entry) => entry.exists).length;

  return {
    providerProfilesById,
    sourceSnapshot: {
      recordsRequested: providerIds.length,
      recordsResolved,
      recordsMissing: providerIds.length - recordsResolved,
    },
  };
};

const enrichRecordsWithProviderProfiles = (records, providerProfilesById) =>
  records.map((record) => {
    const providerId = resolveCounterpartyId(record);
    const providerProfile = providerId ? providerProfilesById[providerId] : null;
    return mergeCounterpartyProfile(record, providerProfile);
  });

const loadLinkedPurchasesById = async ({ businessId, payments, firestore }) => {
  const purchaseIds = Array.from(
    new Set(
      payments
        .map((record) => toCleanString(record?.purchaseId))
        .filter(Boolean),
    ),
  );

  if (!purchaseIds.length || typeof firestore?.doc !== 'function') {
    return {
      linkedPurchasesById: {},
      sourceSnapshot: {
        recordsRequested: purchaseIds.length,
        recordsResolved: 0,
        recordsMissing: purchaseIds.length,
      },
    };
  }

  const loadedEntries = await Promise.all(
    purchaseIds.map(async (purchaseId) => {
      const ref = firestore.doc(
        `businesses/${businessId}/purchases/${purchaseId}`,
      );
      const snap = await ref.get();
      if (!snap?.exists) {
        return {
          purchaseId,
          exists: false,
          sourcePath: ref.path,
          record: null,
        };
      }

      return {
        purchaseId,
        exists: true,
        sourcePath: ref.path,
        record: mapPurchaseDocToDgii606Record({
          businessId,
          purchaseId,
          purchaseDoc: snap.data(),
        }),
      };
    }),
  );

  const linkedPurchasesById = Object.fromEntries(
    loadedEntries.map((entry) => [entry.purchaseId, entry]),
  );
  const recordsResolved = loadedEntries.filter((entry) => entry.exists).length;

  return {
    linkedPurchasesById,
    sourceSnapshot: {
      recordsRequested: purchaseIds.length,
      recordsResolved,
      recordsMissing: purchaseIds.length - recordsResolved,
    },
  };
};

const buildPaymentCrossReferenceIssues = ({
  payments,
  linkedPurchasesById,
  periodKey,
}) =>
  payments.flatMap((payment, index) => {
    const purchaseId = toCleanString(payment?.purchaseId);
    if (!purchaseId) return [];

    const linkedPurchase = linkedPurchasesById[purchaseId];
    if (!linkedPurchase?.exists || !linkedPurchase.record) {
      return [
        {
          sourceId: 'accountsPayablePayments',
          index,
          fieldPath: 'purchaseId',
          code: 'linked-purchase-not-found',
          severity: 'error',
          linkedRecordId: purchaseId,
          linkedSourcePath: linkedPurchase?.sourcePath ?? null,
        },
      ];
    }

    const linkedPurchasePeriodKey = toRecordPeriodKey(linkedPurchase.record);
    if (linkedPurchasePeriodKey && linkedPurchasePeriodKey !== periodKey) {
      return [
        {
          sourceId: 'accountsPayablePayments',
          index,
          fieldPath: 'purchaseId',
          code: 'linked-purchase-out-of-period',
          severity: 'warning',
          linkedRecordId: purchaseId,
          linkedSourcePath: linkedPurchase.sourcePath,
          linkedPeriodKey: linkedPurchasePeriodKey,
        },
      ];
    }

    return [];
  });

export const buildDgii606ValidationPreview = async ({
  businessId,
  periodKey,
  firestore = db,
}) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new Error('businessId es requerido para validar DGII_606');
  }

  const {
    periodKey: normalizedPeriodKey,
    start,
    endExclusive,
  } = resolveMonthlyPeriodRange(periodKey);

  const purchasesRef = firestore.collection(
    `businesses/${normalizedBusinessId}/purchases`,
  );
  const expensesRef = firestore.collection(
    `businesses/${normalizedBusinessId}/expenses`,
  );
  const paymentsRef = firestore.collection(
    `businesses/${normalizedBusinessId}/accountsPayablePayments`,
  );

  const [purchasesSnap, expensesSnap, paymentsSnap] = await Promise.all([
    purchasesRef
      .where('completedAt', '>=', start)
      .where('completedAt', '<', endExclusive)
      .orderBy('completedAt', 'asc')
      .get(),
    expensesRef
      .where('expenseDate', '>=', start)
      .where('expenseDate', '<', endExclusive)
      .orderBy('expenseDate', 'asc')
      .get(),
    paymentsRef
      .where('occurredAt', '>=', start)
      .where('occurredAt', '<', endExclusive)
      .orderBy('occurredAt', 'asc')
      .get(),
  ]);

  const purchaseRecords = splitDgii606Records(
    purchasesSnap.docs.map((doc) =>
      mapPurchaseDocToDgii606Record({
        businessId: normalizedBusinessId,
        purchaseId: doc.id,
        purchaseDoc: doc.data(),
      }),
    ),
  );
  const expenseRecords = splitDgii606Records(
    expensesSnap.docs.map((doc) =>
      mapExpenseDocToDgii606Record({
        businessId: normalizedBusinessId,
        expenseId: doc.id,
        expenseDoc: doc.data(),
      }),
    ),
  );
  const paymentRecords = splitDgii606Records(
    paymentsSnap.docs.map((doc) =>
      mapAccountsPayablePaymentDocToDgii606Record({
        businessId: normalizedBusinessId,
        paymentId: doc.id,
        paymentDoc: doc.data(),
      }),
    ),
  );

  const {
    providerProfilesById,
    sourceSnapshot: providerProfilesSnapshot,
  } = await loadProviderProfilesById({
    businessId: normalizedBusinessId,
    records: [
      ...purchaseRecords.included,
      ...purchaseRecords.excluded,
      ...expenseRecords.included,
      ...expenseRecords.excluded,
    ],
    firestore,
  });

  const datasets = {
    purchases: enrichRecordsWithProviderProfiles(
      purchaseRecords.included,
      providerProfilesById,
    ),
    expenses: enrichRecordsWithProviderProfiles(
      expenseRecords.included,
      providerProfilesById,
    ),
    accountsPayablePayments: paymentRecords.included,
  };
  const excludedRecords = {
    purchases: enrichRecordsWithProviderProfiles(
      purchaseRecords.excluded,
      providerProfilesById,
    ),
    expenses: enrichRecordsWithProviderProfiles(
      expenseRecords.excluded,
      providerProfilesById,
    ),
    accountsPayablePayments: paymentRecords.excluded,
  };

  const { linkedPurchasesById, sourceSnapshot: linkedPurchasesSnapshot } =
    await loadLinkedPurchasesById({
      businessId: normalizedBusinessId,
      payments: datasets.accountsPayablePayments,
      firestore,
    });

  const validation = validateDgiiMonthlyReportDataset({
    reportCode: 'DGII_606',
    datasets,
  });
  const crossReferenceIssues = buildPaymentCrossReferenceIssues({
    payments: datasets.accountsPayablePayments,
    linkedPurchasesById,
    periodKey: normalizedPeriodKey,
  });
  const issues = enrichIssues(
    [...validation.issues, ...crossReferenceIssues],
    datasets,
  );

  return {
    ...validation,
    businessId: normalizedBusinessId,
    periodKey: normalizedPeriodKey,
    ok: issues.length === 0,
    sourceSnapshots: {
      purchases: {
        periodStart: start.toISOString(),
        periodEndExclusive: endExclusive.toISOString(),
        recordsLoaded: datasets.purchases.length,
        recordsExcluded: excludedRecords.purchases.length,
      },
      expenses: {
        periodStart: start.toISOString(),
        periodEndExclusive: endExclusive.toISOString(),
        recordsLoaded: datasets.expenses.length,
        recordsExcluded: excludedRecords.expenses.length,
      },
      accountsPayablePayments: {
        periodStart: start.toISOString(),
        periodEndExclusive: endExclusive.toISOString(),
        recordsLoaded: datasets.accountsPayablePayments.length,
        recordsExcluded: excludedRecords.accountsPayablePayments.length,
      },
      linkedPurchases: linkedPurchasesSnapshot,
      providerProfiles: providerProfilesSnapshot,
    },
    sourceRecords: {
      purchases: buildSourceRecordsSnapshot(datasets.purchases),
      expenses: buildSourceRecordsSnapshot(datasets.expenses),
      accountsPayablePayments: buildSourceRecordsSnapshot(
        datasets.accountsPayablePayments,
      ),
      excludedPurchases: buildSourceRecordsSnapshot(excludedRecords.purchases),
      excludedExpenses: buildSourceRecordsSnapshot(excludedRecords.expenses),
      excludedAccountsPayablePayments: buildSourceRecordsSnapshot(
        excludedRecords.accountsPayablePayments,
      ),
      linkedPurchases: Object.values(linkedPurchasesById)
        .filter((entry) => entry?.exists && entry.record)
        .map((entry) => ({
          purchaseId: entry.purchaseId,
          sourcePath: entry.sourcePath,
          documentNumber: entry.record.documentNumber,
          documentFiscalNumber: entry.record.taxReceipt?.ncf ?? null,
          issuedAt: entry.record.issuedAt ?? null,
        })),
    },
    issues,
    issueSummary: buildIssueSummary(issues),
  };
};

export { resolveMonthlyPeriodRange };
