import type { UtilityDateRange, UtilityPresetKey } from '@/modules/utility/pages/Utility/types';

import { DateTime } from 'luxon';

import { getDateRange } from '@/utils/date/getDateRange';

export const computePreviousRange = (
  range: UtilityDateRange | null | undefined,
  presetKey: UtilityPresetKey,
): UtilityDateRange => {
  const fallback = getDateRange('lastWeek');
  if (!range?.startDate || !range?.endDate) return fallback;

  const now = DateTime.local();
  const startDateTime = DateTime.fromMillis(range.startDate);
  const endDateTime = DateTime.fromMillis(range.endDate);
  const startDay = startDateTime.startOf('day');
  const endDay = endDateTime.startOf('day');

  const clampToRange = (dateTime: DateTime): DateTime => {
    if (dateTime.toMillis() < startDateTime.toMillis()) return startDateTime;
    if (dateTime.toMillis() > endDateTime.toMillis()) return endDateTime;
    return dateTime;
  };

  const progressEnd = clampToRange(now);
  const totalDurationMillis = Math.max(
    0,
    endDateTime.toMillis() - startDateTime.toMillis(),
  );
  const rawProgressMillis = Math.max(
    0,
    progressEnd.toMillis() - startDateTime.toMillis(),
  );
  const progressMillis =
    presetKey === 'custom'
      ? totalDurationMillis
      : Math.min(rawProgressMillis, totalDurationMillis);

  const buildRange = (startDateTime: DateTime, endDateTime: DateTime): UtilityDateRange => {
    const startMillis = startDateTime.toMillis();
    const endMillis = Math.max(startMillis, endDateTime.toMillis());
    return {
      startDate: startMillis,
      endDate: endMillis,
    };
  };

  const computeWithProgress = (previousStart: DateTime, previousLimit: DateTime): UtilityDateRange => {
    const endCandidate = previousStart.plus({ milliseconds: progressMillis });
    const boundedEnd =
      endCandidate.toMillis() > previousLimit.toMillis()
        ? previousLimit
        : endCandidate;
    return buildRange(previousStart, boundedEnd);
  };

  if (presetKey === 'today') {
    const previousStart = startDay.minus({ days: 1 }).startOf('day');
    const previousLimit = previousStart.endOf('day');
    return computeWithProgress(previousStart, previousLimit);
  }

  if (presetKey === 'yesterday') {
    const previousStart = startDay.minus({ weeks: 1 }).startOf('day');
    return buildRange(previousStart, previousStart.endOf('day'));
  }

  if (presetKey === 'thisWeek') {
    const previousStart = startDay.minus({ weeks: 1 }).startOf('day');
    const previousLimit = previousStart
      .plus({ weeks: 1 })
      .minus({ milliseconds: 1 });
    return computeWithProgress(previousStart, previousLimit);
  }

  if (presetKey === 'thisMonth') {
    const previousStart = startDay.minus({ months: 1 }).startOf('day');
    const previousLimit = previousStart.endOf('month');
    return computeWithProgress(previousStart, previousLimit);
  }

  if (presetKey === 'thisYear') {
    const previousStart = startDay.minus({ years: 1 }).startOf('day');
    const previousLimit = previousStart.endOf('year');
    return computeWithProgress(previousStart, previousLimit);
  }

  const totalDays =
    Math.max(0, Math.floor(endDay.diff(startDay, 'days').days)) + 1;
  const previousPeriodEnd = startDay.minus({ days: 1 }).endOf('day');
  const previousPeriodStart = previousPeriodEnd
    .minus({ days: totalDays - 1 })
    .startOf('day');

  return {
    startDate: previousPeriodStart.toMillis(),
    endDate: previousPeriodEnd.toMillis(),
  };
};
