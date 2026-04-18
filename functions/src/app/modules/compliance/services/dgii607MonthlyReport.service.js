import { db } from '../../../core/config/firebase.js';
import { validateDgiiMonthlyReportDataset } from './dgiiMonthlyReportValidation.service.js';

const PERIOD_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

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

const EXCLUDED_DGII_607_STATUSES = new Set([
  'cancelled',
  'canceled',
  'void',
  'voided',
  'annulled',
  'annulado',
  'deleted',
  'inactive',
  'disabled',
]);

const shouldExcludeFromDgii607 = (status) => {
  const normalizedStatus = toCleanString(status)?.toLowerCase() ?? null;
  if (!normalizedStatus) return false;
  return EXCLUDED_DGII_607_STATUSES.has(normalizedStatus);
};

const splitDgii607Records = (records = []) =>
  records.reduce(
    (acc, record) => {
      if (shouldExcludeFromDgii607(record?.status)) {
        acc.excluded.push(record);
        return acc;
      }

      // Records without an NCF are non-fiscal transactions (e.g. walk-in sales
      // where no comprobante was issued). DGII 607 only covers NCF-bearing sales,
      // so exclude them rather than raising validation errors.
      if (!toCleanString(record?.data?.NCF)) {
        acc.excluded.push(record);
        return acc;
      }

      acc.included.push(record);
      return acc;
    },
    { included: [], excluded: [] },
  );

const resolveInvoicePayload = (invoiceDoc) =>
  isRecord(invoiceDoc?.data) ? invoiceDoc.data : invoiceDoc;

const resolveCreditNotePayload = (creditNoteDoc) =>
  isRecord(creditNoteDoc?.data) ? creditNoteDoc.data : creditNoteDoc;

const resolveWithholdingPayload = (withholdingDoc) =>
  isRecord(withholdingDoc?.data) ? withholdingDoc.data : withholdingDoc;

