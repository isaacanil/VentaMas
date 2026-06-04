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
  buildHrPayrollEmployeeLinePayableAdjustment,
  normalizeHrCommissionCutRule,
  normalizeHrCommissionPeriodDateRange,
  normalizeHrCommissionPeriodStatus,
  resolveNextHrCommissionCutRuleRange,
  resolveHrCommissionPeriodId,
} from '../services/hrCommissionPeriods.service.js';

const MAX_CUT_ENTRIES = 450;
const ACTIONS = new Set([
  'create',
  'close',
  'approve',
  'adjust_line',
  'upsert_cut_rule',
  'deactivate_cut_rule',
]);

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

const requireLineId = (payload) => {
  const lineId =
    toCleanString(payload.payrollLineId) ||
    toCleanString(payload.payrollEmployeeLineId) ||
    toCleanString(payload.lineId);
  if (!lineId) {
    throw new HttpsError(
      'invalid-argument',
      'payrollLineId es requerido para editar el total a pagar.',
    );
  }
  return lineId;
};

const requireCutRuleId = (payload) => {
  const ruleId =
    toCleanString(payload.cutRuleId) ||
    toCleanString(payload.ruleId) ||
    toCleanString(payload.id);
  if (!ruleId) {
    throw new HttpsError('invalid-argument', 'ruleId es requerido.');
  }
  return ruleId;
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
  deductionsAmount: Number(period?.deductionsAmount) || 0,
  netAmount:
    Number(period?.netAmount) ||
    Number(period?.totalPayableAmount) ||
    Number(period?.totalCommissionAmount) ||
    0,
});

const toCutRuleResult = ({ rule }) => ({
  ok: true,
  businessId: toCleanString(rule?.businessId),
  ruleId: toCleanString(rule?.id),
  rule: {
    id: toCleanString(rule?.id),
    businessId: toCleanString(rule?.businessId),
    label: toCleanString(rule?.label),
    frequency: toCleanString(rule?.frequency) || 'monthly',
    startDay: Number(rule?.startDay) || 1,
    endDay: Number(rule?.endDay) || 31,
    active: rule?.active === false ? false : true,
    sortOrder: Number(rule?.sortOrder) || 0,
  },
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
    period: { id: periodSnap.id, ...periodSnap.data() },
  };
};

const readCutRule = async ({ businessId, ruleId }) => {
  const ruleSnap = await db
    .doc(`businesses/${businessId}/hrCommissionCutRules/${ruleId}`)
    .get();
  if (!ruleSnap.exists) {
    throw new HttpsError('not-found', 'La regla de corte no existe.');
  }

  const normalized = normalizeHrCommissionCutRule(
    { id: ruleSnap.id, ...ruleSnap.data() },
    { businessId, ruleId: ruleSnap.id },
  );
  if (!normalized.ok) {
    throw new HttpsError('failed-precondition', normalized.error);
  }
  if (normalized.rule.active === false) {
    throw new HttpsError(
      'failed-precondition',
      'La regla de corte esta inactiva.',
    );
  }
  return normalized.rule;
};

