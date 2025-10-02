import { logger } from 'firebase-functions';
import { db, FieldValue, admin } from '../../../../core/config/firebase.js';
import {
  buildEntryId,
  canonicalizeNcf,
  countActiveInvoices,
  compareBigInts,
  normalizeDigits,
  sanitizePrefix,
} from '../utils/ncfLedger.util.js';

const DEFAULT_ENTRY_COLLECTION = 'entries';
const LEDGER_DEFAULT_WINDOW_AFTER = 40;
const LEDGER_DEFAULT_WINDOW_BEFORE = 12;
const LEDGER_MAX_WINDOW_AFTER = 150;
const LEDGER_MAX_WINDOW_BEFORE = 60;
const LEDGER_MAX_REPORT_ITEMS = 12;

export const extractInvoiceDataFromChange = (change) => {
  if (!change) return null;
  const raw = change.data();
  if (!raw || typeof raw !== 'object') return null;
  const data = raw.data || raw;
  if (!data || typeof data !== 'object') return null;
  const issuedAt = data.date || data.issuedAt || data.createdAt || null;
  return {
    ncf: data.NCF || data.ncf || data.comprobante || null,
    status: data.status || raw.status || null,
    invoiceNumber: data.numberID || data.invoiceNumber || data.number || null,
    total: data.total || data.grandTotal || null,
    issuedAt,
    raw,
  };
};

export const extractInvoiceDataFromSnapshot = (docSnap) => {
  if (!docSnap?.exists) return null;
  const raw = docSnap.data();
  if (!raw || typeof raw !== 'object') return null;
  const data = raw.data || raw;
  if (!data || typeof data !== 'object') return null;
  const issuedAt = data.date || data.issuedAt || data.createdAt || null;
  return {
    ncf: data.NCF || data.ncf || data.comprobante || null,
    status: data.status || raw.status || null,
    invoiceNumber: data.numberID || data.invoiceNumber || data.number || null,
    total: data.total || data.grandTotal || null,
    issuedAt,
    raw,
  };
};

const ensureMetadataShape = (meta) => ({
  prefix: meta?.prefix || null,
  rawPrefix: meta?.rawPrefix || null,
  serie: meta?.serie || null,
  type: meta?.type || null,
  sequenceLength: meta?.sequenceLength || 0,
  lastNumberString: meta?.lastNumberString || null,
  lastNumber: meta?.lastNumber || null,
  lastInvoiceId: meta?.lastInvoiceId || null,
  lastNcf: meta?.lastNcf || null,
  lastIssuedAt: meta?.lastIssuedAt || null,
  lastUpdatedAt: meta?.lastUpdatedAt || null,
  totalEntries: meta?.totalEntries || 0,
  duplicatesCount: meta?.duplicatesCount || 0,
  createdAt: meta?.createdAt || null,
});

const buildInvoiceRecord = ({ invoiceId, invoice }) => {
  if (!invoice) return null;
  return {
    invoiceId,
    invoiceNumber: invoice.invoiceNumber ?? null,
    status: invoice.status ?? null,
    total: invoice.total ?? null,
    issuedAt: invoice.issuedAt ?? null,
    updatedAt: admin.firestore.Timestamp.now(),
  };
};