const toRecordPeriodKey = (record) => {
  const issuedAt = toCleanString(record?.issuedAt) ?? toCleanString(record?.createdAt);
  return issuedAt?.slice(0, 7) ?? null;
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

export const mapInvoiceDocToDgii607Record = ({ businessId, invoiceId, invoiceDoc }) => {
  const invoiceData = resolveInvoicePayload(invoiceDoc);
  const client = isRecord(invoiceData?.client) ? invoiceData.client : {};
  const issuedAt = toDate(invoiceData?.date);

  const counterpartyId =
    toCleanString(client.id) ??
    toCleanString(invoiceData?.clientId) ??
    null;
  const identificationNumber =
    toCleanString(client.rnc) ??
    toCleanString(client.personalID) ??
    toCleanString(client.personalId) ??
    null;
  const ncf =
    toCleanString(invoiceData?.NCF) ??
    toCleanString(invoiceData?.comprobante) ??
    null;
  const total =
    toFiniteNumber(invoiceData?.totalPurchase?.value) ??
    toFiniteNumber(invoiceData?.totalPurchase);
  const tax =
    toFiniteNumber(invoiceData?.totalTaxes?.value) ??
    toFiniteNumber(invoiceData?.totalTaxes);
  const documentNumber =
    toCleanString(invoiceData?.numberID) ??
    toCleanString(invoiceData?.id) ??
    toCleanString(invoiceId);
  const status =
    toCleanString(invoiceData?.status) ??
    toCleanString(invoiceDoc?.status) ??
    null;

  return {
    businessId,
    issuedAt: issuedAt?.toISOString() ?? null,
    documentNumber,
    counterparty: {
      id: counterpartyId,
      identification: {
        number: identificationNumber,
      },
    },
    clientId: counterpartyId,
    data: {
      NCF: ncf,
    },
    totals: {
      total,
      tax,
    },
    status,
    metadata: {
      recordId: invoiceId,
      sourcePath: `businesses/${businessId}/invoices/${invoiceId}`,
      issuedAtSource: issuedAt?.toISOString() ?? null,
    },
  };
};

export const mapCreditNoteDocToDgii607Record = ({
  businessId,
  creditNoteId,
  creditNoteDoc,
}) => {
  const creditNoteData = resolveCreditNotePayload(creditNoteDoc);
  const client = isRecord(creditNoteData?.client) ? creditNoteData.client : {};
  const createdAt = toDate(creditNoteData?.createdAt);

  const counterpartyId = toCleanString(client.id) ?? null;
  const identificationNumber =
    toCleanString(client.rnc) ??
    toCleanString(client.personalID) ??
    toCleanString(client.personalId) ??
    null;
  const ncf = toCleanString(creditNoteData?.ncf) ?? null;
  const total = toFiniteNumber(creditNoteData?.totalAmount);
  const documentNumber =
    toCleanString(creditNoteData?.number) ??
    toCleanString(creditNoteData?.numberID) ??
    toCleanString(creditNoteData?.id) ??
    toCleanString(creditNoteId);
  const status = toCleanString(creditNoteData?.status) ?? null;
  const invoiceId =
    toCleanString(creditNoteData?.invoiceId) ??
    toCleanString(creditNoteData?.sourceInvoiceId) ??
    null;

  return {
    businessId,
    issuedAt: createdAt?.toISOString() ?? null,
    createdAt: createdAt?.toISOString() ?? null,
    documentNumber,
    invoiceId,
    counterparty: {
      id: counterpartyId,
      identification: {
        number: identificationNumber,
      },
    },
    clientId: counterpartyId,
    data: {
      NCF: ncf,
    },
    ncf,
    totals: {
      total,
    },
    status,
    metadata: {
      recordId: creditNoteId,
      sourcePath: `businesses/${businessId}/creditNotes/${creditNoteId}`,
      issuedAtSource: createdAt?.toISOString() ?? null,
      invoiceId,
      invoiceNcf: toCleanString(creditNoteData?.invoiceNcf) ?? null,
    },
  };
};

export const mapThirdPartyWithholdingDocToDgii607Record = ({
  businessId,
  withholdingId,
  withholdingDoc,
}) => {
  const withholdingData = resolveWithholdingPayload(withholdingDoc);
  const issuedAt = toDate(withholdingData?.issuedAt);
  const retentionDate = toDate(withholdingData?.retentionDate);
  const total =
    toFiniteNumber(withholdingData?.totalAmount) ??
    toFiniteNumber(withholdingData?.totals?.total);
  const tax =
    toFiniteNumber(withholdingData?.taxAmount) ??
    toFiniteNumber(withholdingData?.totals?.tax);
  const itbisWithheld = toFiniteNumber(withholdingData?.itbisWithheld) ?? 0;
  const incomeTaxWithheld =
    toFiniteNumber(withholdingData?.incomeTaxWithheld) ?? 0;

  return {
    businessId,
    issuedAt: issuedAt?.toISOString() ?? null,
    retentionDate: retentionDate?.toISOString() ?? null,
    documentNumber:
      toCleanString(withholdingData?.documentNumber) ??
      toCleanString(withholdingData?.invoiceNumber) ??
      toCleanString(withholdingId),
    invoiceId: toCleanString(withholdingData?.invoiceId) ?? null,
    counterparty: {
      id:
        toCleanString(withholdingData?.counterparty?.id) ??
        toCleanString(withholdingData?.clientId) ??
        null,
      identification: {
        number:
          toCleanString(
            withholdingData?.counterparty?.identification?.number,
          ) ?? null,
      },
    },
    clientId:
      toCleanString(withholdingData?.counterparty?.id) ??
      toCleanString(withholdingData?.clientId) ??
      null,
    data: {
      NCF:
        toCleanString(withholdingData?.documentFiscalNumber) ??
        toCleanString(withholdingData?.ncf) ??
        null,
    },
    totals: {
      total,
      tax,
    },
    itbisWithheld,
    incomeTaxWithheld,
    paymentBreakdown: {
      creditSale: total ?? 0,
    },
    status: toCleanString(withholdingData?.status) ?? 'recorded',
    metadata: {
      recordId: withholdingId,
      sourcePath: `businesses/${businessId}/salesThirdPartyWithholdings/${withholdingId}`,
      invoiceId: toCleanString(withholdingData?.invoiceId) ?? null,
      paymentId: toCleanString(withholdingData?.paymentId) ?? null,
      invoiceSourcePath:
        toCleanString(withholdingData?.source?.invoicePath) ?? null,
    },
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
    invoiceId: record?.invoiceId ?? record?.metadata?.invoiceId ?? null,
    invoiceNcf: record?.metadata?.invoiceNcf ?? null,
    issuedAt: record?.issuedAt ?? record?.createdAt ?? null,
    retentionDate: record?.retentionDate ?? null,
    itbisWithheld: record?.itbisWithheld ?? null,
    incomeTaxWithheld: record?.incomeTaxWithheld ?? null,
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
      documentFiscalNumber: record?.data?.NCF ?? record?.ncf ?? null,
    };
  });

