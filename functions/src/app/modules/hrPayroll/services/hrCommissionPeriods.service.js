import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import { calculateSalaryDeductions } from './hrSalaryDeductions.service.js';

const ELIGIBLE_ENTRY_STATUSES = new Set(['calculated', 'eligible']);
const CUT_RULE_FREQUENCIES = new Set(['weekly', 'biweekly', 'monthly']);
const PERIOD_STATUSES = new Set([
  'draft',
  'closed',
  'approved',
  'partially_paid',
  'paid',
  'cancelled',
]);
const LINE_ADJUSTABLE_STATUSES = new Set(['draft', 'closed']);
const ADJUSTMENT_COMMENT_MIN_LENGTH = 6;
const MAX_ADJUSTMENT_HISTORY = 20;
const THRESHOLD = 0.01;

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value) => Number(safeNumber(value).toFixed(2));

const toFiniteInputNumber = (value) => {
  if (typeof value === 'string' && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeDocId = (value) =>
  toCleanString(value)?.replace(/[^a-zA-Z0-9_-]/g, '_') || null;

const toIntegerInRange = (value, { fallback, max, min }) => {
  const parsed = Math.trunc(safeNumber(value, fallback));
  if (parsed < min || parsed > max) return null;
  return parsed;
};

const withoutUndefined = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );

const normalizeAdjustmentHistory = (value) =>
  Array.isArray(value)
    ? value.filter((entry) => entry && typeof entry === 'object')
    : [];

const resolveLineGrossAmount = (line) =>
  roundMoney(line.grossAmount ?? line.commissionAmount ?? line.netAmount);

const resolveLineNetAmount = (line) =>
  roundMoney(line.netAmount ?? line.commissionAmount ?? line.grossAmount);

const resolveLineDeductionAmount = (line) => {
  const explicitDeduction = roundMoney(line.deductionsAmount);
  if (explicitDeduction > THRESHOLD) return explicitDeduction;
  return Math.max(
    0,
    roundMoney(resolveLineGrossAmount(line) - resolveLineNetAmount(line)),
  );
};

const resolveLineManualAdjustmentAmount = (line) =>
  Math.max(0, roundMoney(line.manualAdjustmentAmount));

const resolveLineCalculatedPayableAmount = (line) =>
  roundMoney(
    resolveLineNetAmount(line) + resolveLineManualAdjustmentAmount(line),
  );

const toDateFromTimestampLike = (value) => {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value.toDate === 'function') {
    const dateValue = value.toDate();
    return dateValue instanceof Date && !Number.isNaN(dateValue.getTime())
      ? dateValue
      : null;
  }
  if (typeof value.toMillis === 'function') {
    const dateValue = new Date(value.toMillis());
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }
  if (typeof value === 'number') {
    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }
  if (typeof value === 'string') {
    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }
  if (typeof value === 'object') {
    const seconds =
      typeof value.seconds === 'number'
        ? value.seconds
        : typeof value._seconds === 'number'
          ? value._seconds
          : null;
    if (seconds != null) {
      const dateValue = new Date(seconds * 1000);
      return Number.isNaN(dateValue.getTime()) ? null : dateValue;
    }
  }
  return null;
};

const toDateKey = (date) => {
  const value = date instanceof Date ? date : toDateFromTimestampLike(date);
  if (!value) return null;
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toStartOfDay = (date) => {
  const value = new Date(date.getTime());
  value.setUTCHours(0, 0, 0, 0);
  return value;
};

const toEndOfDay = (date) => {
  const value = new Date(date.getTime());
  value.setUTCHours(23, 59, 59, 999);
  return value;
};

const parseBoundaryDate = (value, { endOfDay = false } = {}) => {
  const dateValue = toDateFromTimestampLike(value);
  if (!dateValue) return null;
  return endOfDay ? toEndOfDay(dateValue) : toStartOfDay(dateValue);
};

const toMillis = (value) => toDateFromTimestampLike(value)?.getTime() ?? null;

const getUtcDaysInMonth = (year, monthIndex) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const toUtcMonthAnchor = (dateLike) => {
  const dateValue = toDateFromTimestampLike(dateLike) ?? new Date();
  return new Date(
    Date.UTC(dateValue.getUTCFullYear(), dateValue.getUTCMonth(), 1),
  );
};

const toUtcDateAnchor = (dateLike) => {
  const dateValue = toDateFromTimestampLike(dateLike) ?? new Date();
  return new Date(
    Date.UTC(
      dateValue.getUTCFullYear(),
      dateValue.getUTCMonth(),
      dateValue.getUTCDate(),
    ),
  );
};

const addUtcDays = (date, days) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days,
    ),
  );

