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
  buildHrCommissionAccrualAccountingEvent,
  buildHrCommissionCutDocuments,
  buildHrPayrollEmployeeLinePayableAdjustment,
  detectHrCommissionRetroactiveEntries,
  HR_COMMISSION_BUSINESS_TIME_ZONE,
  normalizeHrCommissionCutRule,
  normalizeHrCommissionPeriodDateRange,
  normalizeHrCommissionPeriodStatus,
  resolveNextHrCommissionCutRuleRange,
  resolveHrCommissionPeriodId,
  resolveHrCommissionPeriodBusinessDateKeys,
} from '../services/hrCommissionPeriods.service.js';

const MAX_CUT_ENTRIES = 450;
const MAX_CUT_ENTRY_QUERY_SIZE = MAX_CUT_ENTRIES + 1;
const ACTIONS = new Set([
  'preview_next',
  'list_retroactive_entries',
  'resolve_retroactive_entries',
  'unresolve_retroactive_entries',
  'create',
  'close',
  'approve',
  'revert_approval',
  'adjust_line',
  'upsert_cut_rule',
  'deactivate_cut_rule',
]);
const LOCKED_RETROACTIVE_PERIOD_STATUSES = new Set([
  'approved',
  'partially_paid',
  'paid',
]);
const RECALCULABLE_RETROACTIVE_PERIOD_STATUSES = new Set(['draft', 'closed']);
const ACTIVE_RETROACTIVE_RESOLUTION_STATUSES = new Set([
  'selected_for_next_cut',
  'included_in_cut',
  'paid',
  'cancelled',
]);
const ELIGIBLE_ENTRY_STATUSES = new Set(['calculated', 'eligible']);

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

const requireApprovalReversalReason = (payload) => {
  const reason =
    toCleanString(payload.reason) ||
    toCleanString(payload.reversalReason) ||
    toCleanString(payload.comment) ||
    toCleanString(payload.notes);
  if (!reason || reason.length < 6) {
    throw new HttpsError(
      'invalid-argument',
      'Indica un motivo de al menos 6 caracteres para revertir la aprobación.',
    );
  }
  return reason.slice(0, 500);
};

const normalizeEntryIdList = (value) => {
  const rawValues = Array.isArray(value)
    ? value
    : Array.isArray(value?.entryIds)
      ? value.entryIds
      : [];
  const entryIds = rawValues.map(toCleanString).filter(Boolean);
  return Array.from(new Set(entryIds));
};

const roundMoney = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
};

const getAccountingEventProjection = (event) => asRecord(event?.projection);

const getAccountingEventProjectionStatus = (event) =>
  toCleanString(getAccountingEventProjection(event).status) ||
  toCleanString(event?.projectionStatus);

const getAccountingEventJournalEntryId = (event) =>
  toCleanString(getAccountingEventProjection(event).journalEntryId) ||
  toCleanString(event?.journalEntryId) ||
  toCleanString(asRecord(event?.metadata).journalEntryId);

const isAccountingEventProjected = (event) =>
  toCleanString(event?.status) === 'projected' ||
  getAccountingEventProjectionStatus(event) === 'projected' ||
  Boolean(getAccountingEventJournalEntryId(event));

const hasPaidPayrollLineState = (line) =>
  normalizeHrCommissionPeriodStatus(line?.status) === 'paid' ||
  Boolean(toCleanString(line?.employeePaymentId)) ||
  Boolean(line?.paidAt) ||
  roundMoney(line?.paidAmount) > 0;

const buildApprovalReversalHistory = ({ period, reason, timestamp, userId }) => {
  const currentHistory = Array.isArray(period?.approvalReversalHistory)
    ? period.approvalReversalHistory
    : [];
  return [
    ...currentHistory.slice(-9),
    {
      accountingEventId: toCleanString(period?.accountingEventId),
      reason,
      reversedAt: timestamp,
      reversedBy: userId,
    },
  ];
};

const sumCommissionAmount = (entries = []) =>
  roundMoney(
    (Array.isArray(entries) ? entries : []).reduce(
      (sum, entry) => sum + roundMoney(entry?.commissionAmount),
      0,
    ),
  );

const getRetroactiveResolutionStatus = (entry) => {
  const status = toCleanString(entry?.retroactiveResolutionStatus);
  return ACTIVE_RETROACTIVE_RESOLUTION_STATUSES.has(status) ? status : null;
};

const isSelectedForTargetPeriod = (entry, targetPeriodId) =>
  getRetroactiveResolutionStatus(entry) === 'selected_for_next_cut' &&
  toCleanString(entry?.retroactiveTargetPeriodId) === targetPeriodId;

const isSelectedForOtherTargetPeriod = (entry, targetPeriodId) =>
  getRetroactiveResolutionStatus(entry) === 'selected_for_next_cut' &&
  toCleanString(entry?.retroactiveTargetPeriodId) &&
  toCleanString(entry?.retroactiveTargetPeriodId) !== targetPeriodId;