const readCutRulePeriods = async ({ businessId, ruleId }) => {
  const periodsSnap = await db
    .collection(`businesses/${businessId}/hrCommissionPeriods`)
    .where('cutRuleId', '==', ruleId)
    .get();

  return periodsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

const upsertHrCommissionCutRule = async ({ authUid, businessId, payload }) => {
  const normalized = normalizeHrCommissionCutRule(payload, {
    businessId,
    ruleId:
      toCleanString(payload.ruleId) ||
      toCleanString(payload.cutRuleId) ||
      toCleanString(payload.id),
  });
  if (!normalized.ok) {
    throw new HttpsError('invalid-argument', normalized.error);
  }

  const ruleRef = db.doc(
    `businesses/${businessId}/hrCommissionCutRules/${normalized.rule.id}`,
  );
  const timestamp = FieldValue.serverTimestamp();
  const existingSnap = await ruleRef.get();
  const rulePayload = {
    ...normalized.rule,
    businessId,
    updatedAt: timestamp,
    updatedBy: authUid,
    ...(existingSnap.exists
      ? {}
      : {
          createdAt: timestamp,
          createdBy: authUid,
        }),
  };

  await ruleRef.set(rulePayload, { merge: true });
  return toCutRuleResult({ rule: rulePayload });
};

const deactivateHrCommissionCutRule = async ({
  authUid,
  businessId,
  payload,
}) => {
  const ruleId = requireCutRuleId(payload);
  const ruleRef = db.doc(
    `businesses/${businessId}/hrCommissionCutRules/${ruleId}`,
  );
  const ruleSnap = await ruleRef.get();
  if (!ruleSnap.exists) {
    throw new HttpsError('not-found', 'La regla de corte no existe.');
  }

  const timestamp = FieldValue.serverTimestamp();
  await ruleRef.set(
    {
      active: false,
      deactivatedAt: timestamp,
      deactivatedBy: authUid,
      updatedAt: timestamp,
      updatedBy: authUid,
    },
    { merge: true },
  );

  return toCutRuleResult({
    rule: { id: ruleSnap.id, ...ruleSnap.data(), active: false },
  });
};

const createHrCommissionPeriod = async ({ authUid, businessId, payload }) => {
  const ruleId = requireCutRuleId(payload);
  const cutRule = await readCutRule({ businessId, ruleId });
  const priorPeriods = await readCutRulePeriods({ businessId, ruleId });
  const nextRange = resolveNextHrCommissionCutRuleRange({
    periods: priorPeriods,
    rule: cutRule,
  });
  if (!nextRange.ok) {
    throw new HttpsError('failed-precondition', nextRange.error);
  }

  const range = normalizeHrCommissionPeriodDateRange({
    startDate: nextRange.start,
    endDate: nextRange.end,
  });
  if (!range.ok) {
    throw new HttpsError('invalid-argument', range.error);
  }

  const periodId = resolveHrCommissionPeriodId({
    endDate: range.end,
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
          ...existingPeriodSnap.data(),
        },
        reused: true,
      });
    }

    const entrySnaps = await Promise.all(
      entryRefs.map((entryRef) => transaction.get(entryRef)),
    );
    const entries = entrySnaps
      .filter((entrySnap) => entrySnap.exists)
      .map((entrySnap) => ({ id: entrySnap.id, ...entrySnap.data() }));
    const employeesSnap = await transaction.get(
      db
        .collection(`businesses/${businessId}/hrEmployees`)
        .where('status', '==', 'active'),
    );
    const employees = employeesSnap.docs.map((employeeSnap) => ({
      id: employeeSnap.id,
      ...employeeSnap.data(),
    }));
    const documents = buildHrCommissionCutDocuments({
      businessId,
      cutRule,
      employees,
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
      ...lineSnap.data(),
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

const adjustHrCommissionPeriodLine = async ({
  authUid,
  businessId,
  payload,
}) => {
  const lineId = requireLineId(payload);
  const lineRef = db.doc(
    `businesses/${businessId}/hrPayrollEmployeeLines/${lineId}`,
  );

  return db.runTransaction(async (transaction) => {
    const timestamp = FieldValue.serverTimestamp();
    const lineSnap = await transaction.get(lineRef);
    if (!lineSnap.exists) {
      throw new HttpsError('not-found', 'La linea de colaborador no existe.');
    }

    const line = { id: lineSnap.id, ...lineSnap.data() };
    const periodId = toCleanString(line.periodId);
    const payrollRunId = toCleanString(line.payrollRunId);
    const periodRef = periodId
      ? db.doc(`businesses/${businessId}/hrCommissionPeriods/${periodId}`)
      : null;
    const payrollRunRef = payrollRunId
      ? db.doc(`businesses/${businessId}/hrPayrollRuns/${payrollRunId}`)
      : null;
    const [periodSnap, linesSnap] = await Promise.all([
      periodRef ? transaction.get(periodRef) : null,
      periodId
        ? transaction.get(
            db
              .collection(`businesses/${businessId}/hrPayrollEmployeeLines`)
              .where('periodId', '==', periodId),
          )
        : null,
    ]);
    const period = periodSnap?.exists
      ? { id: periodSnap.id, ...periodSnap.data() }
      : null;
    const periodStatus = normalizeHrCommissionPeriodStatus(
      period?.status ?? line.status,
    );
    if (!['draft', 'closed'].includes(periodStatus)) {
      throw new HttpsError(
        'failed-precondition',
        'Solo puedes editar el total antes de aprobar el corte.',
      );
    }

    const employeeLines = linesSnap
      ? linesSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      : [line];
    const adjustment = buildHrPayrollEmployeeLinePayableAdjustment({
      comment:
        payload.comment ??
        payload.adjustmentComment ??
        payload.modificationComment ??
        payload.notes,
      employeeLines,
      historyTimestamp: Timestamp.now(),
      line,
      timestamp,
      totalToPay:
        payload.totalToPay ??
        payload.totalPayableAmount ??
        payload.netAmount ??
        payload.amount,
      userId: authUid,
    });
    if (!adjustment.ok) {
      throw new HttpsError('failed-precondition', adjustment.error);
    }

    transaction.set(lineRef, adjustment.linePatch, { merge: true });
    if (payrollRunRef) {
      transaction.set(payrollRunRef, adjustment.aggregatePatch, {
        merge: true,
      });
    }
    if (periodRef) {
      transaction.set(periodRef, adjustment.aggregatePatch, { merge: true });
    }

    return {
      ok: true,
      businessId,
      periodId,
      payrollRunId,
      payrollLineId: lineId,
      deductionsAmount: adjustment.deductionsAmount,
      grossAmount: adjustment.grossAmount,
      netAmount: adjustment.netAmount,
      previousNetAmount: adjustment.previousNetAmount,
    };
  });
};

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
    if (action === 'upsert_cut_rule') {
      return upsertHrCommissionCutRule({ authUid, businessId, payload });
    }
    if (action === 'deactivate_cut_rule') {
      return deactivateHrCommissionCutRule({ authUid, businessId, payload });
    }
    if (action === 'create') {
      return createHrCommissionPeriod({ authUid, businessId, payload });
    }
    if (action === 'adjust_line') {
      return adjustHrCommissionPeriodLine({ authUid, businessId, payload });
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
