import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { reserveNcf } from '../../../versions/v2/invoice/services/ncf.service.js';

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const reserveCreditNoteNcf = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const businessId =
      toCleanString(request?.data?.businessId) ||
      toCleanString(request?.data?.businessID) ||
      null;
    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
    });

    let result = null;
    await db.runTransaction(async (tx) => {
      const reservation = await reserveNcf(tx, {
        businessId,
        userId: authUid,
        ncfType: 'NOTAS DE CRÉDITO',
      });

      result = {
        ok: true,
        ncfCode: reservation.ncfCode,
        usageId: reservation.usageId,
        engine: 'backend.reserveNcf',
      };
    });

    logger.info('[reserveCreditNoteNcf] reserved credit note ncf', {
      businessId,
      authUid,
      usageId: result?.usageId || null,
      ncfCode: result?.ncfCode || null,
    });

    return result;
  },
);
