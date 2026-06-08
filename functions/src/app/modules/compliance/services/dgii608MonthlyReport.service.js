import { db } from '../../../core/config/firebase.js';
import { validateDgiiMonthlyReportDataset } from './dgiiMonthlyReportValidation.service.js';
import { resolveDgii608Reason } from './dgii608ReasonCatalog.service.js';

const PERIOD_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const DGII_608_VOID_STATUSES = new Set([
  'cancelled',
  'canceled',
  'void',
  'voided',
  'annulled',
  'annulado',
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

const isVoidedStatus = (status) => {
  const normalizedStatus = toCleanString(status)?.toLowerCase() ?? null;
  if (!normalizedStatus) return false;
  return DGII_608_VOID_STATUSES.has(normalizedStatus);
};

const resolveDgii608Status = (...values) => {
  const statuses = values.map((value) => toCleanString(value)).filter(Boolean);
  return statuses.find((status) => isVoidedStatus(status)) ?? statuses[0] ?? null;
};

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
    documentFiscalNumber: record?.data?.NCF ?? record?.ncf ?? null,
    invoiceId: record?.invoiceId ?? null,
    voidedAt: record?.voidedAt ?? null,
    issuedAt: record?.voidedAt ?? record?.issuedAt ?? null,
    createdAt: record?.createdAt ?? null,
    reason: record?.voidReason ?? record?.reason ?? null,
    reasonCode: record?.voidReasonCode ?? null,
    reasonLabel: record?.voidReasonLabel ?? null,
    status: record?.status ?? null,
  }));

const isWithinRange = ({ value, start, endExclusive }) => {
  const date = toDate(value);
  return Boolean(date && date >= start && date < endExclusive);
};

const runDateRangeQueries = async ({ ref, fieldPaths, start, endExclusive }) =>
  Promise.all(
    fieldPaths.map((fieldPath) =>
      ref
        .where(fieldPath, '>=', start)
        .where(fieldPath, '<', endExclusive)
        .orderBy(fieldPath, 'asc')
        .get(),
    ),
  );

const dedupeDocsById = (snapshots = []) => {
  const docsById = new Map();
  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      docsById.set(doc.id, doc);
    });
  });
  return Array.from(docsById.values());
};

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
      documentFiscalNumber:
        record?.data?.NCF ?? record?.ncf ?? null,
    };
  });

export const mapInvoiceDocToDgii608Record = ({
  businessId,
  invoiceId,
  invoiceDoc,
}) => {
  const invoiceRoot = isRecord(invoiceDoc) ? invoiceDoc : {};
  const invoiceData = isRecord(invoiceDoc?.data) ? invoiceDoc.data : invoiceRoot;
  const cancelData = isRecord(invoiceData?.cancel) ? invoiceData.cancel : {};
  const rootCancelData = isRecord(invoiceRoot?.cancel) ? invoiceRoot.cancel : {};
  const voidedAt = toDate(
    invoiceRoot?.voidedAt ??
      invoiceData?.voidedAt ??
      rootCancelData?.cancelledAt ??
      cancelData?.cancelledAt ??
      invoiceRoot?.cancelledAt ??
      invoiceData?.cancelledAt,
  );
  const status = resolveDgii608Status(invoiceRoot?.status, invoiceData?.status);
  const reason = resolveDgii608Reason({
    reasonCode:
      invoiceData?.voidReasonCode ??
      invoiceRoot?.voidReasonCode ??
      rootCancelData?.reasonCode ??
      cancelData?.reasonCode ??
      invoiceRoot?.cancelReasonCode ??
      invoiceData?.cancelReasonCode,
    reasonLabel:
      invoiceData?.voidReasonLabel ??
      invoiceRoot?.voidReasonLabel ??
      rootCancelData?.reasonLabel ??
      cancelData?.reasonLabel ??
      invoiceRoot?.cancelReasonLabel ??
      invoiceData?.cancelReasonLabel,
    reasonText:
      invoiceData?.voidReason ??
      invoiceRoot?.voidReason ??
      rootCancelData?.reason ??
      cancelData?.reason ??
      invoiceRoot?.reason ??
      invoiceData?.reason ??
      invoiceRoot?.cancelReason ??
      invoiceData?.cancelReason,
  });

  return {
    data: {
      NCF:
        toCleanString(invoiceData?.NCF) ??
        toCleanString(invoiceData?.comprobante) ??
        null,
    },
    voidedAt: voidedAt?.toISOString() ?? null,
    voidReason: reason.rawReason ?? null,
    voidReasonCode: reason.code,
    voidReasonLabel: reason.label,
    voidReasonCatalogVersion: reason.catalogVersion,
    status,
    documentNumber:
      toCleanString(invoiceData?.numberID) ??
      toCleanString(invoiceData?.id) ??
      toCleanString(invoiceId),
    metadata: {
      recordId: invoiceId,
      sourcePath: `businesses/${businessId}/invoices/${invoiceId}`,
    },
  };
};

