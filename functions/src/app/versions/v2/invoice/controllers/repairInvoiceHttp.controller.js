import { https, logger } from 'firebase-functions';

import {
  resolveHttpAuthUser,
  HttpAuthError,
} from '../../auth/services/httpAuth.service.js';
import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
  sanitizeTasks,
  scheduleRepairTasks,
} from '../services/repairTasks.service.js';
import { db } from '../../../../core/config/firebase.js';
import { assertBusinessSubscriptionAccess } from '../../billing/utils/subscriptionAccess.util.js';

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Session-Token, Idempotency-Key',
  );
}

export const repairInvoiceV2Http = https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let authContext;
    try {
      authContext = await resolveHttpAuthUser(req);
    } catch (authError) {
      if (authError instanceof HttpAuthError) {
        return res.status(authError.status).json({ error: authError.message });
      }
      throw authError;
    }
    const authUid = authContext?.uid;

    const businessId = req.body?.businessId?.toString?.() || null;
    const invoiceId = req.body?.invoiceId?.toString?.() || null;
    if (!businessId || !invoiceId) {
      return res
        .status(400)
        .json({ error: 'businessId e invoiceId son requeridos' });
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.MAINTENANCE,
    });
    await assertBusinessSubscriptionAccess({
      businessId,
      action: 'write',
      requiredModule: 'sales',
    });

    const invoiceRef = db.doc(
      `businesses/${businessId}/invoicesV2/${invoiceId}`,
    );
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) {
      return res.status(404).json({ error: 'Factura V2 no encontrada' });
    }
    const invoice = invoiceSnap.data();

    const tasks = sanitizeTasks(req.body?.tasks);
    const reason = req.body?.reason
      ? String(req.body.reason).slice(0, 280)
      : null;

    const results = await scheduleRepairTasks({
      businessId,
      invoiceId,
      taskTypes: tasks,
      authUid,
      reason,
      invoice,
    });

    return res.status(200).json({
      invoiceId,
      businessId,
      results,
    });
  } catch (err) {
    logger.error('repairInvoiceV2Http error', { err });
    if (err instanceof https.HttpsError) {
      return res
        .status(mapHttpsErrorToStatus(err.code))
        .json({ error: err.message, code: err.code });
    }
    const message = err?.message || 'Error al reprogramar tareas';
    return res.status(500).json({ error: message });
  }
});

function mapHttpsErrorToStatus(code) {
  switch (code) {
  case 'permission-denied':
    return 403;
  case 'unauthenticated':
    return 401;
  case 'not-found':
    return 404;
  case 'failed-precondition':
    return 412;
  case 'resource-exhausted':
    return 429;
  case 'already-exists':
    return 409;
  case 'invalid-argument':
  default:
    return 400;
  }
}