export const upsertLedgerEntry = async ({
  businessId,
  invoiceId,
  canonical,
  invoice,
  collectionName = DEFAULT_ENTRY_COLLECTION,
}) => {
  if (!businessId || !invoiceId || !canonical) return;
  const {
    prefix,
    rawPrefix,
    serie,
    type,
    normalizedDigits,
    digitsLength,
    digitsRaw,
    sequenceNumber,
    sequenceBigInt,
    ncf,
  } = canonical;
  const ledgerDoc = db
    .collection('businesses')
    .doc(businessId)
    .collection('ncfLedger')
    .doc(prefix);
  const entryRef = ledgerDoc.collection(collectionName).doc(buildEntryId(normalizedDigits));

  await db.runTransaction(async (tx) => {
    const [metaSnap, entrySnap] = await Promise.all([
      tx.get(ledgerDoc),
      tx.get(entryRef),
    ]);
    const prevMeta = ensureMetadataShape(metaSnap.exists ? metaSnap.data() : null);
    let prevLastBigInt = null;
    if (prevMeta.lastNumberString) {
      try {
        prevLastBigInt = BigInt(prevMeta.lastNumberString);
      } catch (_) {
        prevLastBigInt = null;
      }
    }

    const prevEntry = entrySnap.exists ? entrySnap.data() : null;
    const prevInvoices = Array.isArray(prevEntry?.invoices) ? prevEntry.invoices : [];

    const record = buildInvoiceRecord({ invoiceId, invoice });
    if (!record) return;

    const nextInvoices = prevInvoices.filter((item) => item?.invoiceId !== invoiceId);
    nextInvoices.push(record);

    const prevActiveCount = countActiveInvoices(prevInvoices);
    const nextActiveCount = countActiveInvoices(nextInvoices);
    const prevDuplicates = Math.max(prevActiveCount - 1, 0);
    const nextDuplicates = Math.max(nextActiveCount - 1, 0);

    const nextEntry = {
      prefix,
      rawPrefix: rawPrefix || prefix,
      serie: serie || null,
      type: type || null,
      ncf,
      digitsRaw,
      normalizedDigits,
      digitsLength,
      sequenceNumber: sequenceNumber ?? null,
      sequenceNumberString: normalizedDigits,
      invoices: nextInvoices,
      activeCount: nextActiveCount,
      duplicatesCount: nextDuplicates,
      lastUpdatedAt: FieldValue.serverTimestamp(),
      isEmpty: nextInvoices.length === 0,
    };

    if (!entrySnap.exists) {
      nextEntry.createdAt = FieldValue.serverTimestamp();
    }

    tx.set(entryRef, nextEntry, { merge: true });

    const metaPayload = {
      prefix,
      rawPrefix: rawPrefix || prefix,
      serie: serie || prevMeta.serie || null,
      type: type || prevMeta.type || null,
      sequenceLength: Math.max(prevMeta.sequenceLength, digitsLength),
      lastUpdatedAt: FieldValue.serverTimestamp(),
      totalEntries: prevMeta.totalEntries,
      duplicatesCount: prevMeta.duplicatesCount,
    };

    const entryWasEmpty = prevInvoices.length === 0;
    const entryIsEmpty = nextInvoices.length === 0;
    if (entryWasEmpty && !entryIsEmpty) {
      metaPayload.totalEntries = prevMeta.totalEntries + 1;
    } else if (!entryWasEmpty && entryIsEmpty) {
      metaPayload.totalEntries = Math.max(prevMeta.totalEntries - 1, 0);
    }

    if (nextDuplicates !== prevDuplicates) {
      metaPayload.duplicatesCount = Math.max(
        prevMeta.duplicatesCount + (nextDuplicates - prevDuplicates),
        0
      );
    }

    const shouldUpdateLast = entryIsEmpty
      ? false
      : compareBigInts(sequenceBigInt, prevLastBigInt) >= 0;

    if (shouldUpdateLast) {
      metaPayload.lastNumberString = normalizedDigits;
      metaPayload.lastNumber = sequenceNumber ?? prevMeta.lastNumber ?? null;
      metaPayload.lastInvoiceId = invoiceId;
      metaPayload.lastNcf = ncf;
      if (invoice.issuedAt) {
        metaPayload.lastIssuedAt = invoice.issuedAt;
      }
    } else {
      metaPayload.lastNumberString = prevMeta.lastNumberString;
      metaPayload.lastNumber = prevMeta.lastNumber;
      metaPayload.lastInvoiceId = prevMeta.lastInvoiceId;
      metaPayload.lastNcf = prevMeta.lastNcf;
      metaPayload.lastIssuedAt = prevMeta.lastIssuedAt;
    }

    if (!metaSnap.exists) {
      metaPayload.createdAt = FieldValue.serverTimestamp();
    }

    tx.set(ledgerDoc, metaPayload, { merge: true });
  });
};

