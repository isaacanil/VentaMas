import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { resolveBusinessFiscalRollout } from '../../taxReceipt/utils/fiscalRollout.util.js';
import { getMonthlyCompliancePreviewBuilder } from '../services/monthlyCompliancePreviewRegistry.service.js';
import { createTaxReportRun } from '../services/taxReportRun.service.js';

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const runMonthlyComplianceReport = onCall(
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
    const periodKey = toCleanString(request?.data?.periodKey) || null;
    const reportCode =
      toCleanString(request?.data?.reportCode) || 'DGII_607';

    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }
    if (!periodKey) {
      throw new HttpsError('invalid-argument', 'periodKey es requerido');
    }
    if (!getMonthlyCompliancePreviewBuilder(reportCode)) {
      throw new HttpsError(
        'failed-precondition',
        `El reporte mensual ${reportCode} todavía no está implementado.`,
      );
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
    });

    const businessRef = db.doc(`businesses/${businessId}`);
    const businessSnap = await businessRef.get();
    if (!businessSnap.exists) {
      throw new HttpsError('not-found', 'Negocio no encontrado');
    }

    const fiscalRollout = resolveBusinessFiscalRollout(businessSnap.data());
    if (!fiscalRollout.reportingEnabled || !fiscalRollout.monthlyComplianceEnabled) {
      logger.warn('[runMonthlyComplianceReport] monthly compliance disabled', {
        businessId,
        authUid,
        reportCode,
        fiscalRollout,
      });
      throw new HttpsError(
        'failed-precondition',
        'El piloto de compliance mensual no está habilitado para este negocio.',
      );
    }

    try {
      const reportRun = await createTaxReportRun({
        businessId,
        periodKey,
        reportCode,
        authUid,
      });

      logger.info('[runMonthlyComplianceReport] tax report run created', {
        businessId,
        authUid,
        reportCode,
        periodKey,
        reportRunId: reportRun.id,
        version: reportRun.version,
        status: reportRun.status,
      });

      return {
        ok: true,
        pilotMode: true,
        reportRunId: reportRun.id,
        reportCode: reportRun.reportCode,
        periodKey: reportRun.periodKey,
        version: reportRun.version,
        status: reportRun.status,
        issueSummary: reportRun.preview?.issueSummary ?? {
          total: 0,
          bySeverity: {},
          bySource: {},
          byCode: {},
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;

      logger.error('[runMonthlyComplianceReport] failed', {
        businessId,
        authUid,
        reportCode,
        periodKey,
        error,
      });
      throw new HttpsError(
        'internal',
        error?.message || 'No se pudo generar la corrida mensual de compliance.',
      );
    }
  },
);
