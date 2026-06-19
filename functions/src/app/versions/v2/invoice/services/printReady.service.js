import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';
import { markInvoiceTimingStage } from './invoiceTiming.service.js';
import { upsertInvoiceTimelineEventInTransaction } from './invoiceTimeline.service.js';

export const PRINT_READY_STATUSES = Object.freeze({
  READY: 'print_ready',
  READY_WITH_REVIEW: 'print_ready_with_review',
});

export const FRONTEND_READY_COMPATIBLE_STATUSES = Object.freeze([
  'frontend_ready',
  PRINT_READY_STATUSES.READY,
  PRINT_READY_STATUSES.READY_WITH_REVIEW,
  'committed',
]);

const TASK_TYPES = Object.freeze({
  CANONICAL: 'createCanonicalInvoice',
  INVENTORY: 'updateInventory',
  ELECTRONIC_TAX_RECEIPT: 'issueElectronicTaxReceipt',
  CASH_COUNT: 'attachToCashCount',
  ACCOUNTS_RECEIVABLE: 'setupAR',
  CREDIT_NOTES: 'consumeCreditNotes',
  INSURANCE_AR: 'setupInsuranceAR',
});

const DONE_TASK_STATUSES = new Set(['done', 'completed', 'success', 'skipped']);
const FAILED_TASK_STATUSES = new Set(['failed']);
const ELECTRONIC_READY_STATUSES = new Set([
  'accepted',
  'accepted_conditional',
  'issued',
  'submitted',
  'shadow_ready',
  'signed_local',
]);
const ELECTRONIC_FAILURE_STATUSES = new Set([
  'error',
  'failed',
  'local_failed',
  'rejected',
]);
const ELECTRONIC_PENDING_STATUSES = new Set([
  'not_checked',
  'pending',
  'queued',
]);
const ELECTRONIC_FAILURE_POLICY_BY_MODE = Object.freeze({
  pilot: 'review',
  shadow: 'review',
  required: 'block',
  unknown: 'block',
});

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeToken = (value) => toCleanString(value)?.toLowerCase() || null;

const readOutboxTaskData = (taskLike) =>
  typeof taskLike?.data === 'function' ? taskLike.data() || {} : taskLike || {};

const normalizeOutboxTask = (taskLike) => {
  const data = readOutboxTaskData(taskLike);
  const type = toCleanString(data?.type);
  if (!type) return null;

  return {
    id: toCleanString(taskLike?.id) || toCleanString(data?.id) || null,
    type,
    status: normalizeToken(data?.status) || 'pending',
    lastError: toCleanString(data?.lastError) || null,
    payload: asRecord(data?.payload),
    result: asRecord(data?.result),
    raw: data,
  };
};

export const summarizePrintReadyOutboxTasks = (taskLikes = []) => {
  const tasks = (Array.isArray(taskLikes) ? taskLikes : [])
    .map(normalizeOutboxTask)
    .filter(Boolean);
  const byType = {};

  for (const task of tasks) {
    const existing = byType[task.type] || {
      type: task.type,
      total: 0,
      done: 0,
      failed: 0,
      pending: 0,
      tasks: [],
    };

    existing.total += 1;
    existing.tasks.push(task);
    if (DONE_TASK_STATUSES.has(task.status)) {
      existing.done += 1;
    } else if (FAILED_TASK_STATUSES.has(task.status)) {
      existing.failed += 1;
    } else {
      existing.pending += 1;
    }
    byType[task.type] = existing;
  }

  return {
    tasks,
    byType,
    taskTypes: Object.keys(byType),
  };
};

const normalizeOutboxSummary = (outboxSummary) => {
  if (Array.isArray(outboxSummary)) {
    return summarizePrintReadyOutboxTasks(outboxSummary);
  }
  if (Array.isArray(outboxSummary?.tasks)) {
    return summarizePrintReadyOutboxTasks(outboxSummary.tasks);
  }
  if (outboxSummary?.byType && typeof outboxSummary.byType === 'object') {
    const tasks = Object.values(outboxSummary.byType).flatMap((entry) =>
      Array.isArray(entry?.tasks) ? entry.tasks : [],
    );
    return summarizePrintReadyOutboxTasks(tasks);
  }
  return summarizePrintReadyOutboxTasks([]);
};

const tasksForType = (summary, type) =>
  Array.isArray(summary?.byType?.[type]?.tasks)
    ? summary.byType[type].tasks
    : [];

const resolveTaskState = (tasks) => {
  if (!tasks.length) return 'missing';
  if (tasks.some((task) => FAILED_TASK_STATUSES.has(task.status))) {
    return 'failed';
  }
  if (tasks.every((task) => DONE_TASK_STATUSES.has(task.status))) {
    return 'done';
  }
  return 'pending';
};

