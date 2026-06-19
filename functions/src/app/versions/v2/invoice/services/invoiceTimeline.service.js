import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';

export const INVOICE_TIMELINE_COLLECTION = 'timeline';
export const INVOICE_TIMELINE_SCHEMA_VERSION = 1;

const isPlainObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const stripUndefined = (value) => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefined(item))
      .filter((item) => item !== undefined);
  }
  if (!isPlainObject(value)) return value;

  const entries = Object.entries(value)
    .map(([key, item]) => [key, stripUndefined(item)])
    .filter(([, item]) => item !== undefined);

  return Object.fromEntries(entries);
};

const compactPlainObject = (value, fieldName) => {
  if (value == null) return null;
  if (!isPlainObject(value)) {
    throw new TypeError(`invoiceTimeline ${fieldName} debe ser un objeto plano`);
  }

  const compacted = stripUndefined(value);
  return Object.keys(compacted).length ? compacted : null;
};

export function normalizeInvoiceTimelineIds({
  businessId,
  invoiceId,
  eventId,
} = {}) {
  const normalizedBusinessId = toCleanString(businessId);
  const normalizedInvoiceId = toCleanString(invoiceId);
  const normalizedEventId = toCleanString(eventId);

  if (!normalizedBusinessId || !normalizedInvoiceId || !normalizedEventId) {
    throw new TypeError('businessId, invoiceId y eventId son requeridos');
  }

  return {
    businessId: normalizedBusinessId,
    invoiceId: normalizedInvoiceId,
    eventId: normalizedEventId,
  };
}

export function buildInvoiceTimelineEvent({
  businessId,
  invoiceId,
  eventId,
  type,
  status,
  at,
  source,
  actorId,
  taskId,
  correlationId,
  metadata,
  payload,
  createdAt,
  updatedAt,
} = {}) {
  const ids = normalizeInvoiceTimelineIds({ businessId, invoiceId, eventId });
  const normalizedStatus = toCleanString(status);
  const normalizedType = toCleanString(type) || (normalizedStatus ? 'status' : null);

  if (!normalizedType) {
    throw new TypeError('invoiceTimeline requiere type o status');
  }

  const event = {
    id: ids.eventId,
    eventId: ids.eventId,
    businessId: ids.businessId,
    invoiceId: ids.invoiceId,
    type: normalizedType,
    schemaVersion: INVOICE_TIMELINE_SCHEMA_VERSION,
    at: at ?? Timestamp.now(),
    createdAt: createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: updatedAt ?? FieldValue.serverTimestamp(),
  };

  if (normalizedStatus) event.status = normalizedStatus;

  const normalizedSource = toCleanString(source);
  if (normalizedSource) event.source = normalizedSource;

  const normalizedActorId = toCleanString(actorId);
  if (normalizedActorId) event.actorId = normalizedActorId;

  const normalizedTaskId = toCleanString(taskId);
  if (normalizedTaskId) event.taskId = normalizedTaskId;

  const normalizedCorrelationId = toCleanString(correlationId);
  if (normalizedCorrelationId) event.correlationId = normalizedCorrelationId;

  const compactedMetadata = compactPlainObject(metadata, 'metadata');
  if (compactedMetadata) event.metadata = compactedMetadata;

  const compactedPayload = compactPlainObject(payload, 'payload');
  if (compactedPayload) event.payload = compactedPayload;

  return event;
}

export function buildInvoiceTimelinePaths({ businessId, invoiceId, eventId }) {
  const ids = normalizeInvoiceTimelineIds({ businessId, invoiceId, eventId });
  const invoicePath = `businesses/${ids.businessId}/invoicesV2/${ids.invoiceId}`;

  return {
    ...ids,
    invoicePath,
    timelineEventPath: `${invoicePath}/${INVOICE_TIMELINE_COLLECTION}/${ids.eventId}`,
  };
}