const toUtcWeekStart = (dateLike) => {
  const anchor = toUtcDateAnchor(dateLike);
  const day = anchor.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  return addUtcDays(anchor, -daysSinceMonday);
};

const isLegacyBiweeklyCutRuleRange = (startDay, endDay) =>
  (startDay === 1 && endDay === 15) || (startDay === 16 && endDay >= 28);

const normalizeCutRuleFrequency = ({ endDay, frequency, startDay } = {}) => {
  const normalized = toCleanString(frequency)?.toLowerCase();
  if (
    normalized === 'monthly' &&
    isLegacyBiweeklyCutRuleRange(startDay, endDay)
  ) {
    return 'biweekly';
  }
  return CUT_RULE_FREQUENCIES.has(normalized) ? normalized : 'monthly';
};

const getCutRuleDayDefaults = (frequency) => {
  if (frequency === 'weekly') {
    return { startDay: 1, endDay: 7 };
  }
  if (frequency === 'biweekly') {
    return { startDay: 1, endDay: 15 };
  }
  return { startDay: 1, endDay: 31 };
};

export const normalizeHrCommissionPeriodStatus = (value) => {
  const status = toCleanString(value)?.toLowerCase();
  return PERIOD_STATUSES.has(status) ? status : 'draft';
};

export const resolveHrCommissionCutRuleId = ({
  endDay,
  frequency = 'monthly',
  label,
  ruleId = null,
  startDay,
} = {}) => {
  const explicitId = sanitizeDocId(ruleId);
  if (explicitId) return explicitId;

  const fallbackLabel = toCleanString(label) || 'corte';
  const normalizedFrequency = CUT_RULE_FREQUENCIES.has(frequency)
    ? frequency
    : 'monthly';
  if (normalizedFrequency !== 'monthly') {
    return sanitizeDocId(`cut_${normalizedFrequency}_${fallbackLabel}`);
  }

  return sanitizeDocId(
    `cut_${normalizedFrequency}_${String(startDay).padStart(2, '0')}_${String(
      endDay,
    ).padStart(2, '0')}_${fallbackLabel}`,
  );
};

export const normalizeHrCommissionCutRule = (
  ruleLike,
  { businessId = null, ruleId = null } = {},
) => {
  const rule = asRecord(ruleLike);
  const label = toCleanString(rule.label);
  const startDay = toIntegerInRange(rule.startDay, {
    fallback: 1,
    min: 1,
    max: 31,
  });
  const endDay = toIntegerInRange(rule.endDay, {
    fallback: 31,
    min: 1,
    max: 31,
  });
  const requestedFrequency = toCleanString(rule.frequency)?.toLowerCase();
  const frequency = normalizeCutRuleFrequency({
    endDay,
    frequency: requestedFrequency,
    startDay,
  });
  const defaultDays = getCutRuleDayDefaults(frequency);
  const resolvedStartDay = defaultDays.startDay;
  const resolvedEndDay = defaultDays.endDay;

  if (!label) {
    return { ok: false, error: 'La regla requiere un nombre.' };
  }
  if (requestedFrequency && !CUT_RULE_FREQUENCIES.has(requestedFrequency)) {
    return { ok: false, error: 'La frecuencia del corte no es valida.' };
  }
  if (!startDay || !endDay) {
    return { ok: false, error: 'Los dias del corte deben estar entre 1 y 31.' };
  }
  if (startDay > endDay) {
    return {
      ok: false,
      error: 'El dia inicial del corte no puede ser mayor que el dia final.',
    };
  }

  const resolvedRuleId = resolveHrCommissionCutRuleId({
    endDay: resolvedEndDay,
    frequency,
    label,
    ruleId: ruleId || rule.ruleId || rule.id,
    startDay: resolvedStartDay,
  });
  if (!resolvedRuleId) {
    return { ok: false, error: 'No se pudo generar la regla de corte.' };
  }

  return {
    ok: true,
    rule: withoutUndefined({
      id: resolvedRuleId,
      businessId: toCleanString(rule.businessId) || toCleanString(businessId),
      label,
      frequency,
      startDay: resolvedStartDay,
      endDay: resolvedEndDay,
      active: rule.active === false ? false : true,
      sortOrder: safeNumber(rule.sortOrder, resolvedStartDay),
    }),
  };
};