const getRetroactiveEntryAction = (entry, targetPeriodId) => {
  const resolutionStatus = getRetroactiveResolutionStatus(entry);
  if (isSelectedForTargetPeriod(entry, targetPeriodId)) {
    return 'selected_for_next_cut';
  }
  if (isSelectedForOtherTargetPeriod(entry, targetPeriodId)) {
    return 'selected_for_other_cut';
  }
  if (resolutionStatus === 'included_in_cut' || resolutionStatus === 'paid') {
    return resolutionStatus;
  }

  const originalStatus = normalizeHrCommissionPeriodStatus(
    entry?.originalPeriodStatus,
  );
  if (LOCKED_RETROACTIVE_PERIOD_STATUSES.has(originalStatus)) {
    return 'adjustment_required';
  }
  if (RECALCULABLE_RETROACTIVE_PERIOD_STATUSES.has(originalStatus)) {
    return 'recalculable';
  }
  return 'review_required';
};

const splitRetroactiveEntriesForTarget = (entries = [], targetPeriodId) => {
  const selectedForTarget = [];
  const selectedForOtherTarget = [];
  const adjustmentRequiredPending = [];
  const recalculable = [];
  const alreadyResolved = [];
  const reviewRequired = [];

  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    const action = getRetroactiveEntryAction(entry, targetPeriodId);
    if (action === 'selected_for_next_cut') {
      selectedForTarget.push(entry);
      return;
    }
    if (action === 'selected_for_other_cut') {
      selectedForOtherTarget.push(entry);
      return;
    }
    if (action === 'adjustment_required') {
      adjustmentRequiredPending.push(entry);
      return;
    }
    if (action === 'recalculable') {
      recalculable.push(entry);
      return;
    }
    if (action === 'included_in_cut' || action === 'paid') {
      alreadyResolved.push(entry);
      return;
    }
    reviewRequired.push(entry);
  });

  return {
    selectedForTarget,
    selectedForOtherTarget,
    adjustmentRequiredPending,
    recalculable,
    alreadyResolved,
    reviewRequired,
    blockedCount:
      selectedForOtherTarget.length +
      adjustmentRequiredPending.length +
      reviewRequired.length,
  };
};

const toRetroactiveEntryResult = (entry, targetPeriodId) => ({
  id: toCleanString(entry?.id),
  entryId: toCleanString(entry?.id),
  dateKey: toCleanString(entry?.dateKey),
  employeeId: toCleanString(entry?.employeeId),
  employeeCode: toCleanString(entry?.employeeCode),
  employeeNameSnapshot: toCleanString(entry?.employeeNameSnapshot),
  invoiceId: toCleanString(entry?.invoiceId),
  invoiceNumber: toCleanString(entry?.invoiceNumber),
  serviceId: toCleanString(entry?.serviceId),
  serviceName: toCleanString(entry?.serviceName),
  commissionAmount: roundMoney(entry?.commissionAmount),
  currency: toCleanString(entry?.currency) || 'DOP',
  originalPeriodId: toCleanString(entry?.originalPeriodId),
  originalPeriodLabel: toCleanString(entry?.originalPeriodLabel),
  originalStartDateKey: toCleanString(entry?.originalStartDateKey),
  originalEndDateKey: toCleanString(entry?.originalEndDateKey),
  originalPeriodStatus: normalizeHrCommissionPeriodStatus(
    entry?.originalPeriodStatus,
  ),
  retroactiveResolutionStatus: getRetroactiveResolutionStatus(entry),
  retroactiveTargetPeriodId: toCleanString(entry?.retroactiveTargetPeriodId),
  selectedForCurrentCut: isSelectedForTargetPeriod(entry, targetPeriodId),
  action: getRetroactiveEntryAction(entry, targetPeriodId),
});

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
  normalEntriesCount: Number(period?.normalEntriesCount) || 0,
  retroactiveAdjustmentAmount: Number(period?.retroactiveAdjustmentAmount) || 0,
  retroactiveAdjustmentsCount: Number(period?.retroactiveAdjustmentsCount) || 0,
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

