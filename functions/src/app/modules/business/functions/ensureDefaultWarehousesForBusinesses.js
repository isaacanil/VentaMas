import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { db } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import { getUserAccessProfile } from '../../../versions/v2/auth/services/userAccess.service.js';
import { ensureDefaultWarehouse } from '../../warehouse/services/defaultWarehouse.service.js';

const resolveLimit = (value, fallback = 200) => {
  const limit = Number(value);
  if (!Number.isFinite(limit) || limit <= 0) return fallback;
  return Math.min(limit, 500);
};

export const ensureDefaultWarehousesForBusinesses = onCall(async (req) => {
  const uid = await resolveCallableAuthUid(req);
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const accessProfile = await getUserAccessProfile(uid);
  if (!accessProfile.userSnap?.exists) {
    throw new HttpsError('permission-denied', 'Usuario no encontrado');
  }

  if (!accessProfile.hasGlobalUnscopedAccess) {
    throw new HttpsError(
      'permission-denied',
      'No tienes permisos para ejecutar esta accion',
    );
  }

  const dryRun = Boolean(req.data?.dryRun);
  const limit = resolveLimit(req.data?.limit);

  const businessesSnap = await db.collection('businesses').limit(limit).get();

  let scanned = 0;
  let missing = 0;
  let fixed = 0;
  let created = 0;
  let setDefault = 0;
  let errors = 0;

  for (const businessDoc of businessesSnap.docs) {
    const businessID = businessDoc.id;
    scanned += 1;

    try {
      const warehousesCol = db
        .collection('businesses')
        .doc(businessID)
        .collection('warehouses');
      const defaultSnap = await warehousesCol
        .where('defaultWarehouse', '==', true)
        .limit(1)
        .get();

      if (!defaultSnap.empty) {
        continue;
      }

      missing += 1;

      if (dryRun) {
        continue;
      }

      const anySnap = await warehousesCol.limit(1).get();
      const hadAny = !anySnap.empty;

      await ensureDefaultWarehouse({ businessID, uid });

      fixed += 1;
      if (hadAny) {
        setDefault += 1;
      } else {
        created += 1;
      }
    } catch {
      errors += 1;
    }
  }

  return {
    ok: true,
    dryRun,
    limit,
    scanned,
    missing,
    fixed,
    created,
    setDefault,
    errors,
  };
});
