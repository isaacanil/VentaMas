import { db } from '../../../core/config/firebase.js';
import { validateDgiiMonthlyReportDataset } from './dgiiMonthlyReportValidation.service.js';
import {
  DGII_607_CONSUMER_FINAL_MINIMUM,
  isConsumerFinalNcf,
  resolvePaymentAmounts,
} from './dgii607ValidationEngine.service.js';
import {
  buildIssueSummary,
  isRecord,
  resolveMonthlyPeriodRange,
  toCleanString,
  toDate,
  toFiniteNumber,
} from './dgiiMonthlyReportShared.util.js';

const toPositiveNumberOrNull = (value) => {
  const parsed = toFiniteNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
};

const sumFiniteNumbers = (...values) =>
  values.reduce((total, value) => total + (toFiniteNumber(value) ?? 0), 0);

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

const shouldExcludeConsumerFinalFromDgii607 = (record) => {
  const ncf = toCleanString(record?.data?.NCF);
  if (!isConsumerFinalNcf(ncf)) return false;

  const total = toFiniteNumber(record?.totals?.total);
  return (
    total !== null &&
    total < DGII_607_CONSUMER_FINAL_MINIMUM
  );
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

      if (shouldExcludeConsumerFinalFromDgii607(record)) {
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

const resolveDebitNotePayload = (debitNoteDoc) =>
  isRecord(debitNoteDoc?.data) ? debitNoteDoc.data : debitNoteDoc;

const resolveWithholdingPayload = (withholdingDoc) =>
  isRecord(withholdingDoc?.data) ? withholdingDoc.data : withholdingDoc;

const resolveCreditNoteTaxAmount = (creditNoteData) =>
  toFiniteNumber(creditNoteData?.taxAmount) ??
  toFiniteNumber(creditNoteData?.itbisTotal) ??
  toFiniteNumber(creditNoteData?.totalTaxes?.value) ??
  toFiniteNumber(creditNoteData?.totalTaxes) ??
  toFiniteNumber(creditNoteData?.totals?.tax) ??
  toFiniteNumber(creditNoteData?.totals?.itbis) ??
  toFiniteNumber(creditNoteData?.monetary?.taxAmount) ??
  toFiniteNumber(creditNoteData?.monetary?.functionalTotals?.taxes) ??
  null;

const resolveCreditNoteTotalAmount = (creditNoteData) =>
  toFiniteNumber(creditNoteData?.totalAmount) ??
  toFiniteNumber(creditNoteData?.totals?.total) ??
  toFiniteNumber(creditNoteData?.amount) ??
  toFiniteNumber(creditNoteData?.monetary?.totalAmount) ??
  toFiniteNumber(creditNoteData?.monetary?.functionalTotals?.total);

const resolveAdjustmentNoteInvoiceNcf = (adjustmentNoteData) =>
  toCleanString(adjustmentNoteData?.invoiceNcf) ??
  toCleanString(adjustmentNoteData?.invoiceNCF) ??
  toCleanString(adjustmentNoteData?.modifiedNcf) ??
  toCleanString(adjustmentNoteData?.modifiedNCF) ??
  toCleanString(adjustmentNoteData?.invoice?.ncf) ??
  toCleanString(adjustmentNoteData?.invoice?.NCF) ??
  toCleanString(adjustmentNoteData?.sourceInvoice?.ncf) ??
  toCleanString(adjustmentNoteData?.sourceInvoice?.NCF) ??
  null;

const resolveInvoiceNcfFromPayload = (invoiceDoc) => {
  const invoiceData = resolveInvoicePayload(invoiceDoc);
  return (
    toCleanString(invoiceData?.NCF) ??
    toCleanString(invoiceData?.comprobante) ??
    null
  );
};

const toRecordPeriodKey = (record) => {
  const issuedAt =
    toCleanString(record?.issuedAt) ?? toCleanString(record?.createdAt);
  return issuedAt?.slice(0, 7) ?? null;
};

export const mapInvoiceDocToDgii607Record = ({
  businessId,
  invoiceId,
  invoiceDoc,
}) => {
  const invoiceData = resolveInvoicePayload(invoiceDoc);
  const client = isRecord(invoiceData?.client) ? invoiceData.client : {};
  const issuedAt = toDate(invoiceData?.date);

  const counterpartyId =
    toCleanString(client.id) ?? toCleanString(invoiceData?.clientId) ?? null;
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
    paymentBreakdown: resolvePaymentAmounts(invoiceDoc, total ?? 0),
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
  const total = resolveCreditNoteTotalAmount(creditNoteData);
  const tax = resolveCreditNoteTaxAmount(creditNoteData);
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
      tax,
    },
    status,
    metadata: {
      recordId: creditNoteId,
      sourcePath: `businesses/${businessId}/creditNotes/${creditNoteId}`,
      issuedAtSource: createdAt?.toISOString() ?? null,
      invoiceId,
      invoiceNcf: resolveAdjustmentNoteInvoiceNcf(creditNoteData),
    },
  };
};

