import type {
  UtilityDailyMetric,
  UtilityTransactionRow,
  UtilityTrend,
} from '@/modules/utility/pages/Utility/types';

import { DateTime } from 'luxon';

const hasActivity = (day: UtilityDailyMetric): boolean =>
  day.sales !== 0 ||
  day.cost !== 0 ||
  day.taxes !== 0 ||
  day.expenses !== 0 ||
  day.profitBeforeExpenses !== 0 ||
  day.netProfit !== 0;

export const buildTransactionRows = (
  dailyMetrics: UtilityDailyMetric[] | null | undefined,
): UtilityTransactionRow[] => {
  if (!Array.isArray(dailyMetrics) || dailyMetrics.length === 0) {
    return [];
  }

  const sorted = [...dailyMetrics].sort((a, b) => b.timestamp - a.timestamp);
  const lastDataEntry = sorted.find(hasActivity);
  const cutoffTimestamp = lastDataEntry?.timestamp ?? null;
  const filtered = cutoffTimestamp
    ? sorted.filter((day) => day.timestamp <= cutoffTimestamp)
    : [];

  if (!filtered.length) {
    return [];
  }

  const rows = filtered.map((day, index) => {
    const next = filtered[index + 1];
    let trend: UtilityTrend = 'flat';
    if (next) {
      if (day.netProfit > next.netProfit) trend = 'up';
      else if (day.netProfit < next.netProfit) trend = 'down';
    }

    return {
      id: day.isoDate,
      dateLabel: DateTime.fromMillis(day.timestamp)
        .setLocale('es')
        .toFormat('dd LLL yyyy'),
      totalSales: day.sales,
      totalCost: day.cost,
      taxes: day.taxes,
      netProfit: day.netProfit,
      trend,
    };
  });

  const hasData = rows.some(
    (row) =>
      row.totalSales !== 0 ||
      row.totalCost !== 0 ||
      row.netProfit !== 0 ||
      row.taxes !== 0,
  );
  return hasData ? rows : [];
};