export const resolveHrCommissionCutRuleRange = ({
  anchorDate = new Date(),
  rule,
} = {}) => {
  const normalizedRule = normalizeHrCommissionCutRule(rule);
  if (!normalizedRule.ok) return normalizedRule;

  const frequency = normalizedRule.rule.frequency;
  if (frequency === 'weekly') {
    const start = toUtcWeekStart(anchorDate);
    const end = toEndOfDay(addUtcDays(start, 6));

    return {
      ok: true,
      rule: normalizedRule.rule,
      start,
      end,
      startKey: toDateKey(start),
      endKey: toDateKey(end),
    };
  }

  const anchor = toUtcMonthAnchor(anchorDate);
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  const daysInMonth = getUtcDaysInMonth(year, month);

  const startDay =
    frequency === 'biweekly'
      ? toUtcDateAnchor(anchorDate).getUTCDate() <= 15
        ? 1
        : 16
      : 1;
  const endDay = frequency === 'biweekly' && startDay === 1 ? 15 : daysInMonth;
  const start = new Date(Date.UTC(year, month, startDay, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, endDay, 23, 59, 59, 999));

  return {
    ok: true,
    rule: normalizedRule.rule,
    start,
    end,
    startKey: toDateKey(start),
    endKey: toDateKey(end),
  };
};

export const resolveNextHrCommissionCutRuleRange = ({
  periods = [],
  referenceDate = new Date(),
  rule,
} = {}) => {
  const normalizedRule = normalizeHrCommissionCutRule(rule);
  if (!normalizedRule.ok) return normalizedRule;

  const latestEndDate = (Array.isArray(periods) ? periods : [])
    .filter((period) => {
      const periodRuleId = toCleanString(period?.cutRuleId);
      return periodRuleId === normalizedRule.rule.id;
    })
    .map((period) => toDateFromTimestampLike(period?.endDate))
    .filter(Boolean)
    .sort((left, right) => right.getTime() - left.getTime())[0];
  const anchorDate = latestEndDate
    ? addUtcDays(latestEndDate, 1)
    : referenceDate;

  return resolveHrCommissionCutRuleRange({
    anchorDate,
    rule: normalizedRule.rule,
  });
};

export const resolveHrCommissionPeriodId = ({
  endDate,
  periodId = null,
  startDate,
} = {}) => {
  const explicitId = sanitizeDocId(periodId);
  if (explicitId) return explicitId;

  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);
  if (!startKey || !endKey) return null;

  return sanitizeDocId(`commission_${startKey}_${endKey}`);
};

export const normalizeHrCommissionPeriodDateRange = ({
  endDate,
  startDate,
} = {}) => {
  const start = parseBoundaryDate(startDate);
  const end = parseBoundaryDate(endDate, { endOfDay: true });

  if (!start || !end) {
    return {
      ok: false,
      error: 'El corte requiere fecha inicial y fecha final validas.',
    };
  }
  if (start.getTime() > end.getTime()) {
    return {
      ok: false,
      error: 'La fecha inicial no puede ser mayor que la fecha final.',
    };
  }

  return {
    ok: true,
    start,
    end,
    startKey: toDateKey(start),
    endKey: toDateKey(end),
  };
};

const normalizeCommissionEntry = (entryLike) => {
  const entry = asRecord(entryLike);
  const id = toCleanString(entry.id);
  const employeeId = toCleanString(entry.employeeId);
  const status = toCleanString(entry.status)?.toLowerCase() || 'calculated';

  return withoutUndefined({
    ...entry,
    id,
    employeeId,
    employeeCode: toCleanString(entry.employeeCode),
    employeeNameSnapshot: toCleanString(entry.employeeNameSnapshot),
    partyId: toCleanString(entry.partyId),
    currency: toCleanString(entry.currency)?.toUpperCase() || 'DOP',
    commissionAmount: roundMoney(entry.commissionAmount),
    status,
    date: entry.date ?? null,
    periodId: toCleanString(entry.periodId),
    payrollRunId: toCleanString(entry.payrollRunId),
  });
};

export const isHrCommissionEntryEligibleForCut = (
  entryLike,
  { endDate = null, startDate = null } = {},
) => {
  const entry = normalizeCommissionEntry(entryLike);
  if (!entry.id || !entry.employeeId) return false;
  if (!ELIGIBLE_ENTRY_STATUSES.has(entry.status)) return false;
  if (entry.periodId || entry.payrollRunId) return false;
  if (entry.commissionAmount <= 0) return false;

  const entryMs = toMillis(entry.date);
  const startMs = startDate ? startDate.getTime() : null;
  const endMs = endDate ? endDate.getTime() : null;
  if (entryMs != null && startMs != null && entryMs < startMs) return false;
  if (entryMs != null && endMs != null && entryMs > endMs) return false;
  return true;
};

