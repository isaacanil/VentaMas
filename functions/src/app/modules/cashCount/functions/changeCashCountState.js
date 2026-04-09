import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';

const MANAGER_ROLES = new Set(['owner', 'admin', 'manager', 'dev']);

const resolveEmployeeId = (employee) => {
  if (!employee) return null;
  if (typeof employee === 'string') {
    const parts = employee.split('/');
    return parts[parts.length - 1] || null;
  }
  if (Array.isArray(employee?._path?.segments)) {
    return employee._path.segments.slice(-1)[0] || null;
  }
  if (Array.isArray(employee?._key?.path?.segments)) {
    return employee._key.path.segments.slice(-1)[0] || null;
  }
  return (
    toCleanString(employee.id) ||
    toCleanString(employee.uid) ||
    toCleanString(employee.userId) ||
    null
  );
};

export const changeCashCountState = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const businessId =
    toCleanString(request?.data?.businessId) ||
    toCleanString(request?.data?.businessID) ||
    null;
  const cashCountId = toCleanString(request?.data?.cashCountId);
  const nextState = toCleanString(request?.data?.state);

  if (!businessId || !cashCountId || !nextState) {
    throw new HttpsError(
      'invalid-argument',
      'businessId, cashCountId y state son requeridos',
    );
  }

  const membership = await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
  });

  const cashCountRef = db.doc(`businesses/${businessId}/cashCounts/${cashCountId}`);
  const cashCountSnap = await cashCountRef.get();
  if (!cashCountSnap.exists) {
    throw new HttpsError('not-found', 'Cuadre de caja no encontrado');
  }

  const openingEmployeeId = resolveEmployeeId(
    cashCountSnap.get('cashCount.opening.employee'),
  );
  const actorRole = toCleanString(membership?.role)?.toLowerCase() || '';
  const canManage =
    openingEmployeeId === authUid || MANAGER_ROLES.has(actorRole);

  if (!canManage) {
    throw new HttpsError(
      'permission-denied',
      'No autorizado para cambiar el estado del cuadre',
    );
  }

  await cashCountRef.update({
    'cashCount.state': nextState,
    'cashCount.updatedAt': Timestamp.fromMillis(Date.now()),
    'cashCount.stateHistory': FieldValue.arrayUnion({
      state: nextState,
      timestamp: Timestamp.fromMillis(Date.now()),
      updatedBy: authUid,
    }),
  });

  return {
    ok: true,
    businessId,
    cashCountId,
    state: nextState,
  };
});