export const mapCreditNoteDocToDgii608Record = ({
  businessId,
  creditNoteId,
  creditNoteDoc,
}) => {
  const creditNoteRoot = isRecord(creditNoteDoc) ? creditNoteDoc : {};
  const creditNoteData = isRecord(creditNoteDoc?.data)
    ? creditNoteDoc.data
    : creditNoteRoot;
  const cancelData = isRecord(creditNoteData?.cancel)
    ? creditNoteData.cancel
    : {};
  const rootCancelData = isRecord(creditNoteRoot?.cancel)
    ? creditNoteRoot.cancel
    : {};
  const createdAt = toDate(creditNoteRoot?.createdAt ?? creditNoteData?.createdAt);
  const voidedAt = toDate(
    creditNoteRoot?.voidedAt ??
      creditNoteData?.voidedAt ??
      creditNoteRoot?.cancelledAt ??
      creditNoteData?.cancelledAt ??
      rootCancelData?.cancelledAt ??
      cancelData?.cancelledAt,
  );
  const status = resolveDgii608Status(
    creditNoteRoot?.status,
    creditNoteData?.status,
  );
  const reason = resolveDgii608Reason({
    reasonCode:
      creditNoteRoot?.voidReasonCode ??
      creditNoteData?.voidReasonCode ??
      rootCancelData?.reasonCode ??
      cancelData?.reasonCode ??
      creditNoteRoot?.reasonCode ??
      creditNoteData?.reasonCode ??
      creditNoteRoot?.cancelReasonCode ??
      creditNoteData?.cancelReasonCode,
    reasonLabel:
      creditNoteRoot?.voidReasonLabel ??
      creditNoteData?.voidReasonLabel ??
      rootCancelData?.reasonLabel ??
      cancelData?.reasonLabel ??
      creditNoteRoot?.reasonLabel ??
      creditNoteData?.reasonLabel ??
      creditNoteRoot?.cancelReasonLabel ??
      creditNoteData?.cancelReasonLabel,
    reasonText:
      creditNoteRoot?.reason ??
      creditNoteData?.reason ??
      creditNoteRoot?.voidReason ??
      creditNoteData?.voidReason ??
      rootCancelData?.reason ??
      cancelData?.reason ??
      creditNoteRoot?.cancelReason ??
      creditNoteData?.cancelReason,
  });

  return {
    invoiceId:
      toCleanString(creditNoteData?.invoiceId) ??
      toCleanString(creditNoteData?.sourceInvoiceId) ??
      null,
    ncf: toCleanString(creditNoteData?.ncf) ?? null,
    voidedAt: voidedAt?.toISOString() ?? null,
    createdAt: createdAt?.toISOString() ?? null,
    status,
    reason: reason.rawReason ?? null,
    voidReasonCode: reason.code,
    voidReasonLabel: reason.label,
    voidReasonCatalogVersion: reason.catalogVersion,
    documentNumber:
      toCleanString(creditNoteData?.number) ??
      toCleanString(creditNoteData?.numberID) ??
      toCleanString(creditNoteData?.id) ??
      toCleanString(creditNoteId),
    metadata: {
      recordId: creditNoteId,
      sourcePath: `businesses/${businessId}/creditNotes/${creditNoteId}`,
    },
  };
};