const hasInventoryWork = (task) => {
  const products = Array.isArray(task?.payload?.products)
    ? task.payload.products
    : null;
  if (!products) return true;
  return products.some((product) =>
    Boolean(
      product?.trackInventory === true ||
      toCleanString(product?.productStockId) ||
      toCleanString(product?.batchId),
    ),
  );
};

const isFrontendReadyCompatibleInvoice = (invoice) =>
  FRONTEND_READY_COMPATIBLE_STATUSES.includes(
    normalizeToken(invoice?.status),
  ) || Boolean(invoice?.frontendReadyAt);

const resolveElectronicSnapshot = (invoice) => {
  const invoiceRecord = asRecord(invoice);
  const snapshot = asRecord(invoiceRecord.snapshot);
  const fiscal = asRecord(invoiceRecord.fiscal);
  return (
    [
      asRecord(snapshot.electronicTaxReceipt),
      asRecord(invoiceRecord.electronicTaxReceipt),
      asRecord(fiscal.electronic),
    ].find(hasRecordData) || {}
  );
};

const hasRecordData = (value) => Object.keys(asRecord(value)).length > 0;

const expectsElectronicTaxReceipt = ({ invoice, electronicTasks }) => {
  if (electronicTasks.length > 0) return true;
  const invoiceRecord = asRecord(invoice);
  const snapshot = asRecord(invoiceRecord.snapshot);
  const ncf = asRecord(snapshot.ncf);
  return Boolean(
    snapshot.fiscalMode === 'electronic_ecf' ||
    snapshot.documentFormat === 'electronic' ||
    ncf.documentFormat === 'electronic' ||
    hasRecordData(snapshot.electronicTaxReceipt) ||
    hasRecordData(invoiceRecord.electronicTaxReceipt),
  );
};

const resolveElectronicMode = ({ electronicSnapshot, electronicTasks }) => {
  const fromSnapshot = normalizeToken(electronicSnapshot?.mode);
  if (['pilot', 'shadow', 'required'].includes(fromSnapshot)) {
    return fromSnapshot;
  }

  for (const task of electronicTasks) {
    const fromPayload = normalizeToken(task?.payload?.mode);
    if (['pilot', 'shadow', 'required'].includes(fromPayload)) {
      return fromPayload;
    }
  }

  return 'unknown';
};

const resolveElectronicStatus = ({ electronicSnapshot, electronicTasks }) => {
  const snapshotStatus = normalizeToken(electronicSnapshot?.status);
  if (snapshotStatus) return snapshotStatus;

  for (const task of electronicTasks) {
    const resultStatus = normalizeToken(task?.result?.status);
    if (resultStatus) return resultStatus;
  }

  return null;
};

const createIssue = ({ type, code, status = null, message = null }) => ({
  type,
  code,
  status,
  message,
});

const addTaskBlocker = ({ blockers, type, state, code, message }) => {
  if (state === 'done' || state === 'missing') return;
  blockers.push(
    createIssue({
      type,
      code,
      status: state,
      message,
    }),
  );
};

const requireCompletedTaskType = ({
  summary,
  type,
  blockers,
  code,
  message,
}) => {
  const state = resolveTaskState(tasksForType(summary, type));
  addTaskBlocker({ blockers, type, state, code, message });
  return state;
};

const applyElectronicFailurePolicy = ({
  blockers,
  reviewItems,
  status,
  mode,
}) => {
  const policy =
    ELECTRONIC_FAILURE_POLICY_BY_MODE[mode] ||
    ELECTRONIC_FAILURE_POLICY_BY_MODE.unknown;
  const issue = createIssue({
    type: TASK_TYPES.ELECTRONIC_TAX_RECEIPT,
    code:
      policy === 'review'
        ? 'electronic_tax_receipt_requires_review'
        : 'electronic_tax_receipt_failed',
    status,
    message:
      policy === 'review'
        ? 'El e-CF no requerido quedo con fallo local y requiere revision.'
        : 'El e-CF requerido fallo y bloquea la impresion.',
  });

  if (policy === 'review') {
    reviewItems.push(issue);
    return;
  }

  blockers.push(issue);
};