export const removeLedgerEntry = async ({
  businessId,
  invoiceId,
  canonical,
  collectionName = DEFAULT_ENTRY_COLLECTION,
}) => {
  if (!businessId || !invoiceId || !canonical) return;
  const { prefix, normalizedDigits } = canonical;
  const ledgerDoc = db
    .collection('businesses')
    .doc(businessId)
    .collection('ncfLedger')
    .doc(prefix);
  const entryRef = ledgerDoc.collection(collectionName).doc(buildEntryId(normalizedDigits));

  await db.runTransaction(async (tx) => {
    const [metaSnap, entrySnap] = await Promise.all([
      tx.get(ledgerDoc),
      tx.get(entryRef),
    ]);
    if (!entrySnap.exists) return;

    const prevMeta = ensureMetadataShape(metaSnap.exists ? metaSnap.data() : null);
    const prevEntry = entrySnap.data();
    const prevInvoices = Array.isArray(prevEntry?.invoices) ? prevEntry.invoices : [];
    const nextInvoices = prevInvoices.filter((item) => item?.invoiceId !== invoiceId);

    if (nextInvoices.length === prevInvoices.length) {
      return;
    }

    const prevActiveCount = countActiveInvoices(prevInvoices);
    const nextActiveCount = countActiveInvoices(nextInvoices);
    const prevDuplicates = Math.max(prevActiveCount - 1, 0);
    const nextDuplicates = Math.max(nextActiveCount - 1, 0);

    const nextEntry = {
      invoices: nextInvoices,
      activeCount: nextActiveCount,
      duplicatesCount: nextDuplicates,
      lastUpdatedAt: FieldValue.serverTimestamp(),
      isEmpty: nextInvoices.length === 0,
    };

    tx.set(entryRef, nextEntry, { merge: true });

    const entryWasEmpty = prevInvoices.length === 0;
    const entryIsEmpty = nextInvoices.length === 0;

    const metaPayload = {
      lastUpdatedAt: FieldValue.serverTimestamp(),
      totalEntries: prevMeta.totalEntries,
      duplicatesCount: prevMeta.duplicatesCount,
      prefix: prevMeta.prefix || canonical.prefix,
      rawPrefix: prevMeta.rawPrefix || canonical.rawPrefix || canonical.prefix,
      serie: prevMeta.serie || canonical.serie || null,
      type: prevMeta.type || canonical.type || null,
    };

    if (!entryWasEmpty && entryIsEmpty) {
      metaPayload.totalEntries = Math.max(prevMeta.totalEntries - 1, 0);
    }

    if (nextDuplicates !== prevDuplicates) {
      metaPayload.duplicatesCount = Math.max(
        prevMeta.duplicatesCount + (nextDuplicates - prevDuplicates),
        0
      );
    }

    tx.set(ledgerDoc, metaPayload, { merge: true });
  });
};

export const canonicalizeInvoice = (invoiceData) => {
  if (!invoiceData) return null;
  return canonicalizeNcf(invoiceData.ncf);
};

export const wipeLedgerPrefixes = async ({ businessId, prefixes }) => {
  if (!businessId) return { deleted: 0 };
  const ledgerRoot = db.collection('businesses').doc(businessId).collection('ncfLedger');
  const targets = prefixes?.length
    ? Array.from(new Set(prefixes.flatMap((prefix) => {
        const normalized = sanitizePrefix(prefix);
        const refs = [];
        if (prefix) refs.push(ledgerRoot.doc(prefix));
        if (normalized && normalized !== prefix) refs.push(ledgerRoot.doc(normalized));
        return refs;
      })))
    : await ledgerRoot.listDocuments();

  let deleted = 0;
  for (const docRef of targets) {
    // eslint-disable-next-line no-await-in-loop
    await admin.firestore().recursiveDelete(docRef);
    deleted += 1;
  }

  return { deleted };
};

