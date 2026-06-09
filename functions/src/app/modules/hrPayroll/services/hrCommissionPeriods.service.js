import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import { calculateSalaryDeductions } from './hrSalaryDeductions.service.js';

const ELIGIBLE_ENTRY_STATUSES = new Set(['calculated', 'eligible']);
const RETROACTIVE_RESOLUTION_STATUSES = new Set([
  'selected_for_next_cut',
  'included_in_cut',
  'paid',
  'cancelled',
]);
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
export const HR_COMMISSION_BUSINESS_TIME_ZONE = 'America/Santo_Domingo';
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

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

const sumMoney = (values = []) =>
  roundMoney(
    (Array.isArray(values) ? values : []).reduce(
      (sum, value) => sum + roundMoney(value),
      0,
    ),
  );

const toFiniteInputNumber = (value) => {
  if (typeof value === 'string' && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeDocId = (value) =>
  toCleanString(value)?.replace(/[^a-zA-Z0-9_-]/g, '_') || null;

const cleanDateKey = (value) => {
  const text = toCleanString(value);
  return text && DATE_KEY_PATTERN.test(text) ? text : null;
};

const parseDateKey = (value) => {
  const dateKey = cleanDateKey(value);
  if (!dateKey) return null;
  const [, year, month, day] = DATE_KEY_PATTERN.exec(dateKey);
  return {
    day: Number(day),
    month: Number(month),
    year: Number(year),
  };
};

const toDateKeyFromParts = ({ day, month, year }) =>
  `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(
    day,
  ).padStart(2, '0')}`;

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

const getBusinessTimeZone = (value) =>
  toCleanString(value) || HR_COMMISSION_BUSINESS_TIME_ZONE;

const getBusinessDateParts = (
  date,
  timeZone = HR_COMMISSION_BUSINESS_TIME_ZONE,
) => {
  const value = date instanceof Date ? date : toDateFromTimestampLike(date);
  if (!value) return null;

  const parts = new Intl.DateTimeFormat('en-US', {
    calendar: 'gregory',
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(value);
  const readPart = (type) =>
    Number(parts.find((part) => part.type === type)?.value);
  const year = readPart('year');
  const month = readPart('month');
  const day = readPart('day');

  return year && month && day ? { day, month, year } : null;
};

const toBusinessDateKey = (
  date,
  timeZone = HR_COMMISSION_BUSINESS_TIME_ZONE,
) => {
  const parts = getBusinessDateParts(date, timeZone);
  return parts ? toDateKeyFromParts(parts) : null;
};

const getTimeZoneOffsetMs = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    calendar: 'gregory',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date);
  const readPart = (type) =>
    Number(parts.find((part) => part.type === type)?.value);
  const year = readPart('year');
  const month = readPart('month');
  const day = readPart('day');
  const hour = readPart('hour') % 24;
  const minute = readPart('minute');
  const second = readPart('second');

  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  return asUtc - (date.getTime() - date.getUTCMilliseconds());
};

const fromBusinessDateParts = (
  { day, hour = 0, millisecond = 0, minute = 0, month, second = 0, year },
  timeZone = HR_COMMISSION_BUSINESS_TIME_ZONE,
) => {
  const utcGuess = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond,
  );
  const firstOffset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  const firstResult = new Date(utcGuess - firstOffset);
  const secondOffset = getTimeZoneOffsetMs(firstResult, timeZone);

  return firstOffset === secondOffset
    ? firstResult
    : new Date(utcGuess - secondOffset);
};

export const businessDateKeyToDate = (
  dateKey,
  { endOfDay = false, timeZone = HR_COMMISSION_BUSINESS_TIME_ZONE } = {},
) => {
  const parts = parseDateKey(dateKey);
  if (!parts) return null;

  return fromBusinessDateParts(
    {
      ...parts,
      hour: endOfDay ? 23 : 0,
      minute: endOfDay ? 59 : 0,
      second: endOfDay ? 59 : 0,
      millisecond: endOfDay ? 999 : 0,
    },
    timeZone,
  );
};

const addDateKeyDays = (dateKey, days) => {
  const parts = parseDateKey(dateKey);
  if (!parts) return null;
  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0, 0),
  );
  return toDateKeyFromParts({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
};

const getDateKeyDaysInMonth = (year, month) =>
  new Date(Date.UTC(year, month, 0, 12, 0, 0, 0)).getUTCDate();

const getDateKeyWeekStart = (dateKey) => {
  const parts = parseDateKey(dateKey);
  if (!parts) return null;
  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0),
  );
  const dayOfWeek = date.getUTCDay() || 7;
  return addDateKeyDays(dateKey, 1 - dayOfWeek);
};

