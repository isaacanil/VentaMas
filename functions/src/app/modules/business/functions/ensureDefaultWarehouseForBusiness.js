import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import { ensureDefaultWarehouse } from '../../warehouse/services/defaultWarehouse.service.js';
import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';

const toBusinessId = (value) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

export const ensureDefaultWarehouseForBusiness = onCall(async (req) => {
  const businessID = toBusinessId(req.data?.businessID || req.data?.businessId);
  const uid = await resolveCallableAuthUid(req);

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
