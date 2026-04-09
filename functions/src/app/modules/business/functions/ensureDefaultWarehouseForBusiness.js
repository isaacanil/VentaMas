import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { ensureDefaultWarehouse } from '../../../versions/v1/modules/warehouse/services/warehouse.service.js';
import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';

const toBusinessId = (value) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

export const ensureDefaultWarehouseForBusiness = onCall(async (req) => {
  const businessID = toBusinessId(req.data?.businessID || req.data?.businessId);
  const uid = req.auth?.uid || null;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  if (!businessID) {
    throw new HttpsError('invalid-argument', 'businessID requerido');
  }

  await assertUserAccess({
    authUid: uid,
    businessId: businessID,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.MAINTENANCE,
  });

  await assertBusinessSubscriptionAccess({
    businessId: businessID,
    action: 'write',
    requiredModule: 'inventory',
  });

  const warehouse = await ensureDefaultWarehouse({ businessID, uid });
  return { ok: true, warehouse };
});