export const syncLedgerForChange = async ({
  businessId,
  invoiceId,
  beforeData,
  afterData,
}) => {
  const beforeCanonical = canonicalizeInvoice(beforeData);
  const afterCanonical = canonicalizeInvoice(afterData);

  if (!beforeCanonical && !afterCanonical) {
    return { handled: false };
  }

  const tasks = [];
  if (beforeCanonical) {
    const sameAsAfter =
      afterCanonical &&
      afterCanonical.prefix === beforeCanonical.prefix &&
      afterCanonical.normalizedDigits === beforeCanonical.normalizedDigits;
    if (!sameAsAfter) {
      tasks.push(removeLedgerEntry({ businessId, invoiceId, canonical: beforeCanonical }));
    }
  }

  if (afterCanonical) {
    tasks.push(
      upsertLedgerEntry({
        businessId,
        invoiceId,
        canonical: afterCanonical,
        invoice: afterData,
      })
    );
  }

  for (const task of tasks) {
    // eslint-disable-next-line no-await-in-loop
    await task;
  }

  return { handled: true };
};

export const rebuildLedgerForInvoice = async ({ businessId, invoiceId, invoiceData }) => {
  const canonical = canonicalizeInvoice(invoiceData);
  if (!canonical) return false;
  logger.debug('rebuildLedgerForInvoice upserting entry', {
    businessId,
    invoiceId,
    prefix: canonical.prefix,
    normalizedDigits: canonical.normalizedDigits,
  });
  await upsertLedgerEntry({
    businessId,
    invoiceId,
    canonical,
    invoice: invoiceData,
  });
  return true;
};

const clampWindow = (value, fallback, maxValue) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.min(Math.floor(numeric), maxValue);
};

const isLedgerEntryActive = (entry) => {
  if (!entry) return false;
  if (Number(entry.activeCount) > 0) return true;
  const invoices = Array.isArray(entry.invoices) ? entry.invoices : [];
  return invoices.length > 0;
};

const buildNcfFromDigits = ({ prefix, digits, sequenceLength }) => {
  const safeDigits = normalizeDigits(digits ?? '');
  const length = Number.isFinite(sequenceLength) && sequenceLength > 0
    ? sequenceLength
    : Math.max(safeDigits.length, 1);
  return `${prefix}${safeDigits.padStart(length, '0')}`;
};

const formatLedgerEntry = ({
  entry,
  prefix,
  sequenceLength,
  step,
}) => {
  if (!entry) return null;
  const normalized = entry.normalizedDigits
    ? normalizeDigits(entry.normalizedDigits)
    : normalizeDigits(entry.sequenceNumber?.toString() ?? '');
  const digitsLength = sequenceLength || entry.sequenceNumberString?.length || normalized.length;
  const ncfCode = entry.ncf
    || buildNcfFromDigits({ prefix, digits: entry.sequenceNumberString || normalized, sequenceLength: digitsLength });

  return {
    number: entry.sequenceNumber,
    ncf: ncfCode,
    step,
    invoices: Array.isArray(entry.invoices) ? entry.invoices : [],
    normalizedDigits: normalized,
    activeCount: entry.activeCount ?? 0,
    serie: entry.serie || null,
    type: entry.type || null,
  };
};