const toPreviewResult = ({
  context,
  documents = null,
  employees = [],
  entries = [],
  exceedsMaxCutEntries = false,
  retroactiveMeta = null,
} = {}) => {
  const sampledEmployeeIds = new Set(
    (Array.isArray(entries) ? entries : [])
      .map((entry) => toCleanString(entry.employeeId))
      .filter(Boolean),
  );
  (Array.isArray(employees) ? employees : [])
    .filter((employee) => {
      const status = toCleanString(employee.status)?.toLowerCase() || 'active';
      const payType = toCleanString(employee.payType);
      return (
        status === 'active' &&
        ['salary', 'mixed'].includes(payType) &&
        Number(employee.baseSalaryAmount) > 0
      );
    })
    .forEach((employee) => {
      const employeeId =
        toCleanString(employee.employeeId) || toCleanString(employee.id);
      if (employeeId) sampledEmployeeIds.add(employeeId);
    });

  const selectedRetroactiveEntries = retroactiveMeta?.selectedForTarget ?? [];
  const pendingRetroactiveEntries =
    retroactiveMeta?.adjustmentRequiredPending ?? [];
  const recalculableRetroactiveEntries = retroactiveMeta?.recalculable ?? [];
  const incompatibleRetroactiveEntries =
    retroactiveMeta?.selectedForOtherTarget ?? [];
  const reviewRequiredRetroactiveEntries =
    retroactiveMeta?.reviewRequired ?? [];
  const retroactiveCount =
    pendingRetroactiveEntries.length +
    selectedRetroactiveEntries.length +
    recalculableRetroactiveEntries.length +
    incompatibleRetroactiveEntries.length +
    reviewRequiredRetroactiveEntries.length;
  const documentsOk = documents?.ok === true;
  const blockedReason = (() => {
    if (exceedsMaxCutEntries) {
      return `Hay más de ${MAX_CUT_ENTRIES} entradas de comisión elegibles o retroactivas seleccionadas para este corte.`;
    }
    if (incompatibleRetroactiveEntries.length > 0) {
      return 'Hay comisiones retroactivas seleccionadas para otro corte. Libera esas entradas antes de crear el próximo corte.';
    }
    if (pendingRetroactiveEntries.length > 0) {
      return 'Hay comisiones retroactivas de cortes aprobados o pagados. Revísalas y selecciona cuáles se pagarán como ajuste en el próximo corte.';
    }
    if (reviewRequiredRetroactiveEntries.length > 0) {
      return 'Hay comisiones retroactivas que requieren revisión antes de crear el próximo corte.';
    }
    return documentsOk ? null : documents?.error || null;
  })();

  return {
    ok: true,
    preview: true,
    blocked: Boolean(blockedReason),
    blockedReason,
    businessId: toCleanString(context?.cutRule?.businessId),
    ruleId: toCleanString(context?.cutRule?.id),
    ruleLabel: toCleanString(context?.cutRule?.label),
    frequency: toCleanString(context?.cutRule?.frequency) || 'monthly',
    startDateKey: context?.range?.startKey ?? null,
    endDateKey: context?.range?.endKey ?? null,
    businessTimeZone:
      context?.range?.businessTimeZone || HR_COMMISSION_BUSINESS_TIME_ZONE,
    employeesCount: documentsOk
      ? Number(documents.period.employeesCount) || 0
      : sampledEmployeeIds.size,
    entriesCount: documentsOk
      ? Number(documents.period.entriesCount) || 0
      : entries.length,
    normalEntriesCount: entries.length,
    totalEstimatedAmount: documentsOk
      ? Number(documents.period.netAmount) ||
        Number(documents.period.totalPayableAmount) ||
        0
      : entries.reduce(
          (sum, entry) => sum + (Number(entry.commissionAmount) || 0),
          0,
        ),
    currency: documentsOk
      ? toCleanString(documents.period.currency) || 'DOP'
      : toCleanString(entries[0]?.currency) || 'DOP',
    exceedsMaxCutEntries,
    maxCutEntries: MAX_CUT_ENTRIES,
    retroactiveEntriesCount: retroactiveCount,
    selectedRetroactiveEntriesCount: selectedRetroactiveEntries.length,
    pendingRetroactiveEntriesCount: pendingRetroactiveEntries.length,
    recalculableRetroactiveEntriesCount: recalculableRetroactiveEntries.length,
    incompatibleRetroactiveEntriesCount: incompatibleRetroactiveEntries.length,
    reviewRequiredRetroactiveEntriesCount:
      reviewRequiredRetroactiveEntries.length,
    retroactiveAdjustmentAmount: sumCommissionAmount(
      selectedRetroactiveEntries,
    ),
    hasRetroactiveEntries:
      pendingRetroactiveEntries.length > 0 ||
      incompatibleRetroactiveEntries.length > 0 ||
      reviewRequiredRetroactiveEntries.length > 0,
    hasRetroactiveAdjustments: selectedRetroactiveEntries.length > 0,
    canCreate: !blockedReason,
  };
};

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
      'La regla de corte está inactiva.',
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

const resolveGeneratedPeriodRange = (
  period,
  { timeZone = HR_COMMISSION_BUSINESS_TIME_ZONE } = {},
) => {
  const keys = resolveHrCommissionPeriodBusinessDateKeys(period, {
    timeZone,
  });
  if (!keys.startDateKey || !keys.endDateKey) return null;
  const range = normalizeHrCommissionPeriodDateRange({
    businessTimeZone: keys.businessTimeZone || timeZone,
    endDate: period.endDate,
    endDateKey: keys.endDateKey,
    startDate: period.startDate,
    startDateKey: keys.startDateKey,
  });

  return range.ok ? range : null;
};

