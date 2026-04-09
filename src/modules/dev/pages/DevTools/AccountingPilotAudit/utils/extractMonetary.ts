import type { MonetaryInfo, AuditRow } from '../types';

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const safeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const safeString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const timestampToMillis = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const ts = value as Record<string, unknown>;
    if (typeof ts.toMillis === 'function') return (ts as { toMillis: () => number }).toMillis();
    if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  }
  return null;
};

const getCandidateDocs = (
  rawDoc: Record<string, unknown>,
): Record<string, unknown>[] => {
  const candidates = [
    rawDoc,
    asRecord(rawDoc.data),
    asRecord(rawDoc.expense),
    asRecord(rawDoc.invoice),
  ];

  return candidates.filter((candidate) => Object.keys(candidate).length > 0);
};

const resolveFirstNumber = (
  docs: Record<string, unknown>[],
  selector: (doc: Record<string, unknown>) => unknown,
): number | null => {
  for (const doc of docs) {
    const value = safeNumber(selector(doc));
    if (value !== null) {
      return value;
    }
  }
  return null;
};

const resolveFirstTimestamp = (
  docs: Record<string, unknown>[],
  selector: (doc: Record<string, unknown>) => unknown,
): number | null => {
  for (const doc of docs) {
    const value = timestampToMillis(selector(doc));
    if (value !== null) {
      return value;
    }
  }
  return null;
};

/** Extract and normalize the monetary snapshot from a raw Firestore document. */
export const extractMonetary = (rawDoc: Record<string, unknown>): MonetaryInfo | null => {
  const docs = getCandidateDocs(rawDoc);
  const monetaryRaw = docs
    .map((doc) => doc.monetary)
    .find((value) => value !== null && value !== undefined);

  if (monetaryRaw === null || monetaryRaw === undefined) return null;

  const m = asRecord(monetaryRaw);
  if (!Object.keys(m).length) return null;

  const docCurrencyRaw = m.documentCurrency ?? m.currency;
  const funcCurrencyRaw = m.functionalCurrency ?? m.baseCurrency;
  const exchangeRaw = asRecord(m.exchangeRateSnapshot ?? m.exchangeRate ?? m.rate);

  const documentCurrency =
    safeString(asRecord(docCurrencyRaw).code ?? docCurrencyRaw);
  const functionalCurrency =
    safeString(asRecord(funcCurrencyRaw).code ?? funcCurrencyRaw) ?? 'DOP';
  const rate = safeNumber(exchangeRaw.rate ?? exchangeRaw.value);
  const capturedAt = timestampToMillis(m.capturedAt);

  const snippetParts: string[] = [];
  if (documentCurrency) snippetParts.push(`doc:${documentCurrency}`);
  if (functionalCurrency) snippetParts.push(`func:${functionalCurrency}`);
  if (rate !== null) snippetParts.push(`rate:${rate}`);
  const docTotals = asRecord(m.documentTotals);
  const total = safeNumber(docTotals.total);
  if (total !== null) snippetParts.push(`total:${total}`);

  return {
    documentCurrency,
    functionalCurrency,
    rate,
    capturedAt,
    snippet: snippetParts.join(' | ') || '(no details)',
  };
};

/** Resolve the most relevant date from a raw document depending on the collection. */
export const resolveDate = (rawDoc: Record<string, unknown>): number | null => {
  const docs = getCandidateDocs(rawDoc);

  return resolveFirstTimestamp(
    docs,
    (doc) =>
      doc.updatedAt ??
      doc.createdAt ??
      asRecord(doc.dates).createdAt ??
      asRecord(doc.dates).expenseDate ??
      doc.date ??
      doc.deliveryAt ??
      doc.paymentAt,
  );
};

/** Resolve the primary amount for display from a raw document. */
export const resolveAmount = (rawDoc: Record<string, unknown>): number | null => {
  const docs = getCandidateDocs(rawDoc);

  return resolveFirstNumber(
    docs,
    (doc) =>
      doc.totalAmount ??
      doc.amount ??
      asRecord(doc.totalPurchase).value ??
      doc.total ??
      asRecord(doc.documentTotals).total,
  );
};

/** Map a raw Firestore document to an AuditRow. */
export const toAuditRow = (id: string, rawDoc: Record<string, unknown>): AuditRow => {
  const monetary = extractMonetary(rawDoc);
  return {
    id,
    date: resolveDate(rawDoc),
    amount: resolveAmount(rawDoc),
    hasMonetary: monetary !== null,
    monetary,
  };
};