const evaluateElectronicTaxReceipt = ({
  invoice,
  summary,
  blockers,
  reviewItems,
}) => {
  const electronicTasks = tasksForType(
    summary,
    TASK_TYPES.ELECTRONIC_TAX_RECEIPT,
  );
  if (!expectsElectronicTaxReceipt({ invoice, electronicTasks })) {
    return 'missing';
  }

  const taskState = resolveTaskState(electronicTasks);
  const electronicSnapshot = resolveElectronicSnapshot(invoice);
  const mode = resolveElectronicMode({ electronicSnapshot, electronicTasks });
  const status = resolveElectronicStatus({
    electronicSnapshot,
    electronicTasks,
  });

  if (taskState === 'pending') {
    blockers.push(
      createIssue({
        type: TASK_TYPES.ELECTRONIC_TAX_RECEIPT,
        code: 'electronic_tax_receipt_pending',
        status: status || 'pending',
        message: 'El e-CF todavia no ha terminado.',
      }),
    );
    return taskState;
  }

  if (taskState === 'failed') {
    applyElectronicFailurePolicy({
      blockers,
      reviewItems,
      status: status || 'failed',
      mode,
    });
    return taskState;
  }

  if (ELECTRONIC_READY_STATUSES.has(status)) {
    return 'done';
  }

  if (ELECTRONIC_FAILURE_STATUSES.has(status)) {
    applyElectronicFailurePolicy({ blockers, reviewItems, status, mode });
    return taskState === 'missing' ? 'failed' : taskState;
  }

  if (!status || ELECTRONIC_PENDING_STATUSES.has(status)) {
    blockers.push(
      createIssue({
        type: TASK_TYPES.ELECTRONIC_TAX_RECEIPT,
        code: 'electronic_tax_receipt_not_ready',
        status: status || 'missing',
        message:
          'La factura espera e-CF, pero no hay estado fiscal imprimible.',
      }),
    );
    return 'pending';
  }

  blockers.push(
    createIssue({
      type: TASK_TYPES.ELECTRONIC_TAX_RECEIPT,
      code: 'electronic_tax_receipt_unknown_status',
      status,
      message: 'El e-CF tiene un estado no reconocido para impresion.',
    }),
  );
  return 'pending';
};

const evaluateCashCount = ({ summary, blockers, reviewItems }) => {
  const tasks = tasksForType(summary, TASK_TYPES.CASH_COUNT);
  const state = resolveTaskState(tasks);
  if (state === 'missing' || state === 'done') return state;

  if (state === 'failed') {
    reviewItems.push(
      createIssue({
        type: TASK_TYPES.CASH_COUNT,
        code: 'cash_count_requires_review',
        status: 'failed',
        message:
          'La factura se puede imprimir, pero requiere revision de caja.',
      }),
    );
    return state;
  }

  blockers.push(
    createIssue({
      type: TASK_TYPES.CASH_COUNT,
      code: 'cash_count_pending',
      status: state,
      message: 'La vinculacion a caja todavia no ha terminado.',
    }),
  );
  return state;
};

export const resolveInvoicePrintReadyDecision = ({
  invoice = {},
  outboxSummary = [],
} = {}) => {
  const summary = normalizeOutboxSummary(outboxSummary);
  const blockers = [];
  const reviewItems = [];
  const currentStatus = normalizeToken(invoice?.status);
  const canonicalTasks = tasksForType(summary, TASK_TYPES.CANONICAL);
  const canonicalState = resolveTaskState(canonicalTasks);

  if (currentStatus === 'failed') {
    blockers.push(
      createIssue({
        type: 'invoice',
        code: 'invoice_failed',
        status: currentStatus,
        message: 'La factura ya esta en estado failed.',
      }),
    );
  }

  if (canonicalState === 'missing') {
    if (!isFrontendReadyCompatibleInvoice(invoice)) {
      blockers.push(
        createIssue({
          type: TASK_TYPES.CANONICAL,
          code: 'canonical_invoice_missing',
          status: 'missing',
          message: 'La factura canonica no esta confirmada.',
        }),
      );
    }
  } else {
    addTaskBlocker({
      blockers,
      type: TASK_TYPES.CANONICAL,
      state: canonicalState,
      code: 'canonical_invoice_not_ready',
      message: 'La tarea de factura canonica no ha terminado.',
    });
  }

  const inventoryTasks = tasksForType(summary, TASK_TYPES.INVENTORY).filter(
    hasInventoryWork,
  );
  addTaskBlocker({
    blockers,
    type: TASK_TYPES.INVENTORY,
    state: resolveTaskState(inventoryTasks),
    code: 'inventory_not_ready',
    message: 'El inventario de la factura todavia no ha terminado.',
  });

  evaluateElectronicTaxReceipt({ invoice, summary, blockers, reviewItems });

  requireCompletedTaskType({
    summary,
    type: TASK_TYPES.ACCOUNTS_RECEIVABLE,
    blockers,
    code: 'accounts_receivable_not_ready',
    message: 'La CxC de la factura todavia no ha terminado.',
  });
  requireCompletedTaskType({
    summary,
    type: TASK_TYPES.CREDIT_NOTES,
    blockers,
    code: 'credit_notes_not_ready',
    message: 'Las notas de credito aplicadas todavia no han terminado.',
  });
  requireCompletedTaskType({
    summary,
    type: TASK_TYPES.INSURANCE_AR,
    blockers,
    code: 'insurance_ar_not_ready',
    message: 'La CxC de seguro todavia no ha terminado.',
  });

  evaluateCashCount({ summary, blockers, reviewItems });

  const canMarkPrintReady = blockers.length === 0;
  const targetStatus = canMarkPrintReady
    ? reviewItems.length > 0
      ? PRINT_READY_STATUSES.READY_WITH_REVIEW
      : PRINT_READY_STATUSES.READY
    : null;
  const shouldWriteStatus = Boolean(
    targetStatus &&
    currentStatus !== 'committed' &&
    currentStatus !== targetStatus,
  );

  return {
    canMarkPrintReady,
    targetStatus,
    shouldWriteStatus,
    blockers,
    reviewItems,
    frontendReadyCompatible: isFrontendReadyCompatibleInvoice(invoice),
    observedTaskTypes: summary.taskTypes,
  };
};