const findRetroactiveEntriesForGeneratedPeriods = async ({
  businessId,
  periods,
  timeZone = HR_COMMISSION_BUSINESS_TIME_ZONE,
}) => {
  const ranges = (Array.isArray(periods) ? periods : [])
    .filter((period) => toCleanString(period?.status) !== 'cancelled')
    .map((period) => resolveGeneratedPeriodRange(period, { timeZone }))
    .filter(Boolean);
  if (!ranges.length) return { count: 0, entries: [] };

  const start = ranges.reduce(
    (earliest, range) =>
      !earliest || range.start.getTime() < earliest.getTime()
        ? range.start
        : earliest,
    null,
  );
  const end = ranges.reduce(
    (latest, range) =>
      !latest || range.end.getTime() > latest.getTime() ? range.end : latest,
    null,
  );
  if (!start || !end) return { count: 0, entries: [] };

  const entriesSnap = await db
    .collection(`businesses/${businessId}/hrCommissionEntries`)
    .where('date', '>=', Timestamp.fromDate(start))
    .where('date', '<=', Timestamp.fromDate(end))
    .orderBy('date', 'asc')
    .get();
  const entries = entriesSnap.docs.map((entrySnap) => ({
    id: entrySnap.id,
    ...entrySnap.data(),
  }));

  return detectHrCommissionRetroactiveEntries({
    businessTimeZone: timeZone,
    entries,
    periods,
  });
};

const resolveNextCutContext = async ({ businessId, payload }) => {
  const ruleId = requireCutRuleId(payload);
  const cutRule = await readCutRule({ businessId, ruleId });
  const priorPeriods = await readCutRulePeriods({ businessId, ruleId });
  const retroactiveEntries = await findRetroactiveEntriesForGeneratedPeriods({
    businessId,
    periods: priorPeriods,
    timeZone: cutRule.businessTimeZone || HR_COMMISSION_BUSINESS_TIME_ZONE,
  });
  const nextRange = resolveNextHrCommissionCutRuleRange({
    periods: priorPeriods,
    rule: cutRule,
    timeZone: cutRule.businessTimeZone || HR_COMMISSION_BUSINESS_TIME_ZONE,
  });
  if (!nextRange.ok) {
    throw new HttpsError('failed-precondition', nextRange.error);
  }

  const range = normalizeHrCommissionPeriodDateRange({
    businessTimeZone:
      nextRange.businessTimeZone ||
      cutRule.businessTimeZone ||
      HR_COMMISSION_BUSINESS_TIME_ZONE,
    startDate: nextRange.start,
    startDateKey: nextRange.startKey,
    endDate: nextRange.end,
    endDateKey: nextRange.endKey,
  });
  if (!range.ok) {
    throw new HttpsError('invalid-argument', range.error);
  }

  const periodId = resolveHrCommissionPeriodId({
    endDate: range.end,
    endDateKey: range.endKey,
    startDate: range.start,
    startDateKey: range.startKey,
  });

  return {
    cutRule,
    periodId,
    priorPeriods,
    range,
    retroactiveEntries,
    ruleId,
  };
};

const readEntriesForCutRange = async ({ businessId, range }) => {
  const entriesSnap = await db
    .collection(`businesses/${businessId}/hrCommissionEntries`)
    .where('date', '>=', Timestamp.fromDate(range.start))
    .where('date', '<=', Timestamp.fromDate(range.end))
    .orderBy('date', 'asc')
    .limit(MAX_CUT_ENTRY_QUERY_SIZE)
    .get();
  const entries = entriesSnap.docs.map((entrySnap) => ({
    id: entrySnap.id,
    ref: entrySnap.ref,
    ...entrySnap.data(),
  }));

  return {
    entries,
    exceedsMaxCutEntries: entriesSnap.docs.length > MAX_CUT_ENTRIES,
  };
};

const readActiveEmployees = async ({ businessId, transaction = null }) => {
  const employeesQuery = db
    .collection(`businesses/${businessId}/hrEmployees`)
    .where('status', '==', 'active');
  const employeesSnap = transaction
    ? await transaction.get(employeesQuery)
    : await employeesQuery.get();

  return employeesSnap.docs.map((employeeSnap) => ({
    id: employeeSnap.id,
    ...employeeSnap.data(),
  }));
};

const buildRetroactiveEntriesResult = ({ context, meta }) => ({
  ok: true,
  businessId: toCleanString(context?.cutRule?.businessId),
  ruleId: toCleanString(context?.cutRule?.id),
  ruleLabel: toCleanString(context?.cutRule?.label),
  targetPeriodId: context?.periodId ?? null,
  startDateKey: context?.range?.startKey ?? null,
  endDateKey: context?.range?.endKey ?? null,
  businessTimeZone:
    context?.range?.businessTimeZone || HR_COMMISSION_BUSINESS_TIME_ZONE,
  totalCount: Number(context?.retroactiveEntries?.count) || 0,
  selectedForTargetCount: meta.selectedForTarget.length,
  adjustmentRequiredCount: meta.adjustmentRequiredPending.length,
  recalculableCount: meta.recalculable.length,
  selectedForOtherTargetCount: meta.selectedForOtherTarget.length,
  reviewRequiredCount: meta.reviewRequired.length,
  retroactiveAdjustmentAmount: sumCommissionAmount(meta.selectedForTarget),
  entries: (context?.retroactiveEntries?.entries ?? []).map((entry) =>
    toRetroactiveEntryResult(entry, context.periodId),
  ),
});

