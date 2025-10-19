import { DateTime } from 'luxon';

import { getDateRange } from '../../../../utils/date/getDateRange';

export const computePreviousRange = (range, presetKey) => {
    const fallback = getDateRange('lastWeek');
    if (!range?.startDate || !range?.endDate) return fallback;

    if (presetKey === 'today') {
        return getDateRange('yesterday');
    }

    if (presetKey === 'yesterday') {
        const start = DateTime.fromMillis(range.startDate).minus({ days: 1 }).startOf('day');
        const end = start.endOf('day');
        return {
            startDate: start.toMillis(),
            endDate: end.toMillis(),
        };
    }

    if (presetKey === 'thisWeek') {
        return getDateRange('lastWeek');
    }

    const startDay = DateTime.fromMillis(range.startDate).startOf('day');
    const endDay = DateTime.fromMillis(range.endDate).startOf('day');
    const totalDays = Math.max(0, Math.floor(endDay.diff(startDay, 'days').days)) + 1;
    const previousPeriodEnd = startDay.minus({ days: 1 }).endOf('day');
    const previousPeriodStart = previousPeriodEnd.minus({ days: totalDays - 1 }).startOf('day');

    return {
        startDate: previousPeriodStart.toMillis(),
        endDate: previousPeriodEnd.toMillis(),
    };
};
