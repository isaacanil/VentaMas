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
import { handleHttpCorsPreflightAndMethod } from '../../http/httpCors.util.js';
import { mapHttpsErrorToHttpStatus } from '../../http/httpError.util.js';

export const repairInvoiceV2Http = https.onRequest(async (req, res) => {
  const httpGuardHandled = handleHttpCorsPreflightAndMethod(req, res, {
    allowedMethod: 'POST',
    methods: 'POST, OPTIONS',
    headers: 'Content-Type, Authorization, X-Session-Token, Idempotency-Key',
  });
  if (httpGuardHandled) {
    return;
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
    logger.error('repairInvoiceV2Http error', {
      message: err?.message || String(err),
      stack: err?.stack,
      code: err?.code,
    });
    if (err instanceof https.HttpsError) {
      return res
        .status(mapHttpsErrorToHttpStatus(err.code))
        .json({ error: err.message, code: err.code });
    }
    return res.status(500).json({ error: 'Error al reprogramar tareas' });
  }
});