const listHrCommissionRetroactiveEntries = async ({ businessId, payload }) => {
  const context = await resolveNextCutContext({ businessId, payload });
  const meta = splitRetroactiveEntriesForTarget(
    context.retroactiveEntries.entries,
    context.periodId,
  );
  return buildRetroactiveEntriesResult({ context, meta });
};

const resolveHrCommissionRetroactiveEntries = async ({
  authUid,
  businessId,
  payload,
}) => {
  const entryIds = normalizeEntryIdList(payload.entryIds ?? payload);
  if (!entryIds.length) {
    throw new HttpsError(
      'invalid-argument',
      'Selecciona al menos una comisión retroactiva.',
    );
  }

  const context = await resolveNextCutContext({ businessId, payload });
  const entriesById = new Map(
    (context.retroactiveEntries.entries ?? []).map((entry) => [
      entry.id,
      entry,
    ]),
  );
  const timestamp = FieldValue.serverTimestamp();

  return db.runTransaction(async (transaction) => {
    const entryRefs = entryIds.map((entryId) =>
      db.doc(`businesses/${businessId}/hrCommissionEntries/${entryId}`),
    );
    const entrySnaps = await Promise.all(
      entryRefs.map((entryRef) => transaction.get(entryRef)),
    );

    entrySnaps.forEach((entrySnap, index) => {
      const entryId = entryIds[index];
      if (!entrySnap.exists) {
        throw new HttpsError(
          'not-found',
          `La comisión retroactiva ${entryId} no existe.`,
        );
      }

      const currentEntry = { id: entrySnap.id, ...entrySnap.data() };
      const candidate = entriesById.get(entryId);
      if (!candidate) {
        throw new HttpsError(
          'failed-precondition',
          'La comisión seleccionada no está dentro de un corte generado o ya no es elegible como retroactiva.',
        );
      }

      const originalStatus = normalizeHrCommissionPeriodStatus(
        candidate.originalPeriodStatus,
      );
      if (!LOCKED_RETROACTIVE_PERIOD_STATUSES.has(originalStatus)) {
        throw new HttpsError(
          'failed-precondition',
          'Solo las retroactivas de cortes aprobados o pagados pueden seleccionarse como ajuste del próximo corte.',
        );
      }

      const currentStatus = toCleanString(currentEntry.status);
      if (!ELIGIBLE_ENTRY_STATUSES.has(currentStatus)) {
        throw new HttpsError(
          'failed-precondition',
          'La comisión retroactiva ya no está disponible para incluirse como ajuste.',
        );
      }
      if (
        toCleanString(currentEntry.periodId) ||
        toCleanString(currentEntry.payrollRunId) ||
        toCleanString(currentEntry.payrollEmployeeLineId) ||
        toCleanString(currentEntry.employeePaymentId)
      ) {
        throw new HttpsError(
          'failed-precondition',
          'La comisión retroactiva ya fue incorporada o pagada en otro flujo.',
        );
      }
      if (isSelectedForOtherTargetPeriod(currentEntry, context.periodId)) {
        throw new HttpsError(
          'failed-precondition',
          'La comisión retroactiva ya está seleccionada para otro corte.',
        );
      }
      if (
        ['included_in_cut', 'paid', 'cancelled'].includes(
          getRetroactiveResolutionStatus(currentEntry),
        )
      ) {
        throw new HttpsError(
          'failed-precondition',
          'La comisión retroactiva ya fue resuelta y no puede seleccionarse de nuevo.',
        );
      }

      transaction.set(
        entrySnap.ref,
        {
          isRetroactive: true,
          originalPeriodId: candidate.originalPeriodId ?? null,
          originalPeriodLabel: candidate.originalPeriodLabel ?? null,
          originalStartDateKey: candidate.originalStartDateKey ?? null,
          originalEndDateKey: candidate.originalEndDateKey ?? null,
          originalPeriodStatus: originalStatus,
          retroactiveResolutionStatus: 'selected_for_next_cut',
          retroactiveTargetPeriodId: context.periodId,
          retroactiveTargetStartDateKey: context.range.startKey,
          retroactiveTargetEndDateKey: context.range.endKey,
          retroactiveTargetRuleId: context.cutRule.id,
          retroactiveResolvedAt: timestamp,
          retroactiveResolvedBy: authUid,
          retroactiveResolutionNote: toCleanString(payload.note),
          retroactiveResolutionDedupeKey: `${businessId}:${candidate.originalPeriodId}:${entryId}:${context.periodId}`,
          updatedAt: timestamp,
          updatedBy: authUid,
        },
        { merge: true },
      );
    });

    return {
      ok: true,
      businessId,
      targetPeriodId: context.periodId,
      resolvedCount: entryIds.length,
      entryIds,
    };
  });
};