export function buildLegacyStatusTimelinePatch({
  event,
  legacyStatusTimelineEntry,
  updatedAt,
} = {}) {
  if (!legacyStatusTimelineEntry) return null;
  if (!isPlainObject(event)) {
    throw new TypeError('invoiceTimeline requiere event para statusTimeline legacy');
  }

  const rawEntry =
    legacyStatusTimelineEntry === true
      ? {
          status: event.status,
          at: event.at,
        }
      : {
          status: event.status,
          at: event.at,
          ...legacyStatusTimelineEntry,
        };
  const entry = compactPlainObject(rawEntry, 'legacyStatusTimelineEntry');

  if (!toCleanString(entry?.status)) {
    throw new TypeError(
      'invoiceTimeline legacyStatusTimelineEntry requiere status',
    );
  }
  if (entry.at == null) {
    throw new TypeError('invoiceTimeline legacyStatusTimelineEntry requiere at');
  }

  return {
    statusTimeline: FieldValue.arrayUnion(entry),
    updatedAt: updatedAt ?? FieldValue.serverTimestamp(),
  };
}

export async function writeInvoiceTimelineEventInTransaction({
  transaction,
  invoiceRef,
  timelineEventRef,
  legacyStatusTimelineEntry = null,
  legacyUpdatedAt,
  ...eventInput
} = {}) {
  if (!transaction || typeof transaction.get !== 'function') {
    throw new TypeError('invoiceTimeline requiere transaction');
  }
  if (!invoiceRef) {
    throw new TypeError('invoiceTimeline requiere invoiceRef');
  }
  if (!timelineEventRef) {
    throw new TypeError('invoiceTimeline requiere timelineEventRef');
  }

  const event = buildInvoiceTimelineEvent(eventInput);
  const eventSnap = await transaction.get(timelineEventRef);
  const path = timelineEventRef.path || null;

  if (eventSnap?.exists) {
    return {
      status: 'skipped',
      reason: 'already_exists',
      eventId: event.eventId,
      path,
    };
  }

  transaction.set(timelineEventRef, event);

  const legacyPatch = buildLegacyStatusTimelinePatch({
    event,
    legacyStatusTimelineEntry,
    updatedAt: legacyUpdatedAt,
  });
  if (legacyPatch) {
    transaction.update(invoiceRef, legacyPatch);
  }

  return {
    status: 'written',
    eventId: event.eventId,
    path,
    legacyStatusTimelinePatched: Boolean(legacyPatch),
  };
}

export function upsertInvoiceTimelineEventInTransaction({
  transaction,
  timelineEventRef,
  ...eventInput
} = {}) {
  if (!transaction || typeof transaction.set !== 'function') {
    throw new TypeError('invoiceTimeline requiere transaction.set');
  }
  if (!timelineEventRef) {
    throw new TypeError('invoiceTimeline requiere timelineEventRef');
  }

  const event = buildInvoiceTimelineEvent(eventInput);
  transaction.set(timelineEventRef, event, { merge: true });

  return {
    status: 'upserted',
    eventId: event.eventId,
    path: timelineEventRef.path || null,
  };
}

export async function writeInvoiceTimelineEvent({
  firestore = db,
  ...options
} = {}) {
  if (!firestore || typeof firestore.runTransaction !== 'function') {
    throw new TypeError('invoiceTimeline requiere firestore.runTransaction');
  }
  if (typeof firestore.doc !== 'function') {
    throw new TypeError('invoiceTimeline requiere firestore.doc');
  }

  const paths = buildInvoiceTimelinePaths(options);
  const invoiceRef = firestore.doc(paths.invoicePath);
  const timelineEventRef = firestore.doc(paths.timelineEventPath);

  return firestore.runTransaction((transaction) =>
    writeInvoiceTimelineEventInTransaction({
      ...options,
      transaction,
      invoiceRef,
      timelineEventRef,
    }),
  );
}
