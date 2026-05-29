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
  buildHrCommissionAccrualAccountingEvent,
  buildHrCommissionCutDocuments,
  normalizeHrCommissionPeriodDateRange,
  normalizeHrCommissionPeriodStatus,
  resolveHrCommissionPeriodId,
} from '../services/hrCommissionPeriods.service.js';

const MAX_CUT_ENTRIES = 450;
const ACTIONS = new Set(['create', 'close', 'approve']);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normalizeAction = (value) => {
  const action = toCleanString(value)?.toLowerCase();
  return ACTIONS.has(action) ? action : 'create';
};

const requirePeriodId = (payload) => {
  const periodId = toCleanString(payload.periodId) || toCleanString(payload.id);
  if (!periodId) {
    throw new HttpsError('invalid-argument', 'periodId es requerido.');
  }
  return periodId;
};

const toPeriodResult = ({
  accountingEventId = null,
  entriesCount = 0,
  period,
  payrollRunId = null,
  reused = false,
} = {}) => ({
  ok: true,
  reused,
  businessId: toCleanString(period?.businessId),
  periodId: toCleanString(period?.id),
  payrollRunId: payrollRunId || toCleanString(period?.payrollRunId),
  accountingEventId:
    accountingEventId || toCleanString(period?.accountingEventId),
  status: normalizeHrCommissionPeriodStatus(period?.status),
  entriesCount: Number(period?.entriesCount) || entriesCount || 0,
  employeesCount: Number(period?.employeesCount) || 0,
  totalCommissionAmount: Number(period?.totalCommissionAmount) || 0,
});

const readPeriodSnapshot = async (transaction, businessId, periodId) => {
  const periodRef = db.doc(
    `businesses/${businessId}/hrCommissionPeriods/${periodId}`,
  );
  const periodSnap = await transaction.get(periodRef);
  if (!periodSnap.exists) {
    throw new HttpsError('not-found', 'El corte de comisiones no existe.');
  }

  return {
    periodRef,
    period: { id: periodSnap.id, ...(periodSnap.data() || {}) },
  };
};

const createHrCommissionPeriod = async ({ authUid, businessId, payload }) => {
  const range = normalizeHrCommissionPeriodDateRange({
    startDate: payload.startDate,
    endDate: payload.endDate,
  });
  if (!range.ok) {
    throw new HttpsError('invalid-argument', range.error);
  }

  const periodId = resolveHrCommissionPeriodId({
    endDate: range.end,
    periodId: payload.periodId,
    startDate: range.start,
  });
  const periodRef = db.doc(
    `businesses/${businessId}/hrCommissionPeriods/${periodId}`,
  );
  const startTimestamp = Timestamp.fromDate(range.start);
  const endTimestamp = Timestamp.fromDate(range.end);
  const entriesSnap = await db
    .collection(`businesses/${businessId}/hrCommissionEntries`)
    .where('date', '>=', startTimestamp)
    .where('date', '<=', endTimestamp)
    .orderBy('date', 'asc')
    .limit(MAX_CUT_ENTRIES)
    .get();
  const entryRefs = entriesSnap.docs.map((docSnap) => docSnap.ref);

  return db.runTransaction(async (transaction) => {
    const timestamp = FieldValue.serverTimestamp();
    const existingPeriodSnap = await transaction.get(periodRef);
    if (existingPeriodSnap.exists) {
      return toPeriodResult({
        period: {
          id: existingPeriodSnap.id,
          ...(existingPeriodSnap.data() || {}),
        },
        reused: true,
      });
    }

    const entrySnaps = await Promise.all(
      entryRefs.map((entryRef) => transaction.get(entryRef)),
    );
    const entries = entrySnaps
      .filter((entrySnap) => entrySnap.exists)
      .map((entrySnap) => ({ id: entrySnap.id, ...(entrySnap.data() || {}) }));
    const documents = buildHrCommissionCutDocuments({
      businessId,
      entries,
      endDate: range.end,
      periodId,
      startDate: range.start,
      timestamp,
      userId: authUid,
    });

    if (!documents.ok) {
      throw new HttpsError('failed-precondition', documents.error);
    }

    transaction.set(periodRef, documents.period, { merge: true });
    transaction.set(
      db.doc(
        `businesses/${businessId}/hrPayrollRuns/${documents.payrollRun.id}`,
      ),
      documents.payrollRun,
      { merge: true },
    );
    documents.employeeLines.forEach((line) => {
      transaction.set(
        db.doc(`businesses/${businessId}/hrPayrollEmployeeLines/${line.id}`),
        line,
        { merge: true },
      );
    });
    documents.entryPatches.forEach(({ entryId, patch }) => {
      transaction.set(
        db.doc(`businesses/${businessId}/hrCommissionEntries/${entryId}`),
        patch,
        { merge: true },
      );
    });

    return toPeriodResult({
      period: documents.period,
      payrollRunId: documents.payrollRun.id,
    });
  });
};