export const groupHrCommissionEntriesByEmployee = (entries = []) => {
  const groups = new Map();

  (Array.isArray(entries) ? entries : [])
    .map(normalizeCommissionEntry)
    .filter((entry) => entry.id && entry.employeeId)
    .forEach((entry) => {
      const employeeId = entry.employeeId;
      const current = groups.get(employeeId) || {
        employeeId,
        employeeCode: entry.employeeCode || null,
        employeeNameSnapshot: entry.employeeNameSnapshot || null,
        partyId: entry.partyId || null,
        currency: entry.currency || 'DOP',
        entries: [],
        totalCommissionAmount: 0,
      };

      current.employeeCode = current.employeeCode || entry.employeeCode || null;
      current.employeeNameSnapshot =
        current.employeeNameSnapshot || entry.employeeNameSnapshot || null;
      current.partyId = current.partyId || entry.partyId || null;
      current.entries.push(entry);
      current.totalCommissionAmount = roundMoney(
        current.totalCommissionAmount + entry.commissionAmount,
      );
      groups.set(employeeId, current);
    });

  return Array.from(groups.values()).sort((left, right) =>
    (
      left.employeeNameSnapshot ||
      left.employeeCode ||
      left.employeeId
    ).localeCompare(
      right.employeeNameSnapshot || right.employeeCode || right.employeeId,
    ),
  );
};