const loadLinkedInvoicesById = async ({
  businessId,
  creditNotes,
  firestore,
}) => {
  const invoiceIds = Array.from(
    new Set(
      creditNotes
        .map((record) => toCleanString(record?.invoiceId))
        .filter(Boolean),
    ),
  );

  if (!invoiceIds.length || typeof firestore?.doc !== 'function') {
    return {
      linkedInvoicesById: {},
      sourceSnapshot: {
        recordsRequested: invoiceIds.length,
        recordsResolved: 0,
        recordsMissing: invoiceIds.length,
      },
    };
  }

  const loadedEntries = await Promise.all(
    invoiceIds.map(async (invoiceId) => {
      const ref = firestore.doc(`businesses/${businessId}/invoices/${invoiceId}`);
      const snap = await ref.get();
      if (!snap?.exists) {
        return {
          invoiceId,
          exists: false,
          sourcePath: ref.path,
          record: null,
        };
      }

      return {
        invoiceId,
        exists: true,
        sourcePath: ref.path,
        record: mapInvoiceDocToDgii607Record({
          businessId,
          invoiceId,
          invoiceDoc: snap.data(),
        }),
      };
    }),
  );

  const linkedInvoicesById = Object.fromEntries(
    loadedEntries.map((entry) => [entry.invoiceId, entry]),
  );
  const recordsResolved = loadedEntries.filter((entry) => entry.exists).length;

  return {
    linkedInvoicesById,
    sourceSnapshot: {
      recordsRequested: invoiceIds.length,
      recordsResolved,
      recordsMissing: invoiceIds.length - recordsResolved,
    },
  };
};

export const loadDgii607Datasets = async ({
  businessId,
  periodKey,
  firestore = db,
}) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new Error('businessId es requerido para validar DGII_607');
  }

  const { periodKey: normalizedPeriodKey, start, endExclusive } =
    resolveMonthlyPeriodRange(periodKey);

  const invoicesRef = firestore.collection(
    `businesses/${normalizedBusinessId}/invoices`,
  );
  const creditNotesRef = firestore.collection(
    `businesses/${normalizedBusinessId}/creditNotes`,
  );
  const withholdingsRef = firestore.collection(
    `businesses/${normalizedBusinessId}/salesThirdPartyWithholdings`,
  );

  const [invoicesSnap, creditNotesSnap, withholdingsSnap] = await Promise.all([
    invoicesRef
      .where('data.date', '>=', start)
      .where('data.date', '<', endExclusive)
      .orderBy('data.date', 'asc')
      .get(),
    creditNotesRef
      .where('createdAt', '>=', start)
      .where('createdAt', '<', endExclusive)
      .orderBy('createdAt', 'asc')
      .get(),
    withholdingsRef
      .where('retentionDate', '>=', start)
      .where('retentionDate', '<', endExclusive)
      .orderBy('retentionDate', 'asc')
      .get(),
  ]);

  const mappedInvoices = invoicesSnap.docs.map((doc) =>
    mapInvoiceDocToDgii607Record({
      businessId: normalizedBusinessId,
      invoiceId: doc.id,
      invoiceDoc: doc.data(),
    }),
  );
  const mappedCreditNotes = creditNotesSnap.docs.map((doc) =>
    mapCreditNoteDocToDgii607Record({
      businessId: normalizedBusinessId,
      creditNoteId: doc.id,
      creditNoteDoc: doc.data(),
    }),
  );
  const mappedWithholdings = withholdingsSnap.docs.map((doc) =>
    mapThirdPartyWithholdingDocToDgii607Record({
      businessId: normalizedBusinessId,
      withholdingId: doc.id,
      withholdingDoc: doc.data(),
    }),
  );

  const invoiceRecords = splitDgii607Records(mappedInvoices);
  const creditNoteRecords = splitDgii607Records(mappedCreditNotes);
  const withholdingRecords = splitDgii607Records(mappedWithholdings);

  return {
    businessId: normalizedBusinessId,
    periodKey: normalizedPeriodKey,
    start,
    endExclusive,
    rawSnapshots: {
      invoices: invoicesSnap,
      creditNotes: creditNotesSnap,
      thirdPartyWithholdings: withholdingsSnap,
    },
    datasets: {
      invoices: invoiceRecords.included,
      creditNotes: creditNoteRecords.included,
      thirdPartyWithholdings: withholdingRecords.included,
    },
    excludedRecords: {
      invoices: invoiceRecords.excluded,
      creditNotes: creditNoteRecords.excluded,
      thirdPartyWithholdings: withholdingRecords.excluded,
    },
  };
};