export const loadDgii608Datasets = async ({
  businessId,
  periodKey,
  firestore = db,
}) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new Error('businessId es requerido para validar DGII_608');
  }

  const { periodKey: normalizedPeriodKey, start, endExclusive } =
    resolveMonthlyPeriodRange(periodKey);

  const invoicesRef = firestore.collection(
    `businesses/${normalizedBusinessId}/invoices`,
  );
  const creditNotesRef = firestore.collection(
    `businesses/${normalizedBusinessId}/creditNotes`,
  );

  const [
    invoiceSnapshots,
    creditNoteSnapshots,
  ] = await Promise.all([
    runDateRangeQueries({
      ref: invoicesRef,
      fieldPaths: ['voidedAt', 'data.voidedAt', 'data.cancel.cancelledAt'],
      start,
      endExclusive,
    }),
    runDateRangeQueries({
      ref: creditNotesRef,
      fieldPaths: [
        'voidedAt',
        'cancelledAt',
        'cancel.cancelledAt',
        'data.voidedAt',
        'data.cancel.cancelledAt',
      ],
      start,
      endExclusive,
    }),
  ]);

  return {
    businessId: normalizedBusinessId,
    periodKey: normalizedPeriodKey,
    start,
    endExclusive,
    datasets: {
      invoices: dedupeDocsById(invoiceSnapshots)
        .map((doc) =>
          mapInvoiceDocToDgii608Record({
            businessId: normalizedBusinessId,
            invoiceId: doc.id,
            invoiceDoc: doc.data(),
          }),
        )
        .filter(
          (record) =>
            isVoidedStatus(record.status) &&
            isWithinRange({ value: record.voidedAt, start, endExclusive }),
        ),
      creditNotes: dedupeDocsById(creditNoteSnapshots)
        .map((doc) =>
          mapCreditNoteDocToDgii608Record({
            businessId: normalizedBusinessId,
            creditNoteId: doc.id,
            creditNoteDoc: doc.data(),
          }),
        )
        .filter(
          (record) =>
            isVoidedStatus(record.status) &&
            isWithinRange({
              value: record.voidedAt,
              start,
              endExclusive,
            }),
        ),
    },
  };
};

export const buildDgii608ValidationPreview = async ({
  businessId,
  periodKey,
  firestore = db,
}) => {
  const {
    businessId: normalizedBusinessId,
    periodKey: normalizedPeriodKey,
    start,
    endExclusive,
    datasets,
  } = await loadDgii608Datasets({
    businessId,
    periodKey,
    firestore,
  });

  const validation = validateDgiiMonthlyReportDataset({
    reportCode: 'DGII_608',
    datasets,
  });
  const issues = enrichIssues(validation.issues, datasets);

  return {
    ...validation,
    businessId: normalizedBusinessId,
    periodKey: normalizedPeriodKey,
    ok: issues.length === 0,
    sourceSnapshots: {
      invoices: {
        periodStart: start.toISOString(),
        periodEndExclusive: endExclusive.toISOString(),
        recordsLoaded: datasets.invoices.length,
      },
      creditNotes: {
        periodStart: start.toISOString(),
        periodEndExclusive: endExclusive.toISOString(),
        recordsLoaded: datasets.creditNotes.length,
      },
    },
    sourceRecords: {
      invoices: buildSourceRecordsSnapshot(datasets.invoices),
      creditNotes: buildSourceRecordsSnapshot(datasets.creditNotes),
    },
    issues,
    issueSummary: buildIssueSummary(issues),
  };
};

export { resolveMonthlyPeriodRange };
