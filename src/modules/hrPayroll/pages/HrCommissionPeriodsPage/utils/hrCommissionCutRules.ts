import type {
  HrCommissionCutRuleFrequency,
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

const addDays = (date: Date, days: number): Date =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    0,
    0,
    0,
    0,
  );

const toStartOfWeek = (date: Date): Date => {
  const anchor = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
  const day = anchor.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  return addDays(anchor, -daysSinceMonday);
};

const toEndOfDay = (date: Date): Date =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

const isLegacyBiweeklyCutRuleRange = (
  startDay: number,
  endDay: number,
): boolean =>
  (startDay === 1 && endDay === 15) || (startDay === 16 && endDay >= 28);

export const normalizeHrCommissionCutRuleFrequency = (
  rule: Pick<HrCommissionCutRuleRecord, 'endDay' | 'frequency' | 'startDay'>,
): HrCommissionCutRuleFrequency => {
  if (
    rule.frequency === 'monthly' &&
    isLegacyBiweeklyCutRuleRange(rule.startDay, rule.endDay)
  ) {
    return 'biweekly';
  }

  return rule.frequency;
};

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

  const frequency = normalizeHrCommissionCutRuleFrequency(rule);

  if (frequency === 'weekly') {
    const start = toStartOfWeek(anchorDate);
    const end = toEndOfDay(addDays(start, 6));
    const startKey = toHrDateKey(start);
    const endKey = toHrDateKey(end);

    return {
      start,
      end,
      startKey,
      endKey,
      label: `${rule.label} ${startKey} - ${endKey}`,
    };
  }

  const year = anchorDate.getFullYear();
  const monthIndex = anchorDate.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const startDay =
    frequency === 'biweekly' ? (anchorDate.getDate() <= 15 ? 1 : 16) : 1;
  const endDay =
    frequency === 'biweekly' && startDay === 1
      ? 15
      : clampRuleDay(31, daysInMonth);
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
  const anchorDate = latestEndDate ? addDays(latestEndDate, 1) : referenceDate;

  return resolveHrCommissionCutRuleRange({ anchorDate, rule });
};