const buildCreditNoteCrossReferenceIssues = ({
  creditNotes,
  linkedInvoicesById,
  periodKey,
}) =>
  creditNotes.flatMap((creditNote, index) => {
    const invoiceId = toCleanString(creditNote?.invoiceId);
    if (!invoiceId) return [];

    const linkedInvoice = linkedInvoicesById[invoiceId];
    if (!linkedInvoice?.exists || !linkedInvoice.record) {
      return [
        {
          sourceId: 'creditNotes',
          index,
          fieldPath: 'invoiceId',
          code: 'linked-invoice-not-found',
          severity: 'error',
          linkedRecordId: invoiceId,
          linkedSourcePath: linkedInvoice?.sourcePath ?? null,
        },
      ];
    }

    const issues = [];
    const linkedRecord = linkedInvoice.record;
    const linkedInvoicePeriodKey = toRecordPeriodKey(linkedRecord);
    if (linkedInvoicePeriodKey && linkedInvoicePeriodKey !== periodKey) {
      issues.push({
        sourceId: 'creditNotes',
        index,
        fieldPath: 'invoiceId',
        code: 'linked-invoice-out-of-period',
        severity: 'warning',
        linkedRecordId: invoiceId,
        linkedSourcePath: linkedInvoice.sourcePath,
        linkedPeriodKey: linkedInvoicePeriodKey,
      });
    }

    const creditNoteInvoiceNcf = toCleanString(creditNote?.metadata?.invoiceNcf);
    const linkedInvoiceNcf = toCleanString(linkedRecord?.data?.NCF);

    if (!creditNoteInvoiceNcf) {
      issues.push({
        sourceId: 'creditNotes',
        index,
        fieldPath: 'metadata.invoiceNcf',
        code: 'missing-linked-invoice-ncf',
        severity: 'warning',
        linkedRecordId: invoiceId,
        linkedSourcePath: linkedInvoice.sourcePath,
      });
    } else if (linkedInvoiceNcf && creditNoteInvoiceNcf !== linkedInvoiceNcf) {
      issues.push({
        sourceId: 'creditNotes',
        index,
        fieldPath: 'metadata.invoiceNcf',
        code: 'linked-invoice-ncf-mismatch',
        severity: 'error',
        linkedRecordId: invoiceId,
        linkedSourcePath: linkedInvoice.sourcePath,
        expectedValue: linkedInvoiceNcf,
        actualValue: creditNoteInvoiceNcf,
      });
    }

    return issues;
  });

export const buildDgii607ValidationPreview = async ({
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
    excludedRecords,
  } = await loadDgii607Datasets({
    businessId,
    periodKey,
    firestore,
  });

  const { linkedInvoicesById, sourceSnapshot: linkedInvoicesSnapshot } =
    await loadLinkedInvoicesById({
      businessId: normalizedBusinessId,
      creditNotes: datasets.creditNotes,
      firestore,
    });

  const validation = validateDgiiMonthlyReportDataset({
    reportCode: 'DGII_607',
    datasets,
  });
  const crossReferenceIssues = buildCreditNoteCrossReferenceIssues({
    creditNotes: datasets.creditNotes,
    linkedInvoicesById,
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
      invoices: {
        periodStart: start.toISOString(),
        periodEndExclusive: endExclusive.toISOString(),
        recordsLoaded: datasets.invoices.length,
        recordsExcluded: excludedRecords.invoices.length,
      },
      creditNotes: {
        periodStart: start.toISOString(),
        periodEndExclusive: endExclusive.toISOString(),
        recordsLoaded: datasets.creditNotes.length,
        recordsExcluded: excludedRecords.creditNotes.length,
      },
      thirdPartyWithholdings: {
        periodStart: start.toISOString(),
        periodEndExclusive: endExclusive.toISOString(),
        recordsLoaded: datasets.thirdPartyWithholdings.length,
        recordsExcluded: excludedRecords.thirdPartyWithholdings.length,
      },
      linkedInvoices: linkedInvoicesSnapshot,
    },
    sourceRecords: {
      invoices: buildSourceRecordsSnapshot(datasets.invoices),
      creditNotes: buildSourceRecordsSnapshot(datasets.creditNotes),
      thirdPartyWithholdings: buildSourceRecordsSnapshot(
        datasets.thirdPartyWithholdings,
      ),
      excludedInvoices: buildSourceRecordsSnapshot(excludedRecords.invoices),
      excludedCreditNotes: buildSourceRecordsSnapshot(excludedRecords.creditNotes),
      excludedThirdPartyWithholdings: buildSourceRecordsSnapshot(
        excludedRecords.thirdPartyWithholdings,
      ),
      linkedInvoices: Object.values(linkedInvoicesById)
        .filter((entry) => entry?.exists && entry.record)
        .map((entry) => ({
          invoiceId: entry.invoiceId,
          sourcePath: entry.sourcePath,
          documentNumber: entry.record.documentNumber,
          documentFiscalNumber: entry.record.data?.NCF ?? null,
          issuedAt: entry.record.issuedAt ?? null,
        })),
    },
    issues,
    issueSummary: buildIssueSummary(issues),
  };
};

export { resolveMonthlyPeriodRange };
