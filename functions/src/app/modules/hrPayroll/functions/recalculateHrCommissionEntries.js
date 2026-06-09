import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';
import {
  buildHrEmployeeLookupIndex,
  syncRecalculableHrCommissionEntriesFromServiceCommissionRecordsTx,
} from '../services/hrCommissionEntries.service.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const parseDateMillis = (value) => {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') {
    const dateValue = value.toDate();
    return dateValue instanceof Date ? dateValue.getTime() : null;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const seconds =
      typeof value.seconds === 'number'
        ? value.seconds
        : typeof value._seconds === 'number'
          ? value._seconds
          : null;
    if (seconds != null) return seconds * 1000;
  }
  return null;
};

const isInsideRange = (record, { endMs, startMs }) => {
  const dateMs = parseDateMillis(record.date);
  if (dateMs == null) return true;
  if (startMs != null && dateMs < startMs) return false;
  if (endMs != null && dateMs > endMs) return false;
  return true;
};

export const recalculateHrCommissionEntries = onCall(async (request) => {
  try {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const businessId =
      toCleanString(payload.businessId) ||
      toCleanString(payload.businessID) ||
      null;
    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.ACCOUNTING_WRITE,
    });

    const startMs = parseDateMillis(payload.startDate);
    const endMs = parseDateMillis(payload.endDate);

    const [employeesSnap, commissionsSnap] = await Promise.all([
      db.collection(`businesses/${businessId}/hrEmployees`).get(),
      db
        .collection(`businesses/${businessId}/serviceCommissions`)
        .where('status', '==', 'active')
        .limit(500)
        .get(),
    ]);

    const employeeIndex = buildHrEmployeeLookupIndex(
      employeesSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })),
    );
    const serviceCommissions = commissionsSnap.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .filter((record) => isInsideRange(record, { endMs, startMs }));

    const timestamp = FieldValue.serverTimestamp();
    let entries = [];

    await db.runTransaction(async (transaction) => {
      entries = await syncRecalculableHrCommissionEntriesFromServiceCommissionRecordsTx(
        transaction,
        {
          businessId,
          employeeIndex,
          records: serviceCommissions,
          timestamp,
          userId: authUid,
        },
      );
    });

    const unresolvedCount = entries.filter(
      (entry) => entry.status === 'requires_adjustment',
    ).length;

    return {
      ok: true,
      businessId,
      scannedServiceCommissions: serviceCommissions.length,
      writtenEntries: entries.length,
      unresolvedCount,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('recalculateHrCommissionEntries failed unexpectedly', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
      data: request?.data || null,
    });
    throw new HttpsError(
      'internal',
      'No se pudieron recalcular las comisiones de RRHH.',
    );
  }
});
