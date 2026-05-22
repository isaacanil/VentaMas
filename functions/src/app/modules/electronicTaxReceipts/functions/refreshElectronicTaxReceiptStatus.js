import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { GISYS_FACT_SECRETS } from '../../../core/config/secrets.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { refreshElectronicTaxReceiptStatus as refreshElectronicTaxReceiptStatusService } from '../services/electronicTaxReceiptOutbox.service.js';

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const refreshElectronicTaxReceiptStatus = onCall(
  {
    cors: true,
    invoker: 'public',
    secrets: GISYS_FACT_SECRETS,
  },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const businessId =
      toCleanString(request?.data?.businessId) ||
      toCleanString(request?.data?.businessID);
    const invoiceId = toCleanString(request?.data?.invoiceId);
    const refreshRemote = request?.data?.refreshRemote !== false;

    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }
    if (!invoiceId) {
      throw new HttpsError('invalid-argument', 'invoiceId es requerido');
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
    });

    try {
      return await refreshElectronicTaxReceiptStatusService({
        businessId,
        invoiceId,
        refreshRemote,
      });
    } catch (error) {
      logger.error('[refreshElectronicTaxReceiptStatus] failed', {
        businessId,
        invoiceId,
        authUid,
        error,
      });
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        'failed-precondition',
        error?.message || 'No se pudo consultar el estado e-CF.',
      );
    }
  },
);