export const getLedgerInsights = async ({
  businessId,
  prefix,
  sequenceNumber,
  normalizedDigits,
  increment = 1,
  windowBefore,
  windowAfter,
  quantitySteps,
  expectedSequenceLength,
} = {}) => {
  if (!businessId || !prefix) {
    return { source: 'ledger', ok: false, reason: 'invalid-params' };
  }

  const sequenceNumeric = Number(sequenceNumber);
  if (!Number.isFinite(sequenceNumeric) || sequenceNumeric < 0) {
    return { source: 'ledger', ok: false, reason: 'invalid-sequence' };
  }

  const resolvedIncrement = Math.max(Number(increment) || 1, 1);
  const resolvedWindowAfter = clampWindow(
    windowAfter,
    LEDGER_DEFAULT_WINDOW_AFTER,
    LEDGER_MAX_WINDOW_AFTER
  );
  const resolvedWindowBefore = clampWindow(
    windowBefore,
    LEDGER_DEFAULT_WINDOW_BEFORE,
    Math.min(LEDGER_MAX_WINDOW_BEFORE, resolvedWindowAfter)
  );

  const ledgerDoc = db
    .collection('businesses')
    .doc(businessId)
    .collection('ncfLedger')
    .doc(prefix);

  const [metaSnap, targetSnap] = await Promise.all([
    ledgerDoc.get(),
    ledgerDoc.collection(DEFAULT_ENTRY_COLLECTION)
      .doc(buildEntryId(normalizedDigits ?? sequenceNumeric.toString()))
      .get(),
  ]);

  if (!metaSnap.exists) {
    return { source: 'ledger-missing' };
  }

  const metadata = metaSnap.data() ?? {};

  const minRange = Math.max(sequenceNumeric - resolvedIncrement * resolvedWindowBefore, 0);
  const maxRange = sequenceNumeric + resolvedIncrement * resolvedWindowAfter;

  const entriesRef = ledgerDoc.collection(DEFAULT_ENTRY_COLLECTION);

  const rangeSnap = await entriesRef
    .where('sequenceNumber', '>=', minRange)
    .where('sequenceNumber', '<=', maxRange)
    .get();

  const entryMap = new Map();
  rangeSnap.forEach((docSnap) => {
    const entryData = docSnap.data();
    if (!Number.isFinite(entryData?.sequenceNumber)) return;
    entryMap.set(Number(entryData.sequenceNumber), entryData);
  });

  const targetEntry = targetSnap.exists
    ? targetSnap.data()
    : entryMap.get(sequenceNumeric);

  const sequenceLength = (() => {
    const candidates = [
      Number(expectedSequenceLength),
      Number(metadata.sequenceLength),
      normalizedDigits?.length,
      targetEntry?.sequenceNumberString?.length,
    ].filter((value) => Number.isFinite(value) && value > 0);
    if (!candidates.length) return normalizedDigits?.length || 0;
    return Math.max(...candidates);
  })();

  const formatAvailable = ({ number, step }) => ({
    number,
    step,
    ncf: buildNcfFromDigits({ prefix, digits: number.toString(), sequenceLength }),
  });

  const usedBefore = [];
  const availableBefore = [];
  for (let step = 1; step <= resolvedWindowBefore; step += 1) {
    const candidateNumber = sequenceNumeric - resolvedIncrement * step;
    if (candidateNumber < 0) break;
    const entry = entryMap.get(candidateNumber);
    if (entry && isLedgerEntryActive(entry)) {
      usedBefore.push(formatLedgerEntry({ entry, prefix, sequenceLength, step }));
      break;
    }
    if (!entry) {
      availableBefore.push(formatAvailable({ number: candidateNumber, step }));
    }
  }

  const usedAfter = [];
  const availableAfter = [];
  for (let step = 1; step <= resolvedWindowAfter; step += 1) {
    const candidateNumber = sequenceNumeric + resolvedIncrement * step;
    const entry = entryMap.get(candidateNumber);
    if (entry && isLedgerEntryActive(entry)) {
      usedAfter.push(formatLedgerEntry({ entry, prefix, sequenceLength, step }));
      break;
    }
    if (!entry) {
      availableAfter.push(formatAvailable({ number: candidateNumber, step }));
    }
  }

  const gatherUsedAfterExtended = () => {
    const results = [];
    for (let step = 1; step <= resolvedWindowAfter; step += 1) {
      const candidateNumber = sequenceNumeric + resolvedIncrement * step;
      const entry = entryMap.get(candidateNumber);
      if (entry && isLedgerEntryActive(entry)) {
        results.push(formatLedgerEntry({ entry, prefix, sequenceLength, step }));
      }
    }
    return results;
  };

  const gatherUsedBeforeExtended = () => {
    const results = [];
    for (let step = 1; step <= resolvedWindowBefore; step += 1) {
      const candidateNumber = sequenceNumeric - resolvedIncrement * step;
      if (candidateNumber < 0) break;
      const entry = entryMap.get(candidateNumber);
      if (entry && isLedgerEntryActive(entry)) {
        results.push(formatLedgerEntry({ entry, prefix, sequenceLength, step }));
      }
    }
    return results;
  };

  const usedBeforeFull = gatherUsedBeforeExtended();
  const usedAfterFull = gatherUsedAfterExtended();

  const hasCurrentConflict = isLedgerEntryActive(targetEntry);
  const nextNumber = sequenceNumeric + resolvedIncrement;
  const nextEntry = entryMap.get(nextNumber);
  const hasImmediateNextConflict = isLedgerEntryActive(nextEntry);

  const conflicts = hasCurrentConflict
    ? Array.isArray(targetEntry?.invoices) ? targetEntry.invoices : []
    : hasImmediateNextConflict
    ? (Array.isArray(nextEntry?.invoices) ? nextEntry.invoices : [])
    : [];

  const currentConflict = hasCurrentConflict
    ? formatLedgerEntry({ entry: targetEntry, prefix, sequenceLength, step: 0 })
    : null;

  const lastNumber = Number(metadata.lastNumber ?? metadata.lastNumberString);
  let lastUsed = null;
  if (Number.isFinite(lastNumber)) {
    let lastEntry = entryMap.get(lastNumber);
    if (!lastEntry) {
      const lastDoc = await entriesRef
        .where('sequenceNumber', '==', lastNumber)
        .limit(1)
        .get();
      if (!lastDoc.empty) {
        lastEntry = lastDoc.docs[0].data();
      }
    }
    if (lastEntry) {
      const stepDiff = resolvedIncrement > 0
        ? Math.max(Math.floor((lastNumber - sequenceNumeric) / resolvedIncrement), 0)
        : 0;
      lastUsed = formatLedgerEntry({
        entry: lastEntry,
        prefix,
        sequenceLength,
        step: stepDiff,
      });
    }
  }

  const nextDigitsNormalized = normalizeDigits(nextNumber.toString());
  const nextDigitsPadded = nextDigitsNormalized.padStart(sequenceLength, '0');

  const limitReport = (items) => {
    if (!Array.isArray(items)) return [];
    return items.slice(0, LEDGER_MAX_REPORT_ITEMS);
  };

  const insights = {
    currentConflict,
    availableBefore: limitReport(availableBefore),
    availableAfter: limitReport(availableAfter),
    usedBefore: limitReport(usedBeforeFull),
    usedAfter: limitReport(usedAfterFull),
    lastUsed,
  };

  return {
    source: 'ledger',
    ok: !hasCurrentConflict && !hasImmediateNextConflict,
    reason: hasCurrentConflict
      ? 'current-sequence-used'
      : hasImmediateNextConflict
      ? 'next-sequence-used'
      : undefined,
    prefix,
    sequenceNumber: sequenceNumeric,
    normalizedDigits: normalizeDigits(normalizedDigits ?? sequenceNumeric.toString()),
    nextNumber,
    nextDigits: nextDigitsPadded,
    nextDigitsLength: nextDigitsPadded.length,
    hasCurrentConflict,
    hasImmediateNextConflict,
    conflicts,
    insights,
    metadata: {
      duplicatesCount: metadata.duplicatesCount ?? 0,
      lastNumber: metadata.lastNumber ?? null,
      lastNumberString: metadata.lastNumberString ?? null,
      lastNcf: metadata.lastNcf ?? null,
      lastInvoiceId: metadata.lastInvoiceId ?? null,
      lastIssuedAt: metadata.lastIssuedAt ?? null,
      totalEntries: metadata.totalEntries ?? 0,
    },
    coverage: {
      windowBefore: resolvedWindowBefore,
      windowAfter: resolvedWindowAfter,
      increment: resolvedIncrement,
      quantitySteps: Number(quantitySteps) || 0,
    },
  };
};