export const buildHrCommissionCutDocuments = ({
  businessId,
  cutRule = null,
  employees = [],
  entries = [],
  endDate,
  periodId = null,
  startDate,
  timestamp = FieldValue.serverTimestamp(),
  userId = null,
} = {}) => {
  const range = normalizeHrCommissionPeriodDateRange({ endDate, startDate });
  if (!range.ok) {
    return { ok: false, error: range.error };
  }

  const resolvedPeriodId = resolveHrCommissionPeriodId({
    endDate: range.end,
    periodId,
    startDate: range.start,
  });
  if (!businessId || !resolvedPeriodId) {
    return {
      ok: false,
      error: 'No se pudo generar el identificador del corte.',
    };
  }

  const eligibleEntries = (Array.isArray(entries) ? entries : [])
    .filter((entry) =>
      isHrCommissionEntryEligibleForCut(entry, {
        endDate: range.end,
        startDate: range.start,
      }),
    )
    .map(normalizeCommissionEntry);
  const employeesById = new Map(
    (Array.isArray(employees) ? employees : [])
      .map((employee) => {
        const employeeRecord = asRecord(employee);
        const employeeId =
          toCleanString(employeeRecord.employeeId) ||
          toCleanString(employeeRecord.id);
        return employeeId ? [employeeId, employeeRecord] : null;
      })
      .filter(Boolean),
  );
  const salaryEmployeeGroups = Array.from(employeesById.values())
    .filter((employee) => {
      const payType = toCleanString(employee.payType);
      const status = toCleanString(employee.status)?.toLowerCase() || 'active';
      return (
        ['salary', 'mixed'].includes(payType) &&
        roundMoney(employee.baseSalaryAmount) > 0 &&
        status === 'active'
      );
    })
    .map((employee) => {
      const employeeId =
        toCleanString(employee.employeeId) || toCleanString(employee.id);
      return {
        employeeId,
        employeeCode: toCleanString(employee.code),
        employeeNameSnapshot:
          toCleanString(employee.fullName) ||
          toCleanString(employee.displayName) ||
          toCleanString(employee.legalName),
        partyId: toCleanString(employee.partyId),
        currency: toCleanString(employee.currency)?.toUpperCase() || 'DOP',
        entries: [],
        totalCommissionAmount: 0,
      };
    })
    .filter((employee) => employee.employeeId);
  if (!eligibleEntries.length && !salaryEmployeeGroups.length) {
    return {
      ok: false,
      error: 'No hay comisiones ni empleados con salario base para este rango.',
    };
  }

  const commissionGroups = groupHrCommissionEntriesByEmployee(eligibleEntries);
  const groupsByEmployee = new Map(
    commissionGroups.map((group) => [group.employeeId, group]),
  );
  salaryEmployeeGroups.forEach((group) => {
    if (!groupsByEmployee.has(group.employeeId)) {
      groupsByEmployee.set(group.employeeId, group);
    }
  });

  const groups = Array.from(groupsByEmployee.values()).sort((left, right) =>
    (
      left.employeeNameSnapshot ||
      left.employeeCode ||
      left.employeeId
    ).localeCompare(
      right.employeeNameSnapshot || right.employeeCode || right.employeeId,
    ),
  );
  const currency = groups[0]?.currency || 'DOP';
  const payrollRunId = `run_${resolvedPeriodId}`;
  const totalCommissionAmount = roundMoney(
    groups.reduce((sum, group) => sum + group.totalCommissionAmount, 0),
  );
  const startTimestamp = Timestamp.fromDate(range.start);
  const endTimestamp = Timestamp.fromDate(range.end);
  const periodKey = `${range.startKey}_${range.endKey}`;
  const normalizedCutRule = cutRule
    ? normalizeHrCommissionCutRule(cutRule, { businessId })
    : null;
  const cutRuleSnapshot = normalizedCutRule?.ok
    ? {
        id: normalizedCutRule.rule.id,
        label: normalizedCutRule.rule.label,
        frequency: normalizedCutRule.rule.frequency,
        startDay: normalizedCutRule.rule.startDay,
        endDay: normalizedCutRule.rule.endDay,
      }
    : null;

  const employeeLines = groups.map((group) => {
    const lineId = sanitizeDocId(`${resolvedPeriodId}_${group.employeeId}`);
    const employee = employeesById.get(group.employeeId) || {};
    const employeePayType = toCleanString(employee.payType);
    const baseSalaryAmount = ['salary', 'mixed'].includes(employeePayType)
      ? roundMoney(employee.baseSalaryAmount)
      : 0;
    const commissionAmount = group.totalCommissionAmount;
    const grossAmount = roundMoney(baseSalaryAmount + commissionAmount);
    const deductions = calculateSalaryDeductions({
      baseSalaryAmount,
      grossAmount,
      salaryDeductions: employee.salaryDeductions,
    });
    return {
      id: lineId,
      businessId,
      periodId: resolvedPeriodId,
      payrollRunId,
      employeeId: group.employeeId,
      employeeCode: group.employeeCode,
      employeeNameSnapshot: group.employeeNameSnapshot,
      partyId: group.partyId,
      type:
        baseSalaryAmount > 0 && commissionAmount > 0
          ? 'mixed'
          : baseSalaryAmount > 0
            ? 'salary'
            : 'commission',
      status: 'draft',
      currency: group.currency || currency,
      baseSalaryAmount,
      grossAmount,
      deductionsAmount: deductions.deductionsAmount,
      netAmount: deductions.netAmount,
      commissionAmount,
      deductionLines: deductions.deductionLines,
      commissionEntryIds: group.entries.map((entry) => entry.id),
      entriesCount: group.entries.length,
      manualAdjustmentAmount: 0,
      manualAdjustmentComment: null,
      manualAdjustmentHistory: [],
      createdAt: timestamp,
      createdBy: userId,
      updatedAt: timestamp,
      updatedBy: userId,
    };
  });
  const grossAmount = roundMoney(
    employeeLines.reduce((sum, line) => sum + line.grossAmount, 0),
  );
  const deductionsAmount = roundMoney(
    employeeLines.reduce((sum, line) => sum + line.deductionsAmount, 0),
  );
  const netAmount = roundMoney(
    employeeLines.reduce((sum, line) => sum + line.netAmount, 0),
  );

  const entryPatches = employeeLines.flatMap((line) =>
    line.commissionEntryIds.map((entryId) => ({
      entryId,
      patch: {
        status: 'included_in_cut',
        periodId: resolvedPeriodId,
        payrollRunId,
        payrollEmployeeLineId: line.id,
        updatedAt: timestamp,
        updatedBy: userId,
      },
    })),
  );

  const period = {
    id: resolvedPeriodId,
    businessId,
    type: 'commission',
    periodKey,
    label: cutRuleSnapshot
      ? `${cutRuleSnapshot.label} ${range.startKey} - ${range.endKey}`
      : `Comisiones ${range.startKey} - ${range.endKey}`,
    status: 'draft',
    startDate: startTimestamp,
    endDate: endTimestamp,
    cutRuleId: cutRuleSnapshot?.id ?? null,
    cutRuleLabel: cutRuleSnapshot?.label ?? null,
    cutRuleSnapshot,
    currency,
    entriesCount: eligibleEntries.length,
    employeesCount: groups.length,
    totalCommissionAmount,
    grossAmount,
    deductionsAmount,
    netAmount,
    totalPayableAmount: netAmount,
    manualAdjustmentAmount: 0,
    adjustmentsCount: 0,
    lastAdjustmentComment: null,
    payrollRunId,
    accountingEventId: null,
    createdAt: timestamp,
    createdBy: userId,
    updatedAt: timestamp,
    updatedBy: userId,
  };

  const payrollRun = {
    id: payrollRunId,
    businessId,
    type: 'commission',
    sourcePeriodId: resolvedPeriodId,
    status: 'draft',
    periodKey,
    startDate: startTimestamp,
    endDate: endTimestamp,
    cutRuleId: cutRuleSnapshot?.id ?? null,
    cutRuleLabel: cutRuleSnapshot?.label ?? null,
    cutRuleSnapshot,
    currency,
    employeeCount: groups.length,
    lineCount: employeeLines.length,
    grossAmount,
    deductionsAmount,
    netAmount,
    totalPayableAmount: netAmount,
    manualAdjustmentAmount: 0,
    adjustmentsCount: 0,
    lastAdjustmentComment: null,
    accountingEventId: null,
    createdAt: timestamp,
    createdBy: userId,
    updatedAt: timestamp,
    updatedBy: userId,
  };

  return {
    ok: true,
    period,
    payrollRun,
    employeeLines,
    entryPatches,
    range,
  };
};

