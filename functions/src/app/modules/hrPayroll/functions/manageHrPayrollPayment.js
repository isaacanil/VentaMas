import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import { toCleanString } from '../../../versions/v2/billing/utils/billingCommon.util.js';
import {
  buildHrPayrollPaymentAggregateStatusPatch,
  buildHrPayrollPaymentDocuments,
  buildHrPayrollPaymentId,
} from '../services/hrPayrollPayments.service.js';

const ACTIONS = new Set(['record']);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normalizeAction = (value) => {
  const action = toCleanString(value)?.toLowerCase();
  return ACTIONS.has(action) ? action : 'record';
};

const requireLineId = (payload) => {
  const lineId =
    toCleanString(payload.payrollLineId) ||
    toCleanString(payload.payrollEmployeeLineId) ||
    toCleanString(payload.lineId);
  if (!lineId) {
    throw new HttpsError(
      'invalid-argument',
      'payrollLineId es requerido para registrar el pago.',
    );
  }
  return lineId;
};

const normalizePaymentDate = (value) => {
  if (!value) return Timestamp.now();
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return Timestamp.fromDate(value);
  }
  if (typeof value?.toDate === 'function') {
    const dateValue = value.toDate();
    if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
      return Timestamp.fromDate(dateValue);
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const dateValue = new Date(value);
    if (!Number.isNaN(dateValue.getTime())) {
      return Timestamp.fromDate(dateValue);
    }
  }
  throw new HttpsError(
    'invalid-argument',
    'paymentDate no es una fecha valida.',
  );
};

const toPaymentResult = ({ payment, reused = false }) => ({
  ok: true,
  reused,
  businessId: toCleanString(payment?.businessId),
  paymentId: toCleanString(payment?.id),
  periodId: toCleanString(payment?.periodId),
  payrollRunId: toCleanString(payment?.payrollRunId),
  payrollLineId: toCleanString(payment?.payrollLineId),
  employeeId: toCleanString(payment?.employeeId),
  amount: Number(payment?.amount) || 0,
  currency: toCleanString(payment?.currency) || 'DOP',
  status: toCleanString(payment?.status) || 'confirmed',
  accountingEventId: toCleanString(payment?.accountingEventId),
  cashMovementIds: Array.isArray(payment?.cashMovementIds)
    ? payment.cashMovementIds.map(toCleanString).filter(Boolean)
    : [],
});

const recordHrPayrollPayment = async ({
  authUid,
  businessId,
  lineId,
  payload,
}) => {
  const paymentDate = normalizePaymentDate(payload.paymentDate);
  const paymentId = buildHrPayrollPaymentId({
    lineId,
    paymentId: payload.paymentId,
  });
  const lineRef = db.doc(
    `businesses/${businessId}/hrPayrollEmployeeLines/${lineId}`,
  );
  const paymentRef = db.doc(
    `businesses/${businessId}/hrEmployeePayments/${paymentId}`,
  );

  return db.runTransaction(async (transaction) => {
    const timestamp = FieldValue.serverTimestamp();
    const [lineSnap, existingPaymentSnap] = await Promise.all([
      transaction.get(lineRef),
      transaction.get(paymentRef),
    ]);
    if (!lineSnap.exists) {
      throw new HttpsError('not-found', 'La línea de nómina no existe.');
    }

    const line = { id: lineSnap.id, ...lineSnap.data() };
    if (existingPaymentSnap.exists) {
      const existingPayment = {
        id: existingPaymentSnap.id,
        ...existingPaymentSnap.data(),
      };
      if (existingPayment.status === 'confirmed' || line.status === 'paid') {
        return toPaymentResult({ payment: existingPayment, reused: true });
      }
      throw new HttpsError(
        'already-exists',
        'Ya existe un pago de nómina para esta línea.',
      );
    }

    const periodId = toCleanString(line.periodId);
    const payrollRunId = toCleanString(line.payrollRunId);
    const periodRef = periodId
      ? db.doc(`businesses/${businessId}/hrCommissionPeriods/${periodId}`)
      : null;
    const payrollRunRef = payrollRunId
      ? db.doc(`businesses/${businessId}/hrPayrollRuns/${payrollRunId}`)
      : null;
    const lineQuery = periodId
      ? db
          .collection(`businesses/${businessId}/hrPayrollEmployeeLines`)
          .where('periodId', '==', periodId)
      : null;
    const linesSnap = lineQuery ? await transaction.get(lineQuery) : null;
    const employeeLines = linesSnap
      ? linesSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      : [line];
    const documents = buildHrPayrollPaymentDocuments({
      businessId,
      line,
      payload,
      paymentDate,
      timestamp,
      userId: authUid,
    });
    if (!documents.ok) {
      throw new HttpsError('failed-precondition', documents.error);
    }

    const aggregatePatch = buildHrPayrollPaymentAggregateStatusPatch({
      currentLineId: lineId,
      employeeLines,
      paymentId: documents.payment.id,
      timestamp,
      userId: authUid,
    });

    transaction.set(paymentRef, documents.payment, { merge: true });
    transaction.set(
      db.doc(
        `businesses/${businessId}/accountingEvents/${documents.accountingEvent.id}`,
      ),
      documents.accountingEvent,
      { merge: true },
    );
    documents.cashMovements.forEach((movement) => {
      transaction.set(
        db.doc(`businesses/${businessId}/cashMovements/${movement.id}`),
        movement,
        { merge: true },
      );
    });
    transaction.set(lineRef, documents.linePatch, { merge: true });
    const regularEntryIds = new Set(
      (Array.isArray(line.commissionEntryIds) ? line.commissionEntryIds : [])
        .map(toCleanString)
        .filter(Boolean),
    );
    const retroactiveEntryIds = new Set(
      (Array.isArray(line.retroactiveEntryIds) ? line.retroactiveEntryIds : [])
        .map(toCleanString)
        .filter(Boolean),
    );
    regularEntryIds.forEach((entryId) => {
      transaction.set(
        db.doc(`businesses/${businessId}/hrCommissionEntries/${entryId}`),
        documents.entryPatch,
        { merge: true },
      );
    });
    retroactiveEntryIds.forEach((entryId) => {
      transaction.set(
        db.doc(`businesses/${businessId}/hrCommissionEntries/${entryId}`),
        {
          ...documents.entryPatch,
          isRetroactive: true,
          retroactiveResolutionStatus: 'paid',
          retroactiveTargetPeriodId: periodId,
          retroactiveTargetPayrollRunId: payrollRunId,
          retroactiveTargetLineId: line.id,
        },
        { merge: true },
      );
    });

    if (payrollRunRef) {
      transaction.set(payrollRunRef, aggregatePatch, { merge: true });
    }
    if (periodRef) {
      transaction.set(periodRef, aggregatePatch, { merge: true });
    }

    return toPaymentResult({ payment: documents.payment });
  });
};

export const manageHrPayrollPayment = onCall(async (request) => {
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

    const action = normalizeAction(payload.action);
    if (action !== 'record') {
      throw new HttpsError('invalid-argument', 'Acción de pago no soportada.');
    }

    return recordHrPayrollPayment({
      authUid,
      businessId,
      lineId: requireLineId(payload),
      payload,
    });
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('manageHrPayrollPayment failed unexpectedly', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
      data: request?.data || null,
    });
    throw new HttpsError('internal', 'No se pudo registrar el pago de nómina.');
  }
});
