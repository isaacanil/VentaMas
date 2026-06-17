import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  assertBusinessCreationLimit,
  provisionBusinessCoreInTransaction,
  runBusinessPostProvisioning,
} from '../services/businessProvisioning.service.js';

export {
  assertBusinessCreationLimit,
  provisionBusinessCoreInTransaction,
  runBusinessPostProvisioning,
} from '../services/businessProvisioning.service.js';

export const createBusiness = onCall(async (req) => {
  const payload = req.data || {};
  const business = payload.business || null;
  const authUid = await resolveCallableAuthUid(req);

  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  if (!business || typeof business !== 'object') {
    throw new HttpsError('invalid-argument', 'business requerido');
  }

  const businessId =
    typeof business.id === 'string' && business.id.trim()
      ? business.id.trim()
      : nanoid();
  const createdBy = authUid;

  await assertBusinessCreationLimit({ ownerUid: createdBy });

  await db.runTransaction(async (tx) => {
    await provisionBusinessCoreInTransaction({
      tx,
      businessId,
      business,
      createdBy,
    });
  });

  await runBusinessPostProvisioning({ businessId, actorUserId: createdBy });

  return { ok: true, id: businessId };
});