const closeHrCommissionPeriod = async ({ authUid, businessId, periodId }) =>
  db.runTransaction(async (transaction) => {
    const timestamp = FieldValue.serverTimestamp();
    const { periodRef, period } = await readPeriodSnapshot(
      transaction,
      businessId,
      periodId,
    );
    const status = normalizeHrCommissionPeriodStatus(period.status);

    if (['approved', 'partially_paid', 'paid'].includes(status)) {
      return toPeriodResult({ period, reused: true });
    }
    if (status === 'cancelled') {
      throw new HttpsError(
        'failed-precondition',
        'No se puede cerrar un corte cancelado.',
      );
    }
    if (status === 'closed') {
      return toPeriodResult({ period, reused: true });
    }

    const runRef = db.doc(
      `businesses/${businessId}/hrPayrollRuns/${period.payrollRunId}`,
    );
    const linesSnap = await transaction.get(
      db
        .collection(`businesses/${businessId}/hrPayrollEmployeeLines`)
        .where('periodId', '==', periodId),
    );
    const patch = {
      status: 'closed',
      closedAt: timestamp,
      closedBy: authUid,
      updatedAt: timestamp,
      updatedBy: authUid,
    };

    transaction.set(periodRef, patch, { merge: true });
    transaction.set(runRef, patch, { merge: true });
    linesSnap.docs.forEach((lineSnap) => {
      transaction.set(lineSnap.ref, patch, { merge: true });
    });

    return toPeriodResult({
      period: { ...period, status: 'closed' },
    });
  });

const approveHrCommissionPeriod = async ({ authUid, businessId, periodId }) =>
  db.runTransaction(async (transaction) => {
    const timestamp = FieldValue.serverTimestamp();
    const { periodRef, period } = await readPeriodSnapshot(
      transaction,
      businessId,
      periodId,
    );
    const status = normalizeHrCommissionPeriodStatus(period.status);

    if (['approved', 'partially_paid', 'paid'].includes(status)) {
      return toPeriodResult({ period, reused: true });
    }
    if (status !== 'closed') {
      throw new HttpsError(
        'failed-precondition',
        'Cierra el corte antes de aprobarlo.',
      );
    }

    const runRef = db.doc(
      `businesses/${businessId}/hrPayrollRuns/${period.payrollRunId}`,
    );
    const linesSnap = await transaction.get(
      db
        .collection(`businesses/${businessId}/hrPayrollEmployeeLines`)
        .where('periodId', '==', periodId),
    );
    const employeeLines = linesSnap.docs.map((lineSnap) => ({
      id: lineSnap.id,
      ...(lineSnap.data() || {}),
    }));
    const accountingEvent = buildHrCommissionAccrualAccountingEvent({
      businessId,
      employeeLines,
      period,
      timestamp,
      userId: authUid,
    });
    if (!accountingEvent) {
      throw new HttpsError(
        'failed-precondition',
        'El corte no tiene monto valido para devengar.',
      );
    }

    const approvedPatch = {
      status: 'approved',
      approvedAt: timestamp,
      approvedBy: authUid,
      accountingEventId: accountingEvent.id,
      updatedAt: timestamp,
      updatedBy: authUid,
    };

    transaction.set(periodRef, approvedPatch, { merge: true });
    transaction.set(runRef, approvedPatch, { merge: true });
    transaction.set(
      db.doc(`businesses/${businessId}/accountingEvents/${accountingEvent.id}`),
      accountingEvent,
      { merge: true },
    );
    employeeLines.forEach((line) => {
      transaction.set(
        db.doc(`businesses/${businessId}/hrPayrollEmployeeLines/${line.id}`),
        approvedPatch,
        { merge: true },
      );
      (Array.isArray(line.commissionEntryIds) ? line.commissionEntryIds : [])
        .map(toCleanString)
        .filter(Boolean)
        .forEach((entryId) => {
          transaction.set(
            db.doc(`businesses/${businessId}/hrCommissionEntries/${entryId}`),
            {
              status: 'approved',
              accountingEventId: accountingEvent.id,
              updatedAt: timestamp,
              updatedBy: authUid,
            },
            { merge: true },
          );
        });
    });

    return toPeriodResult({
      accountingEventId: accountingEvent.id,
      period: { ...period, ...approvedPatch },
    });
  });

export const manageHrCommissionPeriod = onCall(async (request) => {
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
    if (action === 'create') {
      return createHrCommissionPeriod({ authUid, businessId, payload });
    }

    const periodId = requirePeriodId(payload);
    if (action === 'close') {
      return closeHrCommissionPeriod({ authUid, businessId, periodId });
    }
    return approveHrCommissionPeriod({ authUid, businessId, periodId });
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('manageHrCommissionPeriod failed unexpectedly', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
      data: request?.data || null,
    });
    throw new HttpsError(
      'internal',
      'No se pudo gestionar el corte de comisiones.',
    );
  }
});