const unresolveHrCommissionRetroactiveEntries = async ({
  authUid,
  businessId,
  payload,
}) => {
  const entryIds = normalizeEntryIdList(payload.entryIds ?? payload);
  if (!entryIds.length) {
    throw new HttpsError(
      'invalid-argument',
      'Selecciona al menos una comisión retroactiva.',
    );
  }

  const context = await resolveNextCutContext({ businessId, payload });
  const timestamp = FieldValue.serverTimestamp();

  return db.runTransaction(async (transaction) => {
    const entryRefs = entryIds.map((entryId) =>
      db.doc(`businesses/${businessId}/hrCommissionEntries/${entryId}`),
    );
    const entrySnaps = await Promise.all(
      entryRefs.map((entryRef) => transaction.get(entryRef)),
    );

    entrySnaps.forEach((entrySnap, index) => {
      const entryId = entryIds[index];
      if (!entrySnap.exists) {
        throw new HttpsError(
          'not-found',
          `La comisión retroactiva ${entryId} no existe.`,
        );
      }

      const currentEntry = { id: entrySnap.id, ...entrySnap.data() };
      if (!isSelectedForTargetPeriod(currentEntry, context.periodId)) {
        throw new HttpsError(
          'failed-precondition',
          'Solo puedes quitar retroactivas seleccionadas para el próximo corte actual.',
        );
      }
      if (
        toCleanString(currentEntry.periodId) ||
        toCleanString(currentEntry.payrollRunId) ||
        toCleanString(currentEntry.payrollEmployeeLineId) ||
        toCleanString(currentEntry.employeePaymentId)
      ) {
        throw new HttpsError(
          'failed-precondition',
          'La comisión retroactiva ya fue incorporada o pagada y no puede quitarse.',
        );
      }

      transaction.set(
        entrySnap.ref,
        {
          retroactiveResolutionStatus: null,
          retroactiveTargetPeriodId: null,
          retroactiveTargetStartDateKey: null,
          retroactiveTargetEndDateKey: null,
          retroactiveTargetRuleId: null,
          retroactiveResolvedAt: null,
          retroactiveResolvedBy: null,
          retroactiveResolutionNote: null,
          retroactiveResolutionDedupeKey: null,
          retroactiveUnresolvedAt: timestamp,
          retroactiveUnresolvedBy: authUid,
          updatedAt: timestamp,
          updatedBy: authUid,
        },
        { merge: true },
      );
    });

    return {
      ok: true,
      businessId,
      targetPeriodId: context.periodId,
      unresolvedCount: entryIds.length,
      entryIds,
    };
  });
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
  const rulePayload = await db.runTransaction(async (transaction) => {
    const existingSnap = await transaction.get(ruleRef);
    const nextRulePayload = {
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

    if (nextRulePayload.active) {
      const activeRulesSnap = await transaction.get(
        db
          .collection(`businesses/${businessId}/hrCommissionCutRules`)
          .where('active', '==', true),
      );
      activeRulesSnap.docs.forEach((activeRuleSnap) => {
        if (activeRuleSnap.id === normalized.rule.id) return;
        transaction.set(
          activeRuleSnap.ref,
          {
            active: false,
            deactivatedAt: timestamp,
            deactivatedBy: authUid,
            replacedByCutRuleId: normalized.rule.id,
            updatedAt: timestamp,
            updatedBy: authUid,
          },
          { merge: true },
        );
      });
    }

    transaction.set(ruleRef, nextRulePayload, { merge: true });
    return nextRulePayload;
  });

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

const previewNextHrCommissionPeriod = async ({ businessId, payload }) => {
  const context = await resolveNextCutContext({ businessId, payload });
  const retroactiveMeta = splitRetroactiveEntriesForTarget(
    context.retroactiveEntries.entries,
    context.periodId,
  );
  const { entries, exceedsMaxCutEntries } = await readEntriesForCutRange({
    businessId,
    range: context.range,
  });
  const totalEntriesCount =
    entries.length + retroactiveMeta.selectedForTarget.length;
  const exceedsTotalMaxCutEntries =
    exceedsMaxCutEntries || totalEntriesCount > MAX_CUT_ENTRIES;
  const employees = await readActiveEmployees({ businessId });
  const documents =
    exceedsTotalMaxCutEntries || retroactiveMeta.blockedCount > 0
      ? null
      : buildHrCommissionCutDocuments({
          businessId,
          cutRule: context.cutRule,
          employees,
          entries,
          retroactiveEntries: retroactiveMeta.selectedForTarget,
          endDate: context.range.end,
          endDateKey: context.range.endKey,
          periodId: context.periodId,
          startDate: context.range.start,
          startDateKey: context.range.startKey,
          businessTimeZone: context.range.businessTimeZone,
          timestamp: FieldValue.serverTimestamp(),
          userId: null,
        });

  return toPreviewResult({
    context,
    documents,
    employees,
    entries,
    exceedsMaxCutEntries: exceedsTotalMaxCutEntries,
    retroactiveMeta,
  });
};

const createHrCommissionPeriod = async ({ authUid, businessId, payload }) => {
  const context = await resolveNextCutContext({ businessId, payload });
  const { cutRule, periodId, range, retroactiveEntries } = context;
  const retroactiveMeta = splitRetroactiveEntriesForTarget(
    retroactiveEntries.entries,
    periodId,
  );
  if (retroactiveMeta.adjustmentRequiredPending.length > 0) {
    throw new HttpsError(
      'failed-precondition',
      `El corte no fue creado porque hay ${retroactiveMeta.adjustmentRequiredPending.length} comisiones retroactivas de cortes aprobados o pagados pendientes de resolver. Revísalas antes de crear el próximo corte.`,
    );
  }
  if (retroactiveMeta.selectedForOtherTarget.length > 0) {
    throw new HttpsError(
      'failed-precondition',
      'El corte no fue creado porque hay comisiones retroactivas seleccionadas para otro corte.',
    );
  }
  if (retroactiveMeta.reviewRequired.length > 0) {
    throw new HttpsError(
      'failed-precondition',
      'El corte no fue creado porque hay comisiones retroactivas que requieren revisión.',
    );
  }

  const periodRef = db.doc(
    `businesses/${businessId}/hrCommissionPeriods/${periodId}`,
  );
  const { entries: queriedEntries, exceedsMaxCutEntries } =
    await readEntriesForCutRange({
      businessId,
      range,
    });
  const totalEntriesCount =
    queriedEntries.length + retroactiveMeta.selectedForTarget.length;
  if (exceedsMaxCutEntries || totalEntriesCount > MAX_CUT_ENTRIES) {
    throw new HttpsError(
      'failed-precondition',
      `El corte no fue creado porque hay más de ${MAX_CUT_ENTRIES} entradas de comisión elegibles o retroactivas seleccionadas para este corte. Divide el procesamiento o depura las entradas antes de generar el corte.`,
    );
  }
  const entryRefs = queriedEntries.map((entry) => entry.ref);
  const retroactiveEntryRefs = retroactiveMeta.selectedForTarget.map((entry) =>
    db.doc(`businesses/${businessId}/hrCommissionEntries/${entry.id}`),
  );
  const selectedRetroactiveEntryIds = new Set(
    retroactiveMeta.selectedForTarget.map((entry) => entry.id),
  );

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
    const retroactiveEntrySnaps = await Promise.all(
      retroactiveEntryRefs.map((entryRef) => transaction.get(entryRef)),
    );
    const entries = entrySnaps
      .filter((entrySnap) => entrySnap.exists)
      .map((entrySnap) => ({ id: entrySnap.id, ...entrySnap.data() }));
    const selectedRetroactiveEntries = retroactiveEntrySnaps
      .filter((entrySnap) => entrySnap.exists)
      .map((entrySnap) => ({ id: entrySnap.id, ...entrySnap.data() }));
    if (
      selectedRetroactiveEntries.length !== selectedRetroactiveEntryIds.size
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Una o más retroactivas seleccionadas ya no existen.',
      );
    }
    selectedRetroactiveEntries.forEach((entry) => {
      if (
        !selectedRetroactiveEntryIds.has(entry.id) ||
        !isSelectedForTargetPeriod(entry, periodId) ||
        !ELIGIBLE_ENTRY_STATUSES.has(toCleanString(entry.status)) ||
        toCleanString(entry.periodId) ||
        toCleanString(entry.payrollRunId) ||
        toCleanString(entry.payrollEmployeeLineId) ||
        toCleanString(entry.employeePaymentId)
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Una o más retroactivas seleccionadas ya no están disponibles para este corte.',
        );
      }
    });
    const employees = await readActiveEmployees({ businessId, transaction });
    const documents = buildHrCommissionCutDocuments({
      businessId,
      cutRule,
      employees,
      entries,
      retroactiveEntries: selectedRetroactiveEntries,
      endDate: range.end,
      endDateKey: range.endKey,
      periodId,
      startDate: range.start,
      startDateKey: range.startKey,
      businessTimeZone: range.businessTimeZone,
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
      (Array.isArray(line.retroactiveEntryIds) ? line.retroactiveEntryIds : [])
        .map(toCleanString)
        .filter(Boolean)
        .forEach((entryId) => {
          transaction.set(
            db.doc(`businesses/${businessId}/hrCommissionEntries/${entryId}`),
            {
              status: 'approved',
              retroactiveResolutionStatus: 'included_in_cut',
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

const revertHrCommissionPeriodApproval = async ({
  authUid,
  businessId,
  payload,
}) => {
  const periodId = requirePeriodId(payload);
  const reason = requireApprovalReversalReason(payload);

  return db.runTransaction(async (transaction) => {
    const timestamp = FieldValue.serverTimestamp();
    const historyTimestamp = Timestamp.fromDate(new Date());
    const { periodRef, period } = await readPeriodSnapshot(
      transaction,
      businessId,
      periodId,
    );
    const status = normalizeHrCommissionPeriodStatus(period.status);

    if (status === 'closed') {
      return toPeriodResult({ period, reused: true });
    }
    if (status !== 'approved') {
      throw new HttpsError(
        'failed-precondition',
        'Solo puedes revertir un corte aprobado y sin pagos registrados.',
      );
    }
    if (
      roundMoney(period.paidAmount) > 0 ||
      Number(period.paidLinesCount) > 0
    ) {
      throw new HttpsError(
        'failed-precondition',
        'No puedes revertir un corte con pagos registrados. Usa ajustes o retroactivas.',
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
    const paymentsSnap = await transaction.get(
      db
        .collection(`businesses/${businessId}/hrEmployeePayments`)
        .where('periodId', '==', periodId)
        .where('status', '==', 'confirmed')
        .limit(1),
    );
    if (paymentsSnap.docs.length > 0) {
      throw new HttpsError(
        'failed-precondition',
        'No puedes revertir un corte con pagos confirmados.',
      );
    }

    const employeeLines = linesSnap.docs.map((lineSnap) => ({
      id: lineSnap.id,
      ref: lineSnap.ref,
      ...lineSnap.data(),
    }));
    if (employeeLines.some(hasPaidPayrollLineState)) {
      throw new HttpsError(
        'failed-precondition',
        'No puedes revertir un corte con líneas pagadas.',
      );
    }

    const accountingEventId = toCleanString(period.accountingEventId);
    const accountingEventRef = accountingEventId
      ? db.doc(`businesses/${businessId}/accountingEvents/${accountingEventId}`)
      : null;
    const accountingEventSnap = accountingEventRef
      ? await transaction.get(accountingEventRef)
      : null;
    const accountingEvent = accountingEventSnap?.exists
      ? { id: accountingEventSnap.id, ...accountingEventSnap.data() }
      : null;
    if (accountingEvent && isAccountingEventProjected(accountingEvent)) {
      throw new HttpsError(
        'failed-precondition',
        'El devengo contable ya fue proyectado. Registra un ajuste en vez de revertir la aprobación.',
      );
    }

    const reversalPatch = {
      status: 'closed',
      accountingEventId: null,
      approvedAt: null,
      approvedBy: null,
      approvalReversedAt: timestamp,
      approvalReversedBy: authUid,
      approvalReversalCount: Number(period.approvalReversalCount) + 1 || 1,
      approvalReversalHistory: buildApprovalReversalHistory({
        period,
        reason,
        timestamp: historyTimestamp,
        userId: authUid,
      }),
      lastApprovalReversalReason: reason,
      updatedAt: timestamp,
      updatedBy: authUid,
    };
    const linePatch = {
      status: 'closed',
      accountingEventId: null,
      approvedAt: null,
      approvedBy: null,
      approvalReversedAt: timestamp,
      approvalReversedBy: authUid,
      updatedAt: timestamp,
      updatedBy: authUid,
    };
    const entryPatch = {
      status: 'included_in_cut',
      accountingEventId: null,
      updatedAt: timestamp,
      updatedBy: authUid,
    };

    transaction.set(periodRef, reversalPatch, { merge: true });
    transaction.set(runRef, reversalPatch, { merge: true });
    if (accountingEventRef) {
      transaction.set(
        accountingEventRef,
        {
          status: 'voided',
          voidedAt: timestamp,
          voidedBy: authUid,
          voidedReason: reason,
          updatedAt: timestamp,
          metadata: {
            ...asRecord(accountingEvent?.metadata),
            approvalReversalReason: reason,
            voidedBy: authUid,
            voidedSource: 'hrPayroll.manageHrCommissionPeriod',
          },
        },
        { merge: true },
      );
    }
    employeeLines.forEach((line) => {
      transaction.set(line.ref, linePatch, { merge: true });
      (Array.isArray(line.commissionEntryIds) ? line.commissionEntryIds : [])
        .map(toCleanString)
        .filter(Boolean)
        .forEach((entryId) => {
          transaction.set(
            db.doc(`businesses/${businessId}/hrCommissionEntries/${entryId}`),
            entryPatch,
            { merge: true },
          );
        });
      (Array.isArray(line.retroactiveEntryIds) ? line.retroactiveEntryIds : [])
        .map(toCleanString)
        .filter(Boolean)
        .forEach((entryId) => {
          transaction.set(
            db.doc(`businesses/${businessId}/hrCommissionEntries/${entryId}`),
            {
              ...entryPatch,
              isRetroactive: true,
              retroactiveResolutionStatus: 'included_in_cut',
            },
            { merge: true },
          );
        });
    });

    return toPeriodResult({
      period: { ...period, ...reversalPatch },
    });
  });
};

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
      throw new HttpsError('not-found', 'La línea de colaborador no existe.');
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
    if (action === 'preview_next') {
      return previewNextHrCommissionPeriod({ businessId, payload });
    }
    if (action === 'list_retroactive_entries') {
      return listHrCommissionRetroactiveEntries({ businessId, payload });
    }
    if (action === 'resolve_retroactive_entries') {
      return resolveHrCommissionRetroactiveEntries({
        authUid,
        businessId,
        payload,
      });
    }
    if (action === 'unresolve_retroactive_entries') {
      return unresolveHrCommissionRetroactiveEntries({
        authUid,
        businessId,
        payload,
      });
    }
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
    if (action === 'revert_approval') {
      return revertHrCommissionPeriodApproval({
        authUid,
        businessId,
        payload,
      });
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