const extractDateKeysFromText = (value) =>
  toCleanString(value)?.match(/\d{4}-\d{2}-\d{2}/g) ?? [];

export const resolveHrCommissionPeriodBusinessDateKeys = (
  periodLike,
  { timeZone = HR_COMMISSION_BUSINESS_TIME_ZONE } = {},
) => {
  const period = asRecord(periodLike);
  const textDateKeys = [
    ...extractDateKeysFromText(period.periodKey),
    ...extractDateKeysFromText(period.label),
    ...extractDateKeysFromText(period.id),
  ];
  const startDateKey =
    cleanDateKey(period.startDateKey) ||
    textDateKeys[0] ||
    toBusinessDateKey(period.startDate, timeZone) ||
    toDateKey(period.startDate);
  const endDateKey =
    cleanDateKey(period.endDateKey) ||
    textDateKeys[1] ||
    toBusinessDateKey(period.endDate, timeZone) ||
    toDateKey(period.endDate);

  return {
    businessTimeZone: getBusinessTimeZone(period.businessTimeZone || timeZone),
    endDateKey: cleanDateKey(endDateKey),
    startDateKey: cleanDateKey(startDateKey),
  };
};

const resolveHrCommissionPeriodBusinessRange = (
  periodLike,
  { timeZone = HR_COMMISSION_BUSINESS_TIME_ZONE } = {},
) => {
  const keys = resolveHrCommissionPeriodBusinessDateKeys(periodLike, {
    timeZone,
  });
  if (!keys.startDateKey || !keys.endDateKey) return null;
  const rangeTimeZone = getBusinessTimeZone(keys.businessTimeZone);
  const start = businessDateKeyToDate(keys.startDateKey, {
    timeZone: rangeTimeZone,
  });
  const end = businessDateKeyToDate(keys.endDateKey, {
    endOfDay: true,
    timeZone: rangeTimeZone,
  });
  if (!start || !end) return null;

  return {
    ...keys,
    businessTimeZone: rangeTimeZone,
    end,
    start,
  };
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
    return { ok: false, error: 'Los días del corte deben estar entre 1 y 31.' };
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
      businessTimeZone: getBusinessTimeZone(rule.businessTimeZone),
      active: rule.active === false ? false : true,
      sortOrder: safeNumber(rule.sortOrder, resolvedStartDay),
    }),
  };
};

export const resolveHrCommissionCutRuleRange = ({
  anchorDate = new Date(),
  rule,
  timeZone = HR_COMMISSION_BUSINESS_TIME_ZONE,
} = {}) => {
  const normalizedRule = normalizeHrCommissionCutRule(rule);
  if (!normalizedRule.ok) return normalizedRule;

  const businessTimeZone = getBusinessTimeZone(
    normalizedRule.rule.businessTimeZone || timeZone,
  );
  const anchorKey =
    cleanDateKey(anchorDate) ||
    toBusinessDateKey(anchorDate, businessTimeZone) ||
    toDateKey(anchorDate);
  const frequency = normalizedRule.rule.frequency;
  if (frequency === 'weekly') {
    const startKey = getDateKeyWeekStart(anchorKey);
    const endKey = addDateKeyDays(startKey, 6);
    const start = businessDateKeyToDate(startKey, {
      timeZone: businessTimeZone,
    });
    const end = businessDateKeyToDate(endKey, {
      endOfDay: true,
      timeZone: businessTimeZone,
    });

    return {
      ok: true,
      businessTimeZone,
      rule: normalizedRule.rule,
      start,
      end,
      startKey,
      endKey,
    };
  }

  const anchorParts = parseDateKey(anchorKey);
  if (!anchorParts) {
    return { ok: false, error: 'No se pudo calcular la fecha del corte.' };
  }
  const { year, month, day } = anchorParts;
  const daysInMonth = getDateKeyDaysInMonth(year, month);

  const startDay = frequency === 'biweekly' ? (day <= 15 ? 1 : 16) : 1;
  const endDay = frequency === 'biweekly' && startDay === 1 ? 15 : daysInMonth;
  const startKey = toDateKeyFromParts({ year, month, day: startDay });
  const endKey = toDateKeyFromParts({ year, month, day: endDay });
  const start = businessDateKeyToDate(startKey, {
    timeZone: businessTimeZone,
  });
  const end = businessDateKeyToDate(endKey, {
    endOfDay: true,
    timeZone: businessTimeZone,
  });

  return {
    ok: true,
    businessTimeZone,
    rule: normalizedRule.rule,
    start,
    end,
    startKey,
    endKey,
  };
};

