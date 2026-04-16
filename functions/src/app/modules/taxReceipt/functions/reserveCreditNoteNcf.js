import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { reserveNcf } from '../../../versions/v2/invoice/services/ncf.service.js';
import { writeFiscalSequenceAudit } from '../services/fiscalSequenceAudit.service.js';
import { resolveBusinessFiscalRollout } from '../utils/fiscalRollout.util.js';

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

    const businessRef = db.doc(`businesses/${businessId}`);
    const businessSnap = await businessRef.get();
    if (!businessSnap.exists) {
      throw new HttpsError('not-found', 'Negocio no encontrado');
    }

    const fiscalRollout = resolveBusinessFiscalRollout(businessSnap.data());
    if (!fiscalRollout.sequenceEngineV2Enabled) {
      logger.warn('[reserveCreditNoteNcf] fiscal sequence engine disabled', {
        businessId,
        authUid,
        fiscalRollout,
      });
      throw new HttpsError(
        'failed-precondition',
        'El motor fiscal v2 no está habilitado para este negocio.',
      );
    }

    let result = null;
    let auditId = null;
    await db.runTransaction(async (tx) => {
      const reservation = await reserveNcf(tx, {
        businessId,
        userId: authUid,
        ncfType: 'NOTAS DE CRÉDITO',
      });
      auditId = writeFiscalSequenceAudit(tx, {
        businessId,
        userId: authUid,
        usageId: reservation.usageId,
        ncfCode: reservation.ncfCode,
        taxReceiptName: 'NOTAS DE CRÉDITO',
        engine: 'backend.reserveNcf',
        sourceType: 'creditNote',
        sourceFunction: 'reserveCreditNoteNcf',
        taxReceiptId: reservation?.taxReceiptRef?.id ?? null,
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
      auditId,
      ncfCode: result?.ncfCode || null,
      fiscalSequenceEngineV2Enabled: fiscalRollout.sequenceEngineV2Enabled,
    });

    return result;
  },
);
