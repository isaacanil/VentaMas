import type {
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

import type {
  AccountsReceivableDoc,
  ReceivableInvoice,
} from '../types';

export const toMillis = (value?: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof (value as { toMillis?: () => number })?.toMillis === 'function') {
    const ms = (value as { toMillis: () => number }).toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  if (
    typeof value === 'object' &&
    typeof (value as { seconds?: number }).seconds === 'number' &&
    typeof (value as { nanoseconds?: number }).nanoseconds === 'number'
  ) {
    const seconds = (value as { seconds: number }).seconds;
    const nanos = (value as { nanoseconds: number }).nanoseconds;
    return seconds * 1000 + Math.floor(nanos / 1e6);
  }
  return null;
};

export const mapInvoiceDoc = (
  docSnap: QueryDocumentSnapshot<DocumentData>,
): ReceivableInvoice => {
  const payload = docSnap.data() || {};
  const canonical = payload?.data || {};
  const totals = canonical?.totalPurchase?.value ?? canonical?.payment?.value;
  const totalAmount = Number.isFinite(Number(totals)) ? Number(totals) : 0;

  const createdAt =
    toMillis(canonical?.date) ||
    toMillis(canonical?.createdAt) ||
    toMillis(payload?.createdAt) ||
    null;

  return {
    invoiceId: docSnap.id,
    number:
      canonical?.numberID ||
      canonical?.number ||
      canonical?.invoiceNumber ||
      null,
    ncf: canonical?.NCF ?? null,
    clientName: canonical?.client?.name || 'Sin cliente',
    totalAmount,
    createdAt,
    status: canonical?.status || null,
  };
};

export const mapAccountsReceivableDoc = (
  docSnap: QueryDocumentSnapshot<DocumentData>,
): AccountsReceivableDoc => {
  const data = docSnap.data() || {};
  const totalReceivable = Number(data?.totalReceivable);
  const arBalance = Number(data?.arBalance);

  return {
    id: docSnap.id,
    invoiceId: data?.invoiceId || null,
    totalReceivable: Number.isFinite(totalReceivable)
      ? totalReceivable
      : undefined,
    arBalance: Number.isFinite(arBalance) ? arBalance : undefined,
    createdAt:
      toMillis(data?.createdAt) ||
      toMillis(docSnap.get('createdAt')) ||
      null,
  };
};

export const chunkArray = <T,>(items: T[], size: number): T[][] => {
  if (!Array.isArray(items) || size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};