export const resolveNextHrCommissionCutRuleRange = ({
  periods = [],
  referenceDate = new Date(),
  rule,
  timeZone = HR_COMMISSION_BUSINESS_TIME_ZONE,
} = {}) => {
  const normalizedRule = normalizeHrCommissionCutRule(rule);
  if (!normalizedRule.ok) return normalizedRule;
  const businessTimeZone = getBusinessTimeZone(
    normalizedRule.rule.businessTimeZone || timeZone,
  );

  const latestEndDateKey = (Array.isArray(periods) ? periods : [])
    .filter((period) => {
      const periodRuleId = toCleanString(period?.cutRuleId);
      return periodRuleId === normalizedRule.rule.id;
    })
    .map(
      (period) =>
        resolveHrCommissionPeriodBusinessDateKeys(period, {
          timeZone: businessTimeZone,
        }).endDateKey,
    )
    .filter(Boolean)
    .sort((left, right) => right.localeCompare(left))[0];
  const anchorDate = latestEndDateKey
    ? addDateKeyDays(latestEndDateKey, 1)
    : referenceDate;

  return resolveHrCommissionCutRuleRange({
    anchorDate,
    rule: normalizedRule.rule,
    timeZone: businessTimeZone,
  });
};

export const resolveHrCommissionPeriodId = ({
  endDate,
  endDateKey = null,
  periodId = null,
  startDate,
  startDateKey = null,
} = {}) => {
  const explicitId = sanitizeDocId(periodId);
  if (explicitId) return explicitId;

  const startKey = cleanDateKey(startDateKey) || toDateKey(startDate);
  const endKey = cleanDateKey(endDateKey) || toDateKey(endDate);
  if (!startKey || !endKey) return null;

  return sanitizeDocId(`commission_${startKey}_${endKey}`);
};

export const normalizeHrCommissionPeriodDateRange = ({
  businessTimeZone = HR_COMMISSION_BUSINESS_TIME_ZONE,
  endDate,
  endDateKey = null,
  startDate,
  startDateKey = null,
} = {}) => {
  const resolvedTimeZone = getBusinessTimeZone(businessTimeZone);
  const resolvedStartKey = cleanDateKey(startDateKey);
  const resolvedEndKey = cleanDateKey(endDateKey);
  const start = resolvedStartKey
    ? businessDateKeyToDate(resolvedStartKey, { timeZone: resolvedTimeZone })
    : parseBoundaryDate(startDate);
  const end = resolvedEndKey
    ? businessDateKeyToDate(resolvedEndKey, {
        endOfDay: true,
        timeZone: resolvedTimeZone,
      })
    : parseBoundaryDate(endDate, { endOfDay: true });

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
    businessTimeZone: resolvedTimeZone,
    start,
    end,
    startKey: resolvedStartKey || toDateKey(start),
    endKey: resolvedEndKey || toDateKey(end),
  };
};

