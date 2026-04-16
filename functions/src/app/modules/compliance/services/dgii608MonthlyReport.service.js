import { db } from '../../../core/config/firebase.js';
import { validateDgiiMonthlyReportDataset } from './dgiiMonthlyReportValidation.service.js';

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
    issuedAt:
      record?.voidedAt ?? record?.createdAt ?? record?.issuedAt ?? null,
    reason: record?.voidReason ?? record?.reason ?? null,
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
      documentFiscalNumber:
        record?.data?.NCF ?? record?.ncf ?? null,
    };
  });

export const mapInvoiceDocToDgii608Record = ({
  businessId,
  invoiceId,
  invoiceDoc,
}) => {
  const invoiceData = isRecord(invoiceDoc?.data) ? invoiceDoc.data : invoiceDoc;
  const voidedAt = toDate(invoiceData?.voidedAt);
  const status =
    toCleanString(invoiceData?.status) ??
    toCleanString(invoiceDoc?.status) ??
    null;

  return {
    data: {
      NCF:
        toCleanString(invoiceData?.NCF) ??
        toCleanString(invoiceData?.comprobante) ??
        null,
    },
    voidedAt: voidedAt?.toISOString() ?? null,
    voidReason:
      toCleanString(invoiceData?.voidReason) ??
      toCleanString(invoiceData?.reason) ??
      null,
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
  const creditNoteData = isRecord(creditNoteDoc?.data)
    ? creditNoteDoc.data
    : creditNoteDoc;
  const createdAt = toDate(creditNoteData?.createdAt);
  const status = toCleanString(creditNoteData?.status) ?? null;

  return {
    invoiceId:
      toCleanString(creditNoteData?.invoiceId) ??
      toCleanString(creditNoteData?.sourceInvoiceId) ??
      null,
    ncf: toCleanString(creditNoteData?.ncf) ?? null,
    createdAt: createdAt?.toISOString() ?? null,
    status,
    reason:
      toCleanString(creditNoteData?.reason) ??
      toCleanString(creditNoteData?.voidReason) ??
      null,
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

const buildLegacyTimestampGapIssue = ({
  sourceId,
  datasets,
}) =>
  datasets[sourceId].flatMap((record, index) => {
    if (sourceId === 'invoices' && record?.voidedAt) {
      return [];
    }
    if (sourceId === 'creditNotes' && record?.createdAt) {
      return [];
    }

    return [
      {
        sourceId,
        index,
        fieldPath: sourceId === 'invoices' ? 'voidedAt' : 'createdAt',
        code: 'missing-cancellation-timestamp',
        severity: 'warning',
      },
    ];
  });

export const buildDgii608ValidationPreview = async ({
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

  const [invoicesSnap, creditNotesSnap] = await Promise.all([
    invoicesRef
      .where('voidedAt', '>=', start)
      .where('voidedAt', '<', endExclusive)
      .orderBy('voidedAt', 'asc')
      .get(),
    creditNotesRef
      .where('createdAt', '>=', start)
      .where('createdAt', '<', endExclusive)
      .orderBy('createdAt', 'asc')
      .get(),
  ]);

  const datasets = {
    invoices: invoicesSnap.docs
      .map((doc) =>
        mapInvoiceDocToDgii608Record({
          businessId: normalizedBusinessId,
          invoiceId: doc.id,
          invoiceDoc: doc.data(),
        }),
      )
      .filter((record) => isVoidedStatus(record.status)),
    creditNotes: creditNotesSnap.docs
      .map((doc) =>
        mapCreditNoteDocToDgii608Record({
          businessId: normalizedBusinessId,
          creditNoteId: doc.id,
          creditNoteDoc: doc.data(),
        }),
      )
      .filter((record) => isVoidedStatus(record.status)),
  };

  const validation = validateDgiiMonthlyReportDataset({
    reportCode: 'DGII_608',
    datasets,
  });
  const timestampIssues = [
    ...buildLegacyTimestampGapIssue({ sourceId: 'invoices', datasets }),
    ...buildLegacyTimestampGapIssue({ sourceId: 'creditNotes', datasets }),
  ];
  const issues = enrichIssues(
    [...validation.issues, ...timestampIssues],
    datasets,
  );

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
    pendingGaps: [
      ...validation.pendingGaps,
      'Las anulaciones legacy sin timestamp dedicado pueden quedar fuera del preview 608 hasta normalizar voidedAt/updatedAt.',
    ],
  };
};

export { resolveMonthlyPeriodRange };
