import { DateTime } from 'luxon';

export type OptionItem = {
  value: string;
  label: string;
};

export type InvoiceOptionMeta = {
  hasV2: boolean;
  v2Status: string;
  source: string;
  registeredInInvoices: boolean;
  hasDateMismatch: boolean;
  canonicalDate?: unknown;
  v2CreatedAt?: unknown;
};

export type InvoiceOptionEntry = OptionItem & {
  meta: InvoiceOptionMeta;
};

type TimestampLike = {
  seconds?: number;
  _seconds?: number;
  toDate?: () => Date;
};

export const parseTimestamp = (value: unknown): DateTime | null => {
  if (!value) return null;
  if (DateTime.isDateTime(value)) return value;
  if (typeof value === 'number') return DateTime.fromMillis(value);
  if (typeof value === 'string') {
    const iso = DateTime.fromISO(value);
    return iso.isValid ? iso : DateTime.fromJSDate(new Date(value));
  }
  if (typeof value === 'object') {
    const timestamp = value as TimestampLike;
    if (typeof timestamp.seconds === 'number') {
      return DateTime.fromSeconds(timestamp.seconds);
    }
    if (typeof timestamp._seconds === 'number') {
      return DateTime.fromSeconds(timestamp._seconds);
    }
    if (typeof timestamp.toDate === 'function') {
      return DateTime.fromJSDate(timestamp.toDate());
    }
  }
  return null;
};

export const formatDateTime = (value: unknown, fallback = '\u2014'): string => {
  const parsed = parseTimestamp(value);
  return parsed ? parsed.toFormat('dd/MM/yyyy HH:mm:ss') : fallback;
};

export const parseCounterNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
};

export function buildInvoiceV2Suggestions(params: {
  v2Docs: Array<{ id: string; data: Record<string, unknown> }>;
  canonicalById: Record<string, { date?: unknown } | null>;
}): { options: OptionItem[]; lookup: Record<string, InvoiceOptionMeta> } {
  const { v2Docs, canonicalById } = params;

  const canonicalIds = new Set(Object.keys(canonicalById));

  const entries: InvoiceOptionEntry[] = v2Docs.map(({ id, data }) => {
    const raw = toRecord(data);
    const snapshotData = (raw.snapshot as Record<string, unknown>) || {};
    const snapshot = toRecord(snapshotData) as Record<string, unknown>;
    const cart = toRecord(snapshot.cart ?? raw.cart);

    const invoiceNumber =
      (cart.numberID as string | number | null | undefined) ??
      (cart.number as string | number | null | undefined) ??
      (raw.numberID as string | number | null | undefined) ??
      null;

    const snapshotNcf = toRecord(snapshot.ncf);
    const ncf =
      (snapshotNcf.code as string | null | undefined) ||
      (cart.NCF as string | null | undefined) ||
      (cart.ncf as string | null | undefined) ||
      null;

    const snapshotClient = toRecord(snapshot.client);
    const cartClient = toRecord(cart.client);
    const clientName =
      (snapshotClient.name as string | null | undefined) ||
      (cartClient.name as string | null | undefined) ||
      null;

    const invoiceStatus = (raw.status as string | undefined) || 'pending';
    const createdAtSource = raw.createdAt ?? snapshot.createdAt ?? null;

    const canonicalDoc = canonicalById[id] || null;
    const canonicalDateSource = canonicalDoc?.date ?? null;

    const v2CreatedAtTs = parseTimestamp(createdAtSource);
    const canonicalDateTs = parseTimestamp(canonicalDateSource);

    const hasCanonical = canonicalIds.has(id);
    const hasDateMismatch =
      hasCanonical &&
      Boolean(
        v2CreatedAtTs &&
          canonicalDateTs &&
          canonicalDateTs.toMillis() !== v2CreatedAtTs.toMillis(),
      );

    const labelParts: string[] = [];
    const createdAtLabel = formatDateTime(createdAtSource);
    const canonicalLabel = formatDateTime(canonicalDateSource);

    if (createdAtLabel && createdAtLabel !== '\u2014') {
      labelParts.push(createdAtLabel);
    }
    if (invoiceNumber != null) labelParts.push(`#${invoiceNumber}`);
    if (ncf) labelParts.push(`NCF ${ncf}`);
    if (clientName) labelParts.push(clientName);
    if (canonicalLabel && hasDateMismatch) {
      labelParts.push(`Fecha invoices: ${canonicalLabel}`);
    }
    labelParts.push(`[V2 ${invoiceStatus}]`);
    labelParts.push(id);
    if (hasCanonical) {
      labelParts.push('CON DOCUMENTO EN invoices');
      if (hasDateMismatch) {
        labelParts.push('FECHA DIFERENTE');
      }
    } else {
      labelParts.push('SIN DOCUMENTO EN invoices');
    }

    return {
      value: id,
      label: labelParts.join(' \u00b7 '),
      meta: {
        hasV2: true,
        v2Status: invoiceStatus,
        source: hasCanonical ? 'v2-and-invoices' : 'v2-only',
        registeredInInvoices: hasCanonical,
        hasDateMismatch,
        canonicalDate: canonicalDateSource || null,
        v2CreatedAt: createdAtSource || null,
      },
    };
  });

  const options: OptionItem[] = entries.map(({ value, label }) => ({
    value,
    label,
  }));

  const lookup: Record<string, InvoiceOptionMeta> = {};
  for (const entry of entries) {
    lookup[entry.value] = entry.meta || ({} as InvoiceOptionMeta);
  }

  return { options, lookup };
}

export function buildInvoiceNumberUpdates(parsedNumber: number): {
  canonicalUpdates: Record<string, unknown>;
  v2Updates: Record<string, unknown>;
} {
  return {
    canonicalUpdates: {
      numberID: parsedNumber,
      number: parsedNumber,
      invoiceNumber: parsedNumber,
      'data.numberID': parsedNumber,
      'data.number': parsedNumber,
      'data.invoiceNumber': parsedNumber,
    },
    v2Updates: {
      numberID: parsedNumber,
      number: parsedNumber,
      invoiceNumber: parsedNumber,
      'snapshot.numberID': parsedNumber,
      'snapshot.number': parsedNumber,
      'snapshot.cart.numberID': parsedNumber,
      'snapshot.cart.number': parsedNumber,
      'snapshot.cart.invoiceNumber': parsedNumber,
      'cart.numberID': parsedNumber,
      'cart.number': parsedNumber,
    },
  };
}

