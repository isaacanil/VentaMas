import type {
  AccountsReceivableDoc,
  ReceivableInvoice,
} from '../types';
import type {
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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
  const payload = docSnap.data();
  const payloadRecord = isRecord(payload) ? payload : {};
  const canonical = isRecord(payloadRecord.data) ? payloadRecord.data : {};

  const totalPurchaseValue = isRecord(canonical.totalPurchase)
    ? canonical.totalPurchase.value
    : undefined;
  const paymentValue = isRecord(canonical.payment)
    ? canonical.payment.value
    : undefined;

  const totalAmountValue = totalPurchaseValue ?? paymentValue;
  const totalAmount = Number.isFinite(Number(totalAmountValue))
    ? Number(totalAmountValue)
    : 0;

  const createdAt =
    toMillis(canonical?.date) ||
    toMillis(canonical?.createdAt) ||
    toMillis(payload?.createdAt) ||
    null;

  return {
    invoiceId: docSnap.id,
    number:
      (typeof canonical?.numberID === 'string' || typeof canonical?.numberID === 'number'
        ? canonical.numberID
        : null) ||
      (typeof canonical?.number === 'string' || typeof canonical?.number === 'number'
        ? canonical.number
        : null) ||
      (typeof canonical?.invoiceNumber === 'string' ||
      typeof canonical?.invoiceNumber === 'number'
        ? canonical.invoiceNumber
        : null),
    ncf: typeof canonical?.NCF === 'string' ? canonical.NCF : null,
    clientName:
      (isRecord(canonical?.client) &&
        typeof canonical.client.name === 'string' &&
        canonical.client.name) ||
      'Sin cliente',
    totalAmount,
    createdAt,
    status: typeof canonical?.status === 'string' ? canonical.status : null,
  };
};

export const mapAccountsReceivableDoc = (
  docSnap: QueryDocumentSnapshot<DocumentData>,
): AccountsReceivableDoc => {
  const data = docSnap.data();
  const dataRecord = isRecord(data) ? data : {};
  const totalReceivable = Number(dataRecord.totalReceivable);
  const arBalance = Number(dataRecord.arBalance);
  const invoiceId =
    typeof dataRecord.invoiceId === 'string' ? dataRecord.invoiceId : null;

  return {
    id: docSnap.id,
    invoiceId,
    totalReceivable: Number.isFinite(totalReceivable)
      ? totalReceivable
      : undefined,
    arBalance: Number.isFinite(arBalance) ? arBalance : undefined,
    createdAt:
      toMillis(dataRecord.createdAt) ||
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