const normalizeCommissionEntry = (entryLike) => {
  const entry = asRecord(entryLike);
  const id = toCleanString(entry.id);
  const employeeId = toCleanString(entry.employeeId);
  const status = toCleanString(entry.status)?.toLowerCase() || 'calculated';
  const retroactiveResolutionStatus = toCleanString(
    entry.retroactiveResolutionStatus,
  )?.toLowerCase();

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
    payrollEmployeeLineId: toCleanString(entry.payrollEmployeeLineId),
    employeePaymentId: toCleanString(entry.employeePaymentId),
    accountingEventId: toCleanString(entry.accountingEventId),
    journalEntryId: toCleanString(entry.journalEntryId),
    isRetroactive: entry.isRetroactive === true,
    retroactiveResolutionStatus: RETROACTIVE_RESOLUTION_STATUSES.has(
      retroactiveResolutionStatus,
    )
      ? retroactiveResolutionStatus
      : null,
    originalPeriodId: toCleanString(entry.originalPeriodId),
    originalPeriodLabel: toCleanString(entry.originalPeriodLabel),
    originalStartDateKey: cleanDateKey(entry.originalStartDateKey),
    originalEndDateKey: cleanDateKey(entry.originalEndDateKey),
    originalPeriodStatus: toCleanString(entry.originalPeriodStatus),
    retroactiveTargetPeriodId: toCleanString(entry.retroactiveTargetPeriodId),
    retroactiveTargetStartDateKey: cleanDateKey(
      entry.retroactiveTargetStartDateKey,
    ),
    retroactiveTargetEndDateKey: cleanDateKey(
      entry.retroactiveTargetEndDateKey,
    ),
    retroactiveTargetRuleId: toCleanString(entry.retroactiveTargetRuleId),
    retroactiveTargetPayrollRunId: toCleanString(
      entry.retroactiveTargetPayrollRunId,
    ),
    retroactiveTargetLineId: toCleanString(entry.retroactiveTargetLineId),
    retroactiveResolvedAt: entry.retroactiveResolvedAt ?? null,
    retroactiveResolvedBy: toCleanString(entry.retroactiveResolvedBy),
    retroactiveResolutionNote: toCleanString(entry.retroactiveResolutionNote),
    retroactiveResolutionDedupeKey: toCleanString(
      entry.retroactiveResolutionDedupeKey,
    ),
  });
};

export const isHrCommissionEntryEligibleForCut = (
  entryLike,
  { endDate = null, startDate = null } = {},
) => {
  const entry = normalizeCommissionEntry(entryLike);
  if (!entry.id || !entry.employeeId) return false;
  if (!ELIGIBLE_ENTRY_STATUSES.has(entry.status)) return false;
  if (
    entry.periodId ||
    entry.payrollRunId ||
    entry.payrollEmployeeLineId ||
    entry.employeePaymentId ||
    entry.accountingEventId ||
    entry.journalEntryId
  ) {
    return false;
  }
  if (entry.commissionAmount <= 0) return false;

  const entryMs = toMillis(entry.date);
  const startMs = startDate ? startDate.getTime() : null;
  const endMs = endDate ? endDate.getTime() : null;
  if (entryMs != null && startMs != null && entryMs < startMs) return false;
  if (entryMs != null && endMs != null && entryMs > endMs) return false;
  return true;
};

const isDateKeyInsideRange = (dateKey, range) =>
  Boolean(
    cleanDateKey(dateKey) &&
    range?.startDateKey &&
    range?.endDateKey &&
    dateKey >= range.startDateKey &&
    dateKey <= range.endDateKey,
  );

