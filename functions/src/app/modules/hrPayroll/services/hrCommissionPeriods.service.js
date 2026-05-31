import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';

const ELIGIBLE_ENTRY_STATUSES = new Set(['calculated', 'eligible']);
const PERIOD_STATUSES = new Set([
  'draft',
  'closed',
  'approved',
  'partially_paid',
  'paid',
  'cancelled',
]);

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

const sanitizeDocId = (value) =>
  toCleanString(value)?.replace(/[^a-zA-Z0-9_-]/g, '_') || null;

const withoutUndefined = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
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

export const normalizeHrCommissionPeriodStatus = (value) => {
  const status = toCleanString(value)?.toLowerCase();
  return PERIOD_STATUSES.has(status) ? status : 'draft';
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
  if (!eligibleEntries.length) {
    return {
      ok: false,
      error:
        'No hay comisiones calculadas y vinculadas a empleados para este rango.',
    };
  }

  const groups = groupHrCommissionEntriesByEmployee(eligibleEntries);
  const currency = groups[0]?.currency || 'DOP';
  const payrollRunId = `run_${resolvedPeriodId}`;
  const totalCommissionAmount = roundMoney(
    groups.reduce((sum, group) => sum + group.totalCommissionAmount, 0),
  );
  const startTimestamp = Timestamp.fromDate(range.start);
  const endTimestamp = Timestamp.fromDate(range.end);
  const periodKey = `${range.startKey}_${range.endKey}`;

  const employeeLines = groups.map((group) => {
    const lineId = sanitizeDocId(`${resolvedPeriodId}_${group.employeeId}`);
    return {
      id: lineId,
      businessId,
      periodId: resolvedPeriodId,
      payrollRunId,
      employeeId: group.employeeId,
      employeeCode: group.employeeCode,
      employeeNameSnapshot: group.employeeNameSnapshot,
      partyId: group.partyId,
      type: 'commission',
      status: 'draft',
      currency: group.currency || currency,
      grossAmount: group.totalCommissionAmount,
      deductionsAmount: 0,
      netAmount: group.totalCommissionAmount,
      commissionAmount: group.totalCommissionAmount,
      commissionEntryIds: group.entries.map((entry) => entry.id),
      entriesCount: group.entries.length,
      createdAt: timestamp,
      createdBy: userId,
      updatedAt: timestamp,
      updatedBy: userId,
    };
  });

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
    label: `Comisiones ${range.startKey} - ${range.endKey}`,
    status: 'draft',
    startDate: startTimestamp,
    endDate: endTimestamp,
    currency,
    entriesCount: eligibleEntries.length,
    employeesCount: groups.length,
    totalCommissionAmount,
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
    currency,
    employeeCount: groups.length,
    lineCount: employeeLines.length,
    grossAmount: totalCommissionAmount,
    deductionsAmount: 0,
    netAmount: totalCommissionAmount,
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

export const buildHrCommissionAccrualAccountingEvent = ({
  businessId,
  employeeLines = [],
  period,
  timestamp = FieldValue.serverTimestamp(),
  userId = null,
} = {}) => {
  const periodRecord = asRecord(period);
  const periodId = toCleanString(periodRecord.id);
  const totalAmount = roundMoney(periodRecord.totalCommissionAmount);
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
      employeesCount: safeNumber(periodRecord.employeesCount),
      entriesCount: safeNumber(periodRecord.entriesCount),
      employeeLines: (Array.isArray(employeeLines) ? employeeLines : []).map(
        (line) => ({
          id: toCleanString(line.id),
          employeeId: toCleanString(line.employeeId),
          employeeCode: toCleanString(line.employeeCode),
          employeeNameSnapshot: toCleanString(line.employeeNameSnapshot),
          amount: roundMoney(line.netAmount ?? line.commissionAmount),
        }),
      ),
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