export const mapDebitNoteDocToDgii607Record = ({
  businessId,
  debitNoteId,
  debitNoteDoc,
}) => {
  const debitNoteData = resolveDebitNotePayload(debitNoteDoc);
  const client = isRecord(debitNoteData?.client) ? debitNoteData.client : {};
  const createdAt = toDate(debitNoteData?.createdAt);

  const counterpartyId = toCleanString(client.id) ?? null;
  const identificationNumber =
    toCleanString(client.rnc) ??
    toCleanString(client.personalID) ??
    toCleanString(client.personalId) ??
    null;
  const ncf =
    toCleanString(debitNoteData?.ncf) ??
    toCleanString(debitNoteData?.eNcf) ??
    null;
  const total = resolveCreditNoteTotalAmount(debitNoteData);
  const tax = resolveCreditNoteTaxAmount(debitNoteData);
  const documentNumber =
    toCleanString(debitNoteData?.number) ??
    toCleanString(debitNoteData?.numberID) ??
    toCleanString(debitNoteData?.id) ??
    toCleanString(debitNoteId);
  const status = toCleanString(debitNoteData?.status) ?? null;
  const invoiceId =
    toCleanString(debitNoteData?.invoiceId) ??
    toCleanString(debitNoteData?.sourceInvoiceId) ??
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
      tax,
    },
    paymentBreakdown: {
      creditSale: total ?? 0,
    },
    status,
    metadata: {
      recordId: debitNoteId,
      sourcePath: `businesses/${businessId}/debitNotes/${debitNoteId}`,
      issuedAtSource: createdAt?.toISOString() ?? null,
      invoiceId,
      invoiceNcf: resolveAdjustmentNoteInvoiceNcf(debitNoteData),
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

const buildSourceRecordsSnapshot = (records = []) =>
  records.map((record, index) => ({
    index,
    recordId: record?.metadata?.recordId ?? null,
    sourcePath: record?.metadata?.sourcePath ?? null,
    documentNumber: record?.documentNumber ?? null,
    documentFiscalNumber: record?.data?.NCF ?? record?.ncf ?? null,
    counterpartyIdentificationNumber:
      record?.counterparty?.identification?.number ?? null,
    invoiceId: record?.invoiceId ?? record?.metadata?.invoiceId ?? null,
    invoiceNcf: record?.metadata?.invoiceNcf ?? null,
    ...(record?.metadata?.mergedWithholdingIds
      ? { mergedWithholdingIds: record.metadata.mergedWithholdingIds }
      : {}),
    ...(record?.metadata?.mergedIntoInvoiceId
      ? { mergedIntoInvoiceId: record.metadata.mergedIntoInvoiceId }
      : {}),
    issuedAt: record?.issuedAt ?? record?.createdAt ?? null,
    retentionDate: record?.retentionDate ?? null,
    total: record?.totals?.total ?? null,
    itbisTotal: record?.totals?.tax ?? null,
    itbisWithheld: record?.itbisWithheld ?? null,
    incomeTaxWithheld: record?.incomeTaxWithheld ?? null,
    cash:
      toPositiveNumberOrNull(record?.paymentBreakdown?.cash) ??
      toPositiveNumberOrNull(record?.paymentBreakdown?.cashAmount),
    checkTransfer:
      toPositiveNumberOrNull(record?.paymentBreakdown?.bank) ??
      toPositiveNumberOrNull(record?.paymentBreakdown?.checkTransfer) ??
      toPositiveNumberOrNull(record?.paymentBreakdown?.transfer) ??
      toPositiveNumberOrNull(record?.paymentBreakdown?.bankTransfer),
    card:
      toPositiveNumberOrNull(record?.paymentBreakdown?.card) ??
      toPositiveNumberOrNull(record?.paymentBreakdown?.cardAmount),
    creditSale: toPositiveNumberOrNull(record?.paymentBreakdown?.creditSale),
    giftCertificates: toPositiveNumberOrNull(
      record?.paymentBreakdown?.giftCertificates,
    ),
    barter: toPositiveNumberOrNull(record?.paymentBreakdown?.barter),
    otherSales: toPositiveNumberOrNull(record?.paymentBreakdown?.otherSales),
    status: record?.status ?? null,
  }));

const resolveEarliestIsoDate = (...values) => {
  const dates = values.map((value) => toDate(value)).filter(Boolean);
  if (!dates.length) return null;

  dates.sort((left, right) => left.getTime() - right.getTime());
  return dates[0].toISOString();
};

const mergeDgii607InvoicesWithWithholdings = ({
  invoices = [],
  withholdings = [],
}) => {
  const invoicesById = new Map();
  const invoicesByNcf = new Map();
  const mergedInvoices = invoices.map((invoice) => {
    const copy = {
      ...invoice,
      metadata: {
        ...(isRecord(invoice?.metadata) ? invoice.metadata : {}),
      },
    };
    const invoiceId = toCleanString(copy?.metadata?.recordId);
    const ncf = toCleanString(copy?.data?.NCF);

    if (invoiceId) invoicesById.set(invoiceId, copy);
    if (ncf) invoicesByNcf.set(ncf, copy);
    return copy;
  });
  const mergedWithholdings = [];
  const unmatchedWithholdings = [];

  withholdings.forEach((withholding) => {
    const invoiceId =
      toCleanString(withholding?.invoiceId) ??
      toCleanString(withholding?.metadata?.invoiceId);
    const withholdingNcf = toCleanString(withholding?.data?.NCF);
    const matchingInvoice =
      (invoiceId ? invoicesById.get(invoiceId) : null) ??
      (withholdingNcf ? invoicesByNcf.get(withholdingNcf) : null);

    if (!matchingInvoice) {
      unmatchedWithholdings.push(withholding);
      return;
    }

    const withholdingRecordId =
      toCleanString(withholding?.metadata?.recordId) ??
      toCleanString(withholding?.documentNumber);
    matchingInvoice.itbisWithheld = sumFiniteNumbers(
      matchingInvoice.itbisWithheld,
      withholding?.itbisWithheld,
    );
    matchingInvoice.incomeTaxWithheld = sumFiniteNumbers(
      matchingInvoice.incomeTaxWithheld,
      withholding?.incomeTaxWithheld,
    );
    matchingInvoice.retentionDate = resolveEarliestIsoDate(
      matchingInvoice.retentionDate,
      withholding?.retentionDate,
    );
    matchingInvoice.metadata.mergedWithholdingIds = [
      ...(Array.isArray(matchingInvoice.metadata.mergedWithholdingIds)
        ? matchingInvoice.metadata.mergedWithholdingIds
        : []),
      ...(withholdingRecordId ? [withholdingRecordId] : []),
    ];
    mergedWithholdings.push({
      ...withholding,
      metadata: {
        ...(isRecord(withholding?.metadata) ? withholding.metadata : {}),
        mergedIntoInvoiceId: matchingInvoice.metadata.recordId ?? null,
      },
    });
  });

  return {
    invoices: mergedInvoices,
    mergedWithholdings,
    unmatchedWithholdings,
  };
};

const enrichAdjustmentNotesWithLinkedInvoiceNcf = async ({
  businessId,
  adjustmentNotes,
  firestore,
}) => {
  const missingInvoiceNcf = adjustmentNotes.filter(
    (adjustmentNote) =>
      toCleanString(adjustmentNote?.invoiceId) &&
      !toCleanString(adjustmentNote?.metadata?.invoiceNcf),
  );

  if (!missingInvoiceNcf.length || typeof firestore?.doc !== 'function') {
    return adjustmentNotes;
  }

  const invoiceIds = Array.from(
    new Set(missingInvoiceNcf.map((record) => toCleanString(record.invoiceId))),
  ).filter(Boolean);
  const invoiceNcfById = new Map(
    await Promise.all(
      invoiceIds.map(async (invoiceId) => {
        const snap = await firestore
          .doc(`businesses/${businessId}/invoices/${invoiceId}`)
          .get();
        if (!snap?.exists) return [invoiceId, null];
        return [invoiceId, resolveInvoiceNcfFromPayload(snap.data())];
      }),
    ),
  );

  return adjustmentNotes.map((adjustmentNote) => {
    if (toCleanString(adjustmentNote?.metadata?.invoiceNcf)) {
      return adjustmentNote;
    }

    const invoiceNcf = invoiceNcfById.get(
      toCleanString(adjustmentNote.invoiceId),
    );
    if (!invoiceNcf) return adjustmentNote;

    return {
      ...adjustmentNote,
      metadata: {
        ...(isRecord(adjustmentNote?.metadata)
          ? adjustmentNote.metadata
          : {}),
        invoiceNcf,
      },
    };
  });
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
      documentFiscalNumber: record?.data?.NCF ?? record?.ncf ?? null,
    };
  });

