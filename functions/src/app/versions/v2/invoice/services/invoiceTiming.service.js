import { FieldValue } from '../../../../core/config/firebase.js';

export const INVOICE_TIMING_VERSION = 1;
export const INVOICE_TIMING_ROOT = 'invoiceTiming';

export const INVOICE_TIMING_STAGES = Object.freeze([
  'created',
  'canonical_done',
  'inventory_done',
  'fiscal_done',
  'cash_count_done',
  'print_ready',
  'committed',
]);

const INVOICE_TIMING_STAGE_SET = new Set(INVOICE_TIMING_STAGES);

const isPlainObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

function resolveInvoiceData(invoice) {
  if (!invoice) return null;
  if (typeof invoice.data === 'function') {
    return invoice.data() || null;
  }
  return invoice;
}

function compactMetadata(metadata) {
  if (metadata == null) return null;
  if (!isPlainObject(metadata)) {
    throw new TypeError('invoiceTiming metadata debe ser un objeto plano');
  }

  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== undefined,
  );
  return entries.length ? Object.fromEntries(entries) : null;
}

export function normalizeInvoiceTimingStage(stage) {
  const normalizedStage = String(stage || '').trim();
  if (!INVOICE_TIMING_STAGE_SET.has(normalizedStage)) {
    throw new TypeError(
      `invoiceTiming stage no soportado: ${normalizedStage || '<vacio>'}`,
    );
  }
  return normalizedStage;
}

export function readInvoiceTimingTimestamp(invoice, stage) {
  const normalizedStage = normalizeInvoiceTimingStage(stage);
  const invoiceData = resolveInvoiceData(invoice);
  return (
    invoiceData?.[INVOICE_TIMING_ROOT]?.timestamps?.[normalizedStage] ?? null
  );
}

export function hasInvoiceTimingTimestamp(invoice, stage) {
  return readInvoiceTimingTimestamp(invoice, stage) != null;
}

export function buildInvoiceTimingPatch({
  stage,
  at,
  metadata,
  updatedAt,
} = {}) {
  const normalizedStage = normalizeInvoiceTimingStage(stage);
  const timestampValue = at ?? FieldValue.serverTimestamp();
  const updatedAtValue = updatedAt ?? FieldValue.serverTimestamp();
  const patch = {
    [`${INVOICE_TIMING_ROOT}.version`]: INVOICE_TIMING_VERSION,
    [`${INVOICE_TIMING_ROOT}.timestamps.${normalizedStage}`]: timestampValue,
    [`${INVOICE_TIMING_ROOT}.updatedAt`]: updatedAtValue,
  };

  const compactedMetadata = compactMetadata(metadata);
  if (compactedMetadata) {
    patch[`${INVOICE_TIMING_ROOT}.metadata.${normalizedStage}`] =
      compactedMetadata;
  }

  return patch;
}

export function buildInvoiceTimingSeed({ at, metadata, updatedAt } = {}) {
  const timestampValue = at ?? FieldValue.serverTimestamp();
  const updatedAtValue = updatedAt ?? FieldValue.serverTimestamp();
  const seed = {
    [INVOICE_TIMING_ROOT]: {
      version: INVOICE_TIMING_VERSION,
      timestamps: {
        created: timestampValue,
      },
      updatedAt: updatedAtValue,
    },
  };

  const compactedMetadata = compactMetadata(metadata);
  if (compactedMetadata) {
    seed[INVOICE_TIMING_ROOT].metadata = {
      created: compactedMetadata,
    };
  }

  return seed;
}

export async function markInvoiceTimingStage({
  invoiceRef,
  transaction,
  invoice,
  stage,
  at,
  metadata,
  updatedAt,
} = {}) {
  const normalizedStage = normalizeInvoiceTimingStage(stage);
  const invoiceData = resolveInvoiceData(invoice);

  if (!invoiceData || typeof invoiceData !== 'object') {
    throw new TypeError(
      'invoiceTiming requiere el invoice actual para preservar idempotencia',
    );
  }
  if (!invoiceRef) {
    throw new TypeError('invoiceTiming requiere invoiceRef');
  }
  if (hasInvoiceTimingTimestamp(invoiceData, normalizedStage)) {
    return {
      status: 'skipped',
      reason: 'already_marked',
      stage: normalizedStage,
    };
  }

  const patch = buildInvoiceTimingPatch({
    stage: normalizedStage,
    at,
    metadata,
    updatedAt,
  });

  if (transaction) {
    transaction.update(invoiceRef, patch);
  } else {
    if (typeof invoiceRef.update !== 'function') {
      throw new TypeError('invoiceTiming invoiceRef.update no disponible');
    }
    await invoiceRef.update(patch);
  }

  return {
    status: 'written',
    stage: normalizedStage,
  };
}