const serializeIssue = (issue) => ({
  type: issue?.type || null,
  code: issue?.code || null,
  status: issue?.status || null,
  message: issue?.message || null,
});

export async function attemptMarkInvoicePrintReady({ businessId, invoiceId }) {
  if (!toCleanString(businessId) || !toCleanString(invoiceId)) {
    throw new TypeError('businessId e invoiceId son requeridos');
  }

  const invoiceRef = db.doc(`businesses/${businessId}/invoicesV2/${invoiceId}`);
  const outboxCol = invoiceRef.collection('outbox');

  return db.runTransaction(async (tx) => {
    const invoiceSnap = await tx.get(invoiceRef);
    if (!invoiceSnap.exists) {
      return { status: 'missing_invoice' };
    }

    const invoice = invoiceSnap.data() || {};
    const outboxSnap = await tx.get(outboxCol);
    const outboxDocs = Array.isArray(outboxSnap?.docs) ? outboxSnap.docs : [];
    const decision = resolveInvoicePrintReadyDecision({
      invoice,
      outboxSummary: outboxDocs,
    });

    if (!decision.canMarkPrintReady) {
      return {
        status: 'blocked',
        blockers: decision.blockers,
      };
    }

    if (!decision.shouldWriteStatus) {
      return {
        status: 'skipped',
        targetStatus: decision.targetStatus,
      };
    }

    const now = Timestamp.now();
    const reviewItems = decision.reviewItems.map(serializeIssue);
    const timelineEntry = {
      status: decision.targetStatus,
      at: now,
      ...(reviewItems.length
        ? {
            reviewRequired: true,
            reviewItems,
          }
        : {}),
    };

    const updatePayload = {
      status: decision.targetStatus,
      printReadyAt: FieldValue.serverTimestamp(),
      printReady: {
        status: decision.targetStatus,
        reviewItems,
        observedTaskTypes: decision.observedTaskTypes,
        updatedAt: FieldValue.serverTimestamp(),
      },
      statusTimeline: FieldValue.arrayUnion(timelineEntry),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (reviewItems.length > 0) {
      updatePayload.requiresOperationalReview = true;
      updatePayload.printReady.reviewRequired = true;
    }

    tx.update(invoiceRef, updatePayload);
    upsertInvoiceTimelineEventInTransaction({
      transaction: tx,
      timelineEventRef: db.doc(
        `businesses/${businessId}/invoicesV2/${invoiceId}/timeline/print_ready__${decision.targetStatus}`,
      ),
      businessId,
      invoiceId,
      eventId: `print_ready__${decision.targetStatus}`,
      status: decision.targetStatus,
      at: now,
      source: 'attemptMarkInvoicePrintReady',
      metadata: {
        reviewRequired: reviewItems.length > 0 || undefined,
        reviewItems: reviewItems.length ? reviewItems : undefined,
        observedTaskTypes: decision.observedTaskTypes,
      },
    });
    await markInvoiceTimingStage({
      invoiceRef,
      transaction: tx,
      invoice,
      stage: 'print_ready',
      at: now,
      metadata: {
        source: 'attemptMarkInvoicePrintReady',
        status: decision.targetStatus,
        reviewRequired: reviewItems.length > 0 || undefined,
      },
    });

    if (invoice.idempotencyKey) {
      const idemRef = db.doc(
        `businesses/${businessId}/idempotency/${invoice.idempotencyKey}`,
      );
      tx.set(
        idemRef,
        {
          status: decision.targetStatus,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    return {
      status: 'written',
      targetStatus: decision.targetStatus,
      reviewRequired: reviewItems.length > 0,
    };
  });
}