export const buildHrPayrollEmployeeLinePayableAdjustment = ({
  comment,
  employeeLines = [],
  historyTimestamp = null,
  line,
  timestamp = FieldValue.serverTimestamp(),
  totalToPay,
  userId = null,
} = {}) => {
  const lineRecord = asRecord(line);
  const lineId = toCleanString(lineRecord.id);
  const lineStatus = toCleanString(lineRecord.status)?.toLowerCase() || 'draft';
  const requestedNetAmount = toFiniteInputNumber(totalToPay);
  const cleanComment = toCleanString(comment);

  if (!lineId) {
    return { ok: false, error: 'La linea de colaborador es requerida.' };
  }
  if (!LINE_ADJUSTABLE_STATUSES.has(lineStatus)) {
    return {
      ok: false,
      error: 'Solo puedes editar el total antes de aprobar el corte.',
    };
  }
  if (requestedNetAmount == null) {
    return { ok: false, error: 'El total a pagar debe ser un monto valido.' };
  }
  if (!cleanComment || cleanComment.length < ADJUSTMENT_COMMENT_MIN_LENGTH) {
    return {
      ok: false,
      error: 'Agrega un comentario sobre la modificacion del total a pagar.',
    };
  }

  const grossAmount = resolveLineGrossAmount(lineRecord);
  const previousNetAmount = resolveLineNetAmount(lineRecord);
  const previousManualAdjustmentAmount =
    resolveLineManualAdjustmentAmount(lineRecord);
  const previousDeductionsAmount = resolveLineDeductionAmount(lineRecord);
  const baseDeductionsAmount = Math.max(
    0,
    roundMoney(previousDeductionsAmount - previousManualAdjustmentAmount),
  );
  const calculatedPayableAmount =
    resolveLineCalculatedPayableAmount(lineRecord);
  const nextNetAmount = roundMoney(requestedNetAmount);

  if (nextNetAmount < 0) {
    return { ok: false, error: 'El total a pagar no puede ser negativo.' };
  }
  if (nextNetAmount - calculatedPayableAmount > THRESHOLD) {
    return {
      ok: false,
      error: 'El total a pagar no puede exceder el calculo original.',
    };
  }
  if (Math.abs(nextNetAmount - previousNetAmount) <= THRESHOLD) {
    return { ok: false, error: 'El total a pagar no tiene cambios.' };
  }

  const manualAdjustmentAmount = Math.max(
    0,
    roundMoney(calculatedPayableAmount - nextNetAmount),
  );
  const deductionsAmount = roundMoney(
    baseDeductionsAmount + manualAdjustmentAmount,
  );
  const history = normalizeAdjustmentHistory(
    lineRecord.manualAdjustmentHistory,
  ).slice(-(MAX_ADJUSTMENT_HISTORY - 1));
  const historyEntry = withoutUndefined({
    previousNetAmount,
    newNetAmount: nextNetAmount,
    previousDeductionsAmount,
    newDeductionsAmount: deductionsAmount,
    previousManualAdjustmentAmount,
    newManualAdjustmentAmount: manualAdjustmentAmount,
    deltaAmount: roundMoney(nextNetAmount - previousNetAmount),
    comment: cleanComment,
    createdAt: historyTimestamp ?? timestamp,
    createdBy: userId,
  });
  const nextHistory = [...history, historyEntry];
  const linePatch = {
    deductionsAmount,
    manualAdjustmentAmount,
    manualAdjustmentComment: cleanComment,
    manualAdjustmentHistory: nextHistory,
    netAmount: nextNetAmount,
    totalPayableAmount: nextNetAmount,
    updatedAt: timestamp,
    updatedBy: userId,
  };
  const effectiveLines = (Array.isArray(employeeLines) ? employeeLines : [])
    .map((entry) => asRecord(entry))
    .map((entry) =>
      toCleanString(entry.id) === lineId ? { ...entry, ...linePatch } : entry,
    );
  const hasCurrentLine = effectiveLines.some(
    (entry) => toCleanString(entry.id) === lineId,
  );
  if (!hasCurrentLine) {
    effectiveLines.push({ ...lineRecord, ...linePatch });
  }

  const grossTotal = roundMoney(
    effectiveLines.reduce(
      (sum, entry) => sum + resolveLineGrossAmount(entry),
      0,
    ),
  );
  const deductionsTotal = roundMoney(
    effectiveLines.reduce(
      (sum, entry) => sum + resolveLineDeductionAmount(entry),
      0,
    ),
  );
  const netTotal = roundMoney(
    effectiveLines.reduce((sum, entry) => sum + resolveLineNetAmount(entry), 0),
  );
  const adjustmentsCount = effectiveLines.reduce(
    (sum, entry) =>
      sum + normalizeAdjustmentHistory(entry.manualAdjustmentHistory).length,
    0,
  );
  const manualAdjustmentTotal = roundMoney(
    effectiveLines.reduce(
      (sum, entry) => sum + resolveLineManualAdjustmentAmount(entry),
      0,
    ),
  );
  const aggregatePatch = {
    grossAmount: grossTotal,
    deductionsAmount: deductionsTotal,
    manualAdjustmentAmount: manualAdjustmentTotal,
    netAmount: netTotal,
    totalPayableAmount: netTotal,
    adjustmentsCount,
    lastAdjustmentComment: cleanComment,
    lastAdjustmentAt: timestamp,
    lastAdjustmentBy: userId,
    updatedAt: timestamp,
    updatedBy: userId,
  };

  return {
    ok: true,
    aggregatePatch,
    deductionsAmount,
    grossAmount,
    linePatch,
    netAmount: nextNetAmount,
    previousNetAmount,
  };
};

