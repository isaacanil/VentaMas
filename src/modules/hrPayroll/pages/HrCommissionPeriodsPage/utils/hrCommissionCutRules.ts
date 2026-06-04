import type {
  HrCommissionCutRuleRecord,
  HrCommissionPeriodRecord,
} from '@/types/hrPayroll';

import { toHrDateKey } from '@/modules/hrPayroll/utils/hrDateRange';

export interface HrCommissionCutRuleRange {
  end: Date;
  endKey: string;
  label: string;
  start: Date;
  startKey: string;
}

const getDaysInMonth = (year: number, monthIndex: number): number =>
  new Date(year, monthIndex + 1, 0).getDate();

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'object' && 'toDate' in value) {
    const date = (value as { toDate: () => unknown }).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  if (typeof value === 'object' && 'toMillis' in value) {
    const millis = (value as { toMillis: () => unknown }).toMillis();
    const date = new Date(Number(millis));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const clampRuleDay = (day: number, daysInMonth: number): number =>
  Math.min(Math.max(Math.trunc(day), 1), daysInMonth);

export const formatHrCommissionCutRuleDayRange = (
  rule: Pick<HrCommissionCutRuleRecord, 'endDay' | 'startDay'>,
): string => {
  const start = Math.max(1, Math.min(31, Math.trunc(rule.startDay)));
  const end = Math.max(1, Math.min(31, Math.trunc(rule.endDay)));
  const endLabel = end === 31 ? 'ultimo dia' : String(end);
  return `${start} - ${endLabel}`;
};

export const resolveHrCommissionCutRuleRange = ({
  anchorDate = new Date(),
  rule,
}: {
  anchorDate?: Date;
  rule: HrCommissionCutRuleRecord;
}): HrCommissionCutRuleRange | null => {
  if (!rule.id || !rule.label || rule.startDay > rule.endDay) return null;

  const year = anchorDate.getFullYear();
  const monthIndex = anchorDate.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const startDay = clampRuleDay(rule.startDay, daysInMonth);
  const endDay = clampRuleDay(rule.endDay, daysInMonth);
  const start = new Date(year, monthIndex, startDay, 0, 0, 0, 0);
  const end = new Date(year, monthIndex, endDay, 23, 59, 59, 999);
  const startKey = toHrDateKey(start);
  const endKey = toHrDateKey(end);

  return {
    start,
    end,
    startKey,
    endKey,
    label: `${rule.label} ${startKey} - ${endKey}`,
  };
};

export const resolveNextHrCommissionCutRuleRange = ({
  periods,
  referenceDate = new Date(),
  rule,
}: {
  periods: HrCommissionPeriodRecord[];
  referenceDate?: Date;
  rule: HrCommissionCutRuleRecord | null;
}): HrCommissionCutRuleRange | null => {
  if (!rule) return null;

  const latestEndDate = periods
    .filter((period) => period.cutRuleId === rule.id)
    .map((period) => toDate(period.endDate))
    .filter((date): date is Date => Boolean(date))
    .sort((left, right) => right.getTime() - left.getTime())[0];
  const anchorDate = latestEndDate
    ? new Date(latestEndDate.getFullYear(), latestEndDate.getMonth() + 1, 1)
    : referenceDate;

  return resolveHrCommissionCutRuleRange({ anchorDate, rule });
};