const loadLinkedInvoicesById = async ({
  businessId,
  adjustmentNotes,
  firestore,
}) => {
  const invoiceIds = Array.from(
    new Set(
      adjustmentNotes
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
      const ref = firestore.doc(
        `businesses/${businessId}/invoices/${invoiceId}`,
      );
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

  const {
    periodKey: normalizedPeriodKey,
    start,
    endExclusive,
  } = resolveMonthlyPeriodRange(periodKey);

  const invoicesRef = firestore.collection(
    `businesses/${normalizedBusinessId}/invoices`,
  );
  const creditNotesRef = firestore.collection(
    `businesses/${normalizedBusinessId}/creditNotes`,
  );
  const debitNotesRef = firestore.collection(
    `businesses/${normalizedBusinessId}/debitNotes`,
  );
  const withholdingsRef = firestore.collection(
    `businesses/${normalizedBusinessId}/salesThirdPartyWithholdings`,
  );

  const [invoicesSnap, creditNotesSnap, debitNotesSnap, withholdingsSnap] =
    await Promise.all([
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
    debitNotesRef
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
  const mappedCreditNotes = await enrichAdjustmentNotesWithLinkedInvoiceNcf({
    businessId: normalizedBusinessId,
    adjustmentNotes: creditNotesSnap.docs.map((doc) =>
      mapCreditNoteDocToDgii607Record({
        businessId: normalizedBusinessId,
        creditNoteId: doc.id,
        creditNoteDoc: doc.data(),
      }),
    ),
    firestore,
  });
  const mappedDebitNotes = await enrichAdjustmentNotesWithLinkedInvoiceNcf({
    businessId: normalizedBusinessId,
    adjustmentNotes: debitNotesSnap.docs.map((doc) =>
      mapDebitNoteDocToDgii607Record({
        businessId: normalizedBusinessId,
        debitNoteId: doc.id,
        debitNoteDoc: doc.data(),
      }),
    ),
    firestore,
  });
  const mappedWithholdings = withholdingsSnap.docs.map((doc) =>
    mapThirdPartyWithholdingDocToDgii607Record({
      businessId: normalizedBusinessId,
      withholdingId: doc.id,
      withholdingDoc: doc.data(),
    }),
  );

  const invoiceRecords = splitDgii607Records(mappedInvoices);
  const creditNoteRecords = splitDgii607Records(mappedCreditNotes);
  const debitNoteRecords = splitDgii607Records(mappedDebitNotes);
  const activeWithholdings = mappedWithholdings.filter(
    (record) => !shouldExcludeFromDgii607(record?.status),
  );
  const statusExcludedWithholdings = mappedWithholdings.filter((record) =>
    shouldExcludeFromDgii607(record?.status),
  );
  const {
    invoices: invoicesWithWithholdings,
    mergedWithholdings,
    unmatchedWithholdings,
  } = mergeDgii607InvoicesWithWithholdings({
    invoices: invoiceRecords.included,
    withholdings: activeWithholdings,
  });
  const withholdingRecords = splitDgii607Records(unmatchedWithholdings);

  return {
    businessId: normalizedBusinessId,
    periodKey: normalizedPeriodKey,
    start,
    endExclusive,
    rawSnapshots: {
      invoices: invoicesSnap,
      creditNotes: creditNotesSnap,
      debitNotes: debitNotesSnap,
      thirdPartyWithholdings: withholdingsSnap,
    },
    datasets: {
      invoices: invoicesWithWithholdings,
      creditNotes: creditNoteRecords.included,
      debitNotes: debitNoteRecords.included,
      thirdPartyWithholdings: withholdingRecords.included,
    },
    excludedRecords: {
      invoices: invoiceRecords.excluded,
      creditNotes: creditNoteRecords.excluded,
      debitNotes: debitNoteRecords.excluded,
      thirdPartyWithholdings: [
        ...statusExcludedWithholdings,
        ...withholdingRecords.excluded,
      ],
    },
    mergedRecords: {
      thirdPartyWithholdings: mergedWithholdings,
    },
  };
};

const buildAdjustmentNoteCrossReferenceIssues = ({
  sourceId,
  adjustmentNotes,
  linkedInvoicesById,
  periodKey,
}) =>
  adjustmentNotes.flatMap((adjustmentNote, index) => {
    const invoiceId = toCleanString(adjustmentNote?.invoiceId);
    if (!invoiceId) return [];

    const linkedInvoice = linkedInvoicesById[invoiceId];
    if (!linkedInvoice?.exists || !linkedInvoice.record) {
      return [
        {
          sourceId,
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
        sourceId,
        index,
        fieldPath: 'invoiceId',
        code: 'linked-invoice-out-of-period',
        severity: 'warning',
        linkedRecordId: invoiceId,
        linkedSourcePath: linkedInvoice.sourcePath,
        linkedPeriodKey: linkedInvoicePeriodKey,
      });
    }

    const adjustmentNoteInvoiceNcf = toCleanString(
      adjustmentNote?.metadata?.invoiceNcf,
    );
    const linkedInvoiceNcf = toCleanString(linkedRecord?.data?.NCF);

    if (!adjustmentNoteInvoiceNcf) {
      issues.push({
        sourceId,
        index,
        fieldPath: 'metadata.invoiceNcf',
        code: 'missing-linked-invoice-ncf',
        severity: 'error',
        linkedRecordId: invoiceId,
        linkedSourcePath: linkedInvoice.sourcePath,
      });
    } else if (
      linkedInvoiceNcf &&
      adjustmentNoteInvoiceNcf !== linkedInvoiceNcf
    ) {
      issues.push({
        sourceId,
        index,
        fieldPath: 'metadata.invoiceNcf',
        code: 'linked-invoice-ncf-mismatch',
        severity: 'error',
        linkedRecordId: invoiceId,
        linkedSourcePath: linkedInvoice.sourcePath,
        expectedValue: linkedInvoiceNcf,
        actualValue: adjustmentNoteInvoiceNcf,
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
    mergedRecords,
  } = await loadDgii607Datasets({
    businessId,
    periodKey,
    firestore,
  });

  const { linkedInvoicesById, sourceSnapshot: linkedInvoicesSnapshot } =
    await loadLinkedInvoicesById({
      businessId: normalizedBusinessId,
      adjustmentNotes: [...datasets.creditNotes, ...datasets.debitNotes],
      firestore,
    });

  const validation = validateDgiiMonthlyReportDataset({
    reportCode: 'DGII_607',
    datasets,
  });
  const crossReferenceIssues = [
    ...buildAdjustmentNoteCrossReferenceIssues({
      sourceId: 'creditNotes',
      adjustmentNotes: datasets.creditNotes,
      linkedInvoicesById,
      periodKey: normalizedPeriodKey,
    }),
    ...buildAdjustmentNoteCrossReferenceIssues({
      sourceId: 'debitNotes',
      adjustmentNotes: datasets.debitNotes,
      linkedInvoicesById,
      periodKey: normalizedPeriodKey,
    }),
  ];
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
      debitNotes: {
        periodStart: start.toISOString(),
        periodEndExclusive: endExclusive.toISOString(),
        recordsLoaded: datasets.debitNotes.length,
        recordsExcluded: excludedRecords.debitNotes.length,
      },
      thirdPartyWithholdings: {
        periodStart: start.toISOString(),
        periodEndExclusive: endExclusive.toISOString(),
        recordsLoaded: datasets.thirdPartyWithholdings.length,
        recordsExcluded: excludedRecords.thirdPartyWithholdings.length,
        recordsMerged: mergedRecords.thirdPartyWithholdings.length,
      },
      linkedInvoices: linkedInvoicesSnapshot,
    },
    sourceRecords: {
      invoices: buildSourceRecordsSnapshot(datasets.invoices),
      creditNotes: buildSourceRecordsSnapshot(datasets.creditNotes),
      debitNotes: buildSourceRecordsSnapshot(datasets.debitNotes),
      thirdPartyWithholdings: buildSourceRecordsSnapshot(
        datasets.thirdPartyWithholdings,
      ),
      mergedThirdPartyWithholdings: buildSourceRecordsSnapshot(
        mergedRecords.thirdPartyWithholdings,
      ),
      excludedInvoices: buildSourceRecordsSnapshot(excludedRecords.invoices),
      excludedCreditNotes: buildSourceRecordsSnapshot(
        excludedRecords.creditNotes,
      ),
      excludedDebitNotes: buildSourceRecordsSnapshot(
        excludedRecords.debitNotes,
      ),
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