export const detectHrCommissionRetroactiveEntries = ({
  businessTimeZone = HR_COMMISSION_BUSINESS_TIME_ZONE,
  entries = [],
  periods = [],
} = {}) => {
  const ranges = (Array.isArray(periods) ? periods : [])
    .filter((period) => toCleanString(period?.status) !== 'cancelled')
    .map((period) => {
      const range = resolveHrCommissionPeriodBusinessRange(period, {
        timeZone: businessTimeZone,
      });
      if (!range) return null;
      return {
        ...range,
        period: {
          id: toCleanString(period.id),
          label:
            toCleanString(period.label) ||
            toCleanString(period.periodKey) ||
            toCleanString(period.id),
          status: normalizeHrCommissionPeriodStatus(period.status),
        },
      };
    })
    .filter(Boolean);
  if (!ranges.length) {
    return { count: 0, entries: [], ranges: [] };
  }

  const retroactiveEntries = (Array.isArray(entries) ? entries : [])
    .map(normalizeCommissionEntry)
    .map((entry) => {
      const entryDateKey =
        toBusinessDateKey(entry.date, businessTimeZone) ||
        toDateKey(entry.date);
      const range = ranges.find((candidate) =>
        isDateKeyInsideRange(entryDateKey, candidate),
      );
      if (
        !range ||
        !isHrCommissionEntryEligibleForCut(entry, {
          endDate: range.end,
          startDate: range.start,
        })
      ) {
        return null;
      }

      return withoutUndefined({
        ...entry,
        dateKey: entryDateKey,
        isRetroactive: true,
        originalPeriodId: entry.originalPeriodId || range.period.id,
        originalPeriodLabel: entry.originalPeriodLabel || range.period.label,
        originalStartDateKey: entry.originalStartDateKey || range.startDateKey,
        originalEndDateKey: entry.originalEndDateKey || range.endDateKey,
        originalPeriodStatus: entry.originalPeriodStatus || range.period.status,
      });
    })
    .filter(Boolean);

  return {
    count: retroactiveEntries.length,
    entries: retroactiveEntries,
    ranges,
  };
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
  businessTimeZone = HR_COMMISSION_BUSINESS_TIME_ZONE,
  businessId,
  cutRule = null,
  employees = [],
  entries = [],
  endDate,
  endDateKey = null,
  periodId = null,
  retroactiveEntries = [],
  startDate,
  startDateKey = null,
  timestamp = FieldValue.serverTimestamp(),
  userId = null,
} = {}) => {
  const range = normalizeHrCommissionPeriodDateRange({
    businessTimeZone,
    endDate,
    endDateKey,
    startDate,
    startDateKey,
  });
  if (!range.ok) {
    return { ok: false, error: range.error };
  }

  const resolvedPeriodId = resolveHrCommissionPeriodId({
    endDate: range.end,
    endDateKey: range.endKey,
    periodId,
    startDate: range.start,
    startDateKey: range.startKey,
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
  const eligibleRetroactiveEntries = (
    Array.isArray(retroactiveEntries) ? retroactiveEntries : []
  )
    .filter((entry) => isHrCommissionEntryEligibleForCut(entry))
    .map((entry) => ({
      ...normalizeCommissionEntry(entry),
      isRetroactive: true,
    }));
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
  if (
    !eligibleEntries.length &&
    !eligibleRetroactiveEntries.length &&
    !salaryEmployeeGroups.length
  ) {
    return {
      ok: false,
      error: 'No hay comisiones ni empleados con salario base para este rango.',
    };
  }

  const commissionGroups = groupHrCommissionEntriesByEmployee(eligibleEntries);
  const retroactiveGroups = groupHrCommissionEntriesByEmployee(
    eligibleRetroactiveEntries,
  );
  const groupsByEmployee = new Map(
    commissionGroups.map((group) => [
      group.employeeId,
      {
        ...group,
        retroactiveEntries: [],
        retroactiveAdjustmentAmount: 0,
      },
    ]),
  );
  salaryEmployeeGroups.forEach((group) => {
    if (!groupsByEmployee.has(group.employeeId)) {
      groupsByEmployee.set(group.employeeId, {
        ...group,
        retroactiveEntries: [],
        retroactiveAdjustmentAmount: 0,
      });
    }
  });
  retroactiveGroups.forEach((retroactiveGroup) => {
    const current = groupsByEmployee.get(retroactiveGroup.employeeId) || {
      employeeId: retroactiveGroup.employeeId,
      employeeCode: retroactiveGroup.employeeCode,
      employeeNameSnapshot: retroactiveGroup.employeeNameSnapshot,
      partyId: retroactiveGroup.partyId,
      currency: retroactiveGroup.currency || 'DOP',
      entries: [],
      totalCommissionAmount: 0,
      retroactiveEntries: [],
      retroactiveAdjustmentAmount: 0,
    };

    current.employeeCode =
      current.employeeCode || retroactiveGroup.employeeCode || null;
    current.employeeNameSnapshot =
      current.employeeNameSnapshot ||
      retroactiveGroup.employeeNameSnapshot ||
      null;
    current.partyId = current.partyId || retroactiveGroup.partyId || null;
    current.retroactiveEntries = [
      ...(Array.isArray(current.retroactiveEntries)
        ? current.retroactiveEntries
        : []),
      ...(Array.isArray(retroactiveGroup.entries)
        ? retroactiveGroup.entries
        : []),
    ];
    current.retroactiveAdjustmentAmount = roundMoney(
      roundMoney(current.retroactiveAdjustmentAmount) +
        roundMoney(retroactiveGroup.totalCommissionAmount),
    );
    groupsByEmployee.set(retroactiveGroup.employeeId, current);
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
  const totalCommissionAmount = sumMoney(
    groups.map((group) => group.totalCommissionAmount),
  );
  const retroactiveAdjustmentAmount = sumMoney(
    groups.map((group) => group.retroactiveAdjustmentAmount),
  );
  const retroactiveAdjustmentsCount = eligibleRetroactiveEntries.length;
  const retroactiveSourcePeriods = Array.from(
    new Map(
      eligibleRetroactiveEntries
        .map((entry) => {
          const sourcePeriodId = toCleanString(entry.originalPeriodId);
          if (!sourcePeriodId) return null;
          return [
            sourcePeriodId,
            withoutUndefined({
              id: sourcePeriodId,
              label: toCleanString(entry.originalPeriodLabel),
              startDateKey: cleanDateKey(entry.originalStartDateKey),
              endDateKey: cleanDateKey(entry.originalEndDateKey),
              status: normalizeHrCommissionPeriodStatus(
                entry.originalPeriodStatus,
              ),
            }),
          ];
        })
        .filter(Boolean),
    ).values(),
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
        businessTimeZone: normalizedCutRule.rule.businessTimeZone,
      }
    : null;

  const employeeLines = groups.map((group) => {
    const lineId = sanitizeDocId(`${resolvedPeriodId}_${group.employeeId}`);
    const employee = employeesById.get(group.employeeId) || {};
    const employeePayType = toCleanString(employee.payType);
    const baseSalaryAmount = ['salary', 'mixed'].includes(employeePayType)
      ? roundMoney(employee.baseSalaryAmount)
      : 0;
    const commissionAmount = roundMoney(group.totalCommissionAmount);
    const retroactiveAdjustmentAmount = roundMoney(
      group.retroactiveAdjustmentAmount,
    );
    const grossAmount = roundMoney(
      baseSalaryAmount + commissionAmount + retroactiveAdjustmentAmount,
    );
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
      retroactiveEntryIds: (Array.isArray(group.retroactiveEntries)
        ? group.retroactiveEntries
        : []
      ).map((entry) => entry.id),
      entriesCount:
        group.entries.length +
        (Array.isArray(group.retroactiveEntries)
          ? group.retroactiveEntries.length
          : 0),
      retroactiveAdjustmentAmount,
      retroactiveAdjustmentsCount: Array.isArray(group.retroactiveEntries)
        ? group.retroactiveEntries.length
        : 0,
      retroactiveSourcePeriods: Array.from(
        new Map(
          (Array.isArray(group.retroactiveEntries)
            ? group.retroactiveEntries
            : []
          )
            .map((entry) => {
              const sourcePeriodId = toCleanString(entry.originalPeriodId);
              if (!sourcePeriodId) return null;
              return [
                sourcePeriodId,
                withoutUndefined({
                  id: sourcePeriodId,
                  label: toCleanString(entry.originalPeriodLabel),
                  startDateKey: cleanDateKey(entry.originalStartDateKey),
                  endDateKey: cleanDateKey(entry.originalEndDateKey),
                  status: normalizeHrCommissionPeriodStatus(
                    entry.originalPeriodStatus,
                  ),
                }),
              ];
            })
            .filter(Boolean),
        ).values(),
      ),
      hasRetroactiveAdjustments:
        Array.isArray(group.retroactiveEntries) &&
        group.retroactiveEntries.length > 0,
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

  const entryPatches = employeeLines.flatMap((line) => [
    ...line.commissionEntryIds.map((entryId) => ({
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
    ...(Array.isArray(line.retroactiveEntryIds)
      ? line.retroactiveEntryIds
      : []
    ).map((entryId) => ({
      entryId,
      patch: {
        status: 'included_in_cut',
        periodId: resolvedPeriodId,
        payrollRunId,
        payrollEmployeeLineId: line.id,
        isRetroactive: true,
        retroactiveResolutionStatus: 'included_in_cut',
        retroactiveTargetPeriodId: resolvedPeriodId,
        retroactiveTargetStartDateKey: range.startKey,
        retroactiveTargetEndDateKey: range.endKey,
        retroactiveTargetRuleId: cutRuleSnapshot?.id ?? null,
        retroactiveTargetPayrollRunId: payrollRunId,
        retroactiveTargetLineId: line.id,
        updatedAt: timestamp,
        updatedBy: userId,
      },
    })),
  ]);

  const period = {
    id: resolvedPeriodId,
    businessId,
    type: 'commission',
    periodKey,
    startDateKey: range.startKey,
    endDateKey: range.endKey,
    businessTimeZone: range.businessTimeZone,
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
    entriesCount: eligibleEntries.length + eligibleRetroactiveEntries.length,
    normalEntriesCount: eligibleEntries.length,
    employeesCount: groups.length,
    totalCommissionAmount,
    retroactiveAdjustmentAmount,
    retroactiveAdjustmentsCount,
    retroactiveSourcePeriods,
    hasRetroactiveAdjustments: retroactiveAdjustmentsCount > 0,
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
    startDateKey: range.startKey,
    endDateKey: range.endKey,
    businessTimeZone: range.businessTimeZone,
    startDate: startTimestamp,
    endDate: endTimestamp,
    cutRuleId: cutRuleSnapshot?.id ?? null,
    cutRuleLabel: cutRuleSnapshot?.label ?? null,
    cutRuleSnapshot,
    currency,
    employeeCount: groups.length,
    lineCount: employeeLines.length,
    entriesCount: eligibleEntries.length + eligibleRetroactiveEntries.length,
    normalEntriesCount: eligibleEntries.length,
    totalCommissionAmount,
    retroactiveAdjustmentAmount,
    retroactiveAdjustmentsCount,
    retroactiveSourcePeriods,
    hasRetroactiveAdjustments: retroactiveAdjustmentsCount > 0,
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
      error: 'Agrega un comentario sobre la modificación del total a pagar.',
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
      startDateKey: cleanDateKey(periodRecord.startDateKey),
      endDateKey: cleanDateKey(periodRecord.endDateKey),
      businessTimeZone: getBusinessTimeZone(periodRecord.businessTimeZone),
      startDate: periodRecord.startDate ?? null,
      endDate: periodRecord.endDate ?? null,
      grossAmount:
        employeeLineGrossTotal > THRESHOLD
          ? employeeLineGrossTotal
          : fallbackGrossAmount,
      retroactiveAdjustmentAmount: roundMoney(
        periodRecord.retroactiveAdjustmentAmount,
      ),
      retroactiveAdjustmentsCount: safeNumber(
        periodRecord.retroactiveAdjustmentsCount,
      ),
      retroactiveSourcePeriods: Array.isArray(
        periodRecord.retroactiveSourcePeriods,
      )
        ? periodRecord.retroactiveSourcePeriods
        : [],
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
        retroactiveAdjustmentAmount: roundMoney(
          line.retroactiveAdjustmentAmount,
        ),
        retroactiveAdjustmentsCount: safeNumber(
          line.retroactiveAdjustmentsCount,
        ),
        retroactiveEntryIds: Array.isArray(line.retroactiveEntryIds)
          ? line.retroactiveEntryIds.map(toCleanString).filter(Boolean)
          : [],
        hasRetroactiveAdjustments: Boolean(line.hasRetroactiveAdjustments),
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
