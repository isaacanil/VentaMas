import { https, logger } from 'firebase-functions';

import { db, FieldValue } from '../../../../core/config/firebase.js';
import { auditSafe } from './audit.service.js';

export {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
  getUserAccessProfile,
  getUserBusinessScope,
} from '../../auth/services/userAccess.service.js';

export const ALLOWED_TASKS = new Set([
  'createCanonicalInvoice',
  'attachToCashCount',
  'setupAR',
  'setupInsuranceAR',
  'consumeCreditNotes',
  'closePreorder',
  'updateInventory',
  'issueElectronicTaxReceipt',
]);

export const DEFAULT_TASKS = ['createCanonicalInvoice', 'attachToCashCount'];

async function supersedeFailedTasks({
  outboxCol,
  type,
  replacementTaskId,
  authUid,
  reason,
}) {
  const failedSnap = await outboxCol
    .where('type', '==', type)
    .where('status', '==', 'failed')
    .get();

  if (failedSnap.empty) return 0;

  await Promise.all(
    failedSnap.docs.map((doc) =>
      doc.ref.set(
        {
          status: 'superseded',
          supersededBy: replacementTaskId,
          supersededAt: FieldValue.serverTimestamp(),
          supersededByUser: authUid || null,
          supersededReason: reason || null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
    ),
  );

  return failedSnap.docs.length;
}

export function sanitizeTasks(value) {
  if (!value) return DEFAULT_TASKS;
  if (!Array.isArray(value)) {
    throw new https.HttpsError(
      'invalid-argument',
      'tasks debe ser un arreglo de strings',
    );
  }
  const unique = Array.from(new Set(value.map((task) => String(task || ''))));
  if (!unique.length) return DEFAULT_TASKS;
  const invalid = unique.filter((task) => !ALLOWED_TASKS.has(task));
  if (invalid.length) {
    throw new https.HttpsError(
      'invalid-argument',
      `Tareas no soportadas: ${invalid.join(', ')}`,
    );
  }
  return unique;
}

export async function getTaskTemplate({ businessId, invoiceId, type }) {
  const templateSnap = await db
    .collection(`businesses/${businessId}/invoicesV2/${invoiceId}/outbox`)
    .where('type', '==', type)
    .limit(1)
    .get();

  if (templateSnap.empty) {
    throw new https.HttpsError(
      'not-found',
      `No se encontró una tarea '${type}' para reutilizar`,
    );
  }

  const doc = templateSnap.docs[0];
  const data = doc.data();
  if (!data?.payload) {
    throw new https.HttpsError(
      'failed-precondition',
      `La tarea '${type}' no tiene un payload reutilizable`,
    );
  }

  return data.payload;
}

export async function enqueueRepairTask({
  businessId,
  invoiceId,
  type,
  payload,
  authUid,
  reason,
  invoice,
}) {
  const outboxCol = db.collection(
    `businesses/${businessId}/invoicesV2/${invoiceId}/outbox`,
  );

  const pendingSnap = await outboxCol
    .where('type', '==', type)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!pendingSnap.empty) {
    const pendingTaskId = pendingSnap.docs[0]?.id || null;
    const supersededFailedTasks = pendingTaskId
      ? await supersedeFailedTasks({
          outboxCol,
          type,
          replacementTaskId: pendingTaskId,
          authUid,
          reason,
        })
      : 0;
    return {
      status: 'skipped',
      reason: 'pending_task_exists',
      supersededFailedTasks,
    };
  }

  const taskRef = outboxCol.doc();
  const normalizedPayload = {
    ...payload,
    businessId: payload?.businessId || businessId,
    userId: payload?.userId || invoice?.userId || null,
  };

  await taskRef.set({
    id: taskRef.id,
    type,
    status: 'pending',
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    payload: normalizedPayload,
    manualRetry: true,
    requestedBy: authUid,
    requestedReason: reason || null,
  });

  const supersededFailedTasks = await supersedeFailedTasks({
    outboxCol,
    type,
    replacementTaskId: taskRef.id,
    authUid,
    reason,
  });

  await auditSafe({
    businessId,
    invoiceId,
    event: 'manual_task_enqueued',
    data: {
      type,
      requestedBy: authUid,
      payloadKeys: Object.keys(normalizedPayload || {}),
      supersededFailedTasks,
    },
  });

  return { status: 'scheduled', taskId: taskRef.id, supersededFailedTasks };
}

export async function scheduleRepairTasks({
  businessId,
  invoiceId,
  taskTypes,
  authUid,
  reason,
  invoice,
}) {
  if (!Array.isArray(taskTypes) || !taskTypes.length) {
    return [];
  }
  const results = [];
  const uniqueTasks = Array.from(new Set(taskTypes));
  for (const type of uniqueTasks) {
    try {
      const templatePayload = await getTaskTemplate({
        businessId,
        invoiceId,
        type,
      });
      const result = await enqueueRepairTask({
        businessId,
        invoiceId,
        type,
        payload: templatePayload,
        authUid,
        reason,
        invoice,
      });
      results.push({ type, ...result });
    } catch (taskError) {
      logger.error('scheduleRepairTasks error', {
        type,
        businessId,
        invoiceId,
        error: taskError?.message,
      });
      results.push({
        type,
        status: 'error',
        reason: taskError?.message || 'Error desconocido',
      });
    }
  }
  return results;
}