const summarizePayrollDeductionLines = (employeeLines = []) => {
  const summary = (Array.isArray(employeeLines) ? employeeLines : []).reduce(
    (accumulator, line) => {
      const deductionLines = Array.isArray(line?.deductionLines)
        ? line.deductionLines
        : [];

      deductionLines.forEach((entry) => {
        const deduction = asRecord(entry);
        if (deduction.payableObligation === false) {
          return;
        }

        const amount = roundMoney(
          deduction.calculatedAmount ?? deduction.amount,
        );
        if (amount <= THRESHOLD) {
          return;
        }

        const accountSystemKey = toCleanString(deduction.accountSystemKey);
        const kind = toCleanString(deduction.kind);
        if (accountSystemKey === 'tax_payable' || kind === 'salary_itbis') {
          accumulator.taxAmount = roundMoney(accumulator.taxAmount + amount);
          return;
        }

        accumulator.otherPayableAmount = roundMoney(
          accumulator.otherPayableAmount + amount,
        );
      });

      return accumulator;
    },
    {
      taxAmount: 0,
      otherPayableAmount: 0,
    },
  );

  return {
    ...summary,
    totalPayableDeductionsAmount: roundMoney(
      summary.taxAmount + summary.otherPayableAmount,
    ),
  };
};

export const buildHrCommissionAccrualAccountingEvent = ({
  businessId,
  employeeLines = [],
  period,
  timestamp = FieldValue.serverTimestamp(),
  userId = null,
} = {}) => {
  const periodRecord = asRecord(period);
  const periodId = toCleanString(periodRecord.id);
  const normalizedEmployeeLines = (
    Array.isArray(employeeLines) ? employeeLines : []
  ).map((line) => asRecord(line));
  const employeeLineGrossTotal = roundMoney(
    normalizedEmployeeLines.reduce(
      (sum, line) => sum + resolveLineGrossAmount(line),
      0,
    ),
  );
  const employeeLineManualAdjustmentTotal = roundMoney(
    normalizedEmployeeLines.reduce(
      (sum, line) => sum + resolveLineManualAdjustmentAmount(line),
      0,
    ),
  );
  const employeeLineAccrualTotal = Math.max(
    0,
    roundMoney(employeeLineGrossTotal - employeeLineManualAdjustmentTotal),
  );
  const employeeLineNetTotal = roundMoney(
    normalizedEmployeeLines.reduce(
      (sum, line) => sum + resolveLineNetAmount(line),
      0,
    ),
  );
  const payrollDeductionSummary = summarizePayrollDeductionLines(
    normalizedEmployeeLines,
  );
  const fallbackGrossAmount = roundMoney(
    periodRecord.grossAmount ?? periodRecord.totalCommissionAmount,
  );
  const fallbackManualAdjustmentAmount = roundMoney(
    periodRecord.manualAdjustmentAmount,
  );
  const totalAmount =
    employeeLineAccrualTotal > THRESHOLD
      ? employeeLineAccrualTotal
      : Math.max(
          0,
          roundMoney(fallbackGrossAmount - fallbackManualAdjustmentAmount),
        );
  if (!businessId || !periodId || totalAmount <= 0) return null;

  return buildAccountingEvent({
    businessId,
    eventType: 'hr_commission.accrued',
    eventVersion: 1,
    status: 'recorded',
    occurredAt: periodRecord.endDate ?? timestamp,
    recordedAt: timestamp,
    sourceType: 'hrCommissionPeriod',
    sourceId: periodId,
    sourceDocumentType: 'hrCommissionPeriod',
    sourceDocumentId: periodId,
    currency: toCleanString(periodRecord.currency) || 'DOP',
    functionalCurrency: toCleanString(periodRecord.currency) || 'DOP',
    monetary: {
      amount: totalAmount,
      functionalAmount: totalAmount,
      taxAmount: 0,
      functionalTaxAmount: 0,
    },
    payload: {
      documentNature: 'expense',
      settlementTiming: 'deferred',
      periodKey: toCleanString(periodRecord.periodKey),
      startDate: periodRecord.startDate ?? null,
      endDate: periodRecord.endDate ?? null,
      grossAmount:
        employeeLineGrossTotal > THRESHOLD
          ? employeeLineGrossTotal
          : fallbackGrossAmount,
      deductionsAmount: roundMoney(periodRecord.deductionsAmount),
      manualAdjustmentAmount:
        employeeLineManualAdjustmentTotal > THRESHOLD
          ? employeeLineManualAdjustmentTotal
          : fallbackManualAdjustmentAmount,
      netAmount:
        employeeLineNetTotal > THRESHOLD
          ? employeeLineNetTotal
          : roundMoney(
              periodRecord.netAmount ?? periodRecord.totalPayableAmount,
            ),
      payrollDeductionSummary,
      employeesCount: safeNumber(periodRecord.employeesCount),
      entriesCount: safeNumber(periodRecord.entriesCount),
      employeeLines: normalizedEmployeeLines.map((line) => ({
        id: toCleanString(line.id),
        employeeId: toCleanString(line.employeeId),
        employeeCode: toCleanString(line.employeeCode),
        employeeNameSnapshot: toCleanString(line.employeeNameSnapshot),
        baseSalaryAmount: roundMoney(line.baseSalaryAmount),
        commissionAmount: roundMoney(line.commissionAmount),
        grossAmount: resolveLineGrossAmount(line),
        deductionsAmount: resolveLineDeductionAmount(line),
        manualAdjustmentAmount: resolveLineManualAdjustmentAmount(line),
        netAmount: resolveLineNetAmount(line),
        amount: Math.max(
          0,
          roundMoney(
            resolveLineGrossAmount(line) -
              resolveLineManualAdjustmentAmount(line),
          ),
        ),
        deductionLines: Array.isArray(line.deductionLines)
          ? line.deductionLines
          : [],
        adjustmentComment: toCleanString(line.manualAdjustmentComment),
      })),
    },
    dedupeKey: `${businessId}:hr_commission.accrued:${periodId}:1`,
    projectionStatus: 'pending',
    createdAt: timestamp,
    createdBy: userId,
    metadata: {
      moduleKey: 'payroll',
      generatedBy: 'hrPayroll.manageHrCommissionPeriod',
    },
  });
};

export const fetchHrCommissionPeriod = async ({ businessId, periodId }) => {
  const normalizedBusinessId = toCleanString(businessId);
  const normalizedPeriodId = toCleanString(periodId);
  if (!normalizedBusinessId || !normalizedPeriodId) return null;

  const snap = await db
    .doc(
      `businesses/${normalizedBusinessId}/hrCommissionPeriods/${normalizedPeriodId}`,
    )
    .get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
};
