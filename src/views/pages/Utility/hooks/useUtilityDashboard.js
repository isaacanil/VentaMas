import { DateTime } from 'luxon';
import { useCallback, useMemo, useState } from 'react';

import { useLocalFbGetExpenses } from '../../../../firebase/expenses/Items/useFbGetExpenses';
import { fbGetInvoices } from '../../../../firebase/invoices/fbGetInvoices';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';
import { getDateRange } from '../../../../utils/date/getDateRange';
import { DISTRIBUTION_COLORS } from '../constants/utilityConstants';
import {
  buildFinancialMetrics,
  formatPercentage,
  getDistributionDetails,
} from '../utils/metrics';
import { computePreviousRange } from '../utils/range';

const rangesAreEqual = (a, b) =>
  Boolean(a?.startDate && a?.endDate && b?.startDate && b?.endDate) &&
  a.startDate === b.startDate &&
  a.endDate === b.endDate;

const PRESET_LABELS = {
  today: 'Hoy',
  yesterday: 'Ayer',
  thisWeek: 'Esta semana',
  lastWeek: 'Semana pasada',
  thisMonth: 'Este mes',
  lastMonth: 'Mes pasado',
  thisYear: 'Este año',
  lastYear: 'Año pasado',
  custom: 'Personalizado',
};

const getComparisonMeta = (preset, { customRangeLabel } = {}) => {
  switch (preset) {
    case 'today':
      return { title: 'Resultados de hoy', previousLabel: 'Ayer' };
    case 'yesterday':
      return {
        title: 'Resultados de ayer',
        previousLabel: 'Mismo día semana pasada',
      };
    case 'thisWeek':
      return { title: 'Semana actual', previousLabel: 'Semana pasada' };
    case 'lastWeek':
      return { title: 'Semana pasada', previousLabel: 'Semana anterior' };
    case 'thisMonth':
      return { title: 'Mes actual', previousLabel: 'Mes pasado' };
    case 'lastMonth':
      return { title: 'Mes pasado', previousLabel: 'Mes anterior' };
    case 'thisYear':
      return { title: 'Año actual', previousLabel: 'Año pasado' };
    case 'lastYear':
      return { title: 'Año pasado', previousLabel: 'Año anterior' };
    case 'custom':
      return {
        title: customRangeLabel ?? 'Rango personalizado',
        previousLabel: 'Período anterior',
      };
    default:
      return {
        title: customRangeLabel ?? 'Período seleccionado',
        previousLabel: 'Período anterior',
      };
  }
};

export const useUtilityDashboard = () => {
  const [datesSelected, setDatesSelected] = useState(() =>
    getDateRange('today'),
  );
  const [selectedPreset, setSelectedPreset] = useState('today');

  const thisWeekRange = useMemo(() => getDateRange('thisWeek'), []);
  const lastWeekRange = useMemo(() => getDateRange('lastWeek'), []);
  const previousRange = useMemo(
    () => computePreviousRange(datesSelected, selectedPreset),
    [datesSelected, selectedPreset],
  );

  const { expenses, loading: expensesLoading } =
    useLocalFbGetExpenses(datesSelected);
  const { invoices, loading: invoicesLoading } = fbGetInvoices(datesSelected);

  const { expenses: previousExpenses, loading: prevExpensesLoading } =
    useLocalFbGetExpenses(previousRange);
  const { invoices: previousInvoices, loading: prevInvoicesLoading } =
    fbGetInvoices(previousRange);

  const { expenses: weekExpenses, loading: weekExpensesLoading } =
    useLocalFbGetExpenses(thisWeekRange);
  const { invoices: weekInvoices, loading: weekInvoicesLoading } =
    fbGetInvoices(thisWeekRange);

  const { expenses: lastWeekExpenses, loading: lastWeekExpensesLoading } =
    useLocalFbGetExpenses(lastWeekRange);
  const { invoices: lastWeekInvoices, loading: lastWeekInvoicesLoading } =
    fbGetInvoices(lastWeekRange);
  const currentMetrics = useMemo(
    () => buildFinancialMetrics(invoices, expenses, datesSelected),
    [invoices, expenses, datesSelected],
  );
  const previousMetrics = useMemo(
    () =>
      buildFinancialMetrics(previousInvoices, previousExpenses, previousRange),
    [previousInvoices, previousExpenses, previousRange],
  );

  const isCurrentWeekRange = rangesAreEqual(datesSelected, thisWeekRange);

  const weekMetrics = useMemo(
    () =>
      isCurrentWeekRange
        ? currentMetrics
        : buildFinancialMetrics(weekInvoices, weekExpenses, thisWeekRange),
    [
      isCurrentWeekRange,
      currentMetrics,
      weekInvoices,
      weekExpenses,
      thisWeekRange,
    ],
  );
  const lastWeekMetrics = useMemo(
    () =>
      buildFinancialMetrics(lastWeekInvoices, lastWeekExpenses, lastWeekRange),
    [lastWeekInvoices, lastWeekExpenses, lastWeekRange],
  );

  const loading = invoicesLoading || expensesLoading;
  const weekRangeLoading = isCurrentWeekRange
    ? loading
    : weekInvoicesLoading || weekExpensesLoading;
  const lastWeekRangeLoading =
    lastWeekInvoicesLoading || lastWeekExpensesLoading;
  const previousRangeLoading = prevInvoicesLoading || prevExpensesLoading;

  const comparisonLoading =
    selectedPreset === 'thisWeek'
      ? weekRangeLoading || lastWeekRangeLoading
      : loading || previousRangeLoading;

  const formatCurrency = useCallback(
    (value) => useFormatPrice(value ?? 0, 'rd'),
    [],
  );
  const formatPercentageValue = useCallback(
    (value) => formatPercentage(value),
    [],
  );

  const computeWeeklySnapshot = useCallback(
    (accessor) => {
      if (
        !thisWeekRange?.startDate ||
        !thisWeekRange?.endDate ||
        !lastWeekRange?.startDate ||
        !lastWeekRange?.endDate
      ) {
        return {
          current: 0,
          previous: 0,
          delta: 0,
          percentage: null,
          trend: 'flat',
        };
      }

      const clampDate = (value, min, max) => {
        if (value.toMillis() < min.toMillis()) return min;
        if (value.toMillis() > max.toMillis()) return max;
        return value;
      };

      const sumUntil = (metrics, cutoff) => {
        const cutoffMillis = cutoff.toMillis();
        const hourlyEntries = Array.isArray(metrics.hourlyMetrics)
          ? metrics.hourlyMetrics
          : [];
        if (hourlyEntries.length) {
          return hourlyEntries
            .filter((entry) => entry.timestamp <= cutoffMillis)
            .reduce((acc, entry) => acc + accessor(entry), 0);
        }

        const dailyEntries = Array.isArray(metrics.dailyMetrics)
          ? metrics.dailyMetrics
          : [];
        const cutoffDayMillis = cutoff.endOf('day').toMillis();
        return dailyEntries
          .filter((entry) => entry.timestamp <= cutoffDayMillis)
          .reduce((acc, entry) => acc + accessor(entry), 0);
      };

      const weekStart = DateTime.fromMillis(thisWeekRange.startDate);
      const weekEnd = DateTime.fromMillis(thisWeekRange.endDate);
      const lastWeekStart = DateTime.fromMillis(lastWeekRange.startDate);
      const lastWeekEnd = DateTime.fromMillis(lastWeekRange.endDate);

      const currentCutoff = clampDate(DateTime.local(), weekStart, weekEnd);
      const previousCutoff = clampDate(
        currentCutoff.minus({ weeks: 1 }),
        lastWeekStart,
        lastWeekEnd,
      );

      const current = sumUntil(weekMetrics, currentCutoff);
      const previous = sumUntil(lastWeekMetrics, previousCutoff);
      const delta = current - previous;
      const percentage =
        previous !== 0 ? (delta / Math.abs(previous || 1)) * 100 : null;
      const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

      return {
        current,
        previous,
        delta,
        percentage,
        trend,
      };
    },
    [thisWeekRange, lastWeekRange, weekMetrics, lastWeekMetrics],
  );

  const weeklyComparison = useMemo(
    () => computeWeeklySnapshot((entry) => entry.netProfit),
    [computeWeeklySnapshot],
  );

  const weeklySalesComparison = useMemo(
    () => computeWeeklySnapshot((entry) => entry.sales),
    [computeWeeklySnapshot],
  );

  const rangeLabel = useMemo(() => {
    if (!datesSelected?.startDate || !datesSelected?.endDate) return '';
    const start = DateTime.fromMillis(datesSelected.startDate).setLocale('es');
    const end = DateTime.fromMillis(datesSelected.endDate).setLocale('es');
    if (start.hasSame(end, 'day')) {
      return start.toFormat('dd LLL yyyy');
    }
    return `${start.toFormat('dd LLL yyyy')} - ${end.toFormat('dd LLL yyyy')}`;
  }, [datesSelected]);

  const rangeDetailLabel = useMemo(() => {
    if (!datesSelected?.startDate || !datesSelected?.endDate) return '';
    const start = DateTime.fromMillis(datesSelected.startDate).setLocale('es');
    const end = DateTime.fromMillis(datesSelected.endDate).setLocale('es');
    const format = {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };
    const startLabel = start.toLocaleString(format);
    if (start.hasSame(end, 'day')) {
      return startLabel;
    }
    const endLabel = end.toLocaleString(format);
    return `${startLabel} a ${endLabel}`;
  }, [datesSelected]);

  const presetLabel = useMemo(
    () => PRESET_LABELS[selectedPreset] ?? 'Período seleccionado',
    [selectedPreset],
  );

  const rangeComparison = useMemo(() => {
    const meta = getComparisonMeta(selectedPreset, {
      customRangeLabel: rangeLabel,
    });

    if (selectedPreset === 'thisWeek') {
      return {
        ...weeklyComparison,
        title: meta.title,
        previousLabel: meta.previousLabel,
      };
    }

    const current = currentMetrics.summary.netProfit;
    const previous = previousMetrics.summary.netProfit;
    const delta = current - previous;
    const percentage =
      previous !== 0 ? (delta / Math.abs(previous || 1)) * 100 : null;
    const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

    return {
      current,
      previous,
      delta,
      percentage,
      trend,
      title: meta.title,
      previousLabel: meta.previousLabel,
    };
  }, [
    selectedPreset,
    currentMetrics.summary,
    previousMetrics.summary,
    weeklyComparison,
    rangeLabel,
  ]);

  const salesComparison = useMemo(() => {
    const meta = getComparisonMeta(selectedPreset, {
      customRangeLabel: rangeLabel,
    });

    if (selectedPreset === 'thisWeek') {
      return {
        ...weeklySalesComparison,
        title: meta.title,
        previousLabel: meta.previousLabel,
      };
    }

    const current = currentMetrics.summary.totalSales;
    const previous = previousMetrics.summary.totalSales;
    const delta = current - previous;
    const percentage =
      previous !== 0 ? (delta / Math.abs(previous || 1)) * 100 : null;
    const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

    return {
      current,
      previous,
      delta,
      percentage,
      trend,
      title: meta.title,
      previousLabel: meta.previousLabel,
    };
  }, [
    selectedPreset,
    currentMetrics.summary,
    previousMetrics.summary,
    weeklySalesComparison,
    rangeLabel,
  ]);

  const lastSevenDaysMetrics = useMemo(() => {
    const today = DateTime.local().endOf('day').toMillis();
    const combined = [
      ...lastWeekMetrics.dailyMetrics,
      ...weekMetrics.dailyMetrics,
    ]
      .filter((item) => item.timestamp <= today)
      .sort((a, b) => a.timestamp - b.timestamp);

    const uniqueByDate = combined.filter(
      (item, index, arr) =>
        index ===
        arr.findIndex((reference) => reference.isoDate === item.isoDate),
    );

    const sliced = uniqueByDate.slice(-7);
    if (sliced.length) {
      return sliced;
    }

    return currentMetrics.dailyMetrics.slice(-7);
  }, [
    weekMetrics.dailyMetrics,
    lastWeekMetrics.dailyMetrics,
    currentMetrics.dailyMetrics,
  ]);

  const yearlyAggregatedMetrics = useMemo(() => {
    if (!currentMetrics.dailyMetrics.length) return [];

    const groups = new Map();

    currentMetrics.dailyMetrics.forEach((day) => {
      const date = DateTime.fromISO(day.isoDate);
      const key = date.toFormat('yyyy-LL');
      const startOfMonth = date.startOf('month');

      if (!groups.has(key)) {
        groups.set(key, {
          isoDate: startOfMonth.toISODate(),
          timestamp: startOfMonth.toMillis(),
          dateLabel: startOfMonth.setLocale('es').toFormat('LLL yyyy'),
          sales: 0,
          cost: 0,
          taxes: 0,
          expenses: 0,
          profitBeforeExpenses: 0,
          netProfit: 0,
        });
      }

      const entry = groups.get(key);
      entry.sales += day.sales;
      entry.cost += day.cost;
      entry.taxes += day.taxes;
      entry.expenses += day.expenses;
      entry.profitBeforeExpenses += day.profitBeforeExpenses;
      entry.netProfit += day.netProfit;
    });

    return Array.from(groups.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }, [currentMetrics.dailyMetrics]);

  const isHourlyView =
    selectedPreset === 'today' || selectedPreset === 'yesterday';

  const chartTimeSeriesMetrics = useMemo(() => {
    if (isHourlyView) {
      if (currentMetrics.hourlyMetrics.length) {
        return currentMetrics.hourlyMetrics;
      }
      return lastSevenDaysMetrics;
    }

    if (selectedPreset === 'thisYear') {
      return yearlyAggregatedMetrics;
    }

    if (selectedPreset === 'thisWeek') {
      const today = DateTime.local().endOf('day').toMillis();
      const filtered = weekMetrics.dailyMetrics.filter(
        (item) => item.timestamp <= today,
      );
      return filtered.length ? filtered : lastSevenDaysMetrics;
    }

    return currentMetrics.dailyMetrics;
  }, [
    isHourlyView,
    selectedPreset,
    currentMetrics.hourlyMetrics,
    currentMetrics.dailyMetrics,
    yearlyAggregatedMetrics,
    weekMetrics.dailyMetrics,
    lastSevenDaysMetrics,
  ]);

  const dailyChartData = useMemo(() => {
    if (!chartTimeSeriesMetrics.length) return null;
    const labels = chartTimeSeriesMetrics.map((item) => item.dateLabel);
    const salesData = chartTimeSeriesMetrics.map((item) => item.sales);
    const profitData = chartTimeSeriesMetrics.map((item) => item.netProfit);

    return {
      labels,
      datasets: [
        {
          label: 'Ventas',
          data: salesData,
          borderColor: 'rgba(79, 70, 229, 1)',
          backgroundColor: 'rgba(129, 140, 248, 0.25)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: 'Ganancia neta',
          data: profitData,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(134, 239, 172, 0.25)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    };
  }, [chartTimeSeriesMetrics]);

  const dailyChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              return `${label}: ${formatCurrency(value)}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => formatCurrency(value),
          },
          grid: {
            color: '#e2e8f0',
            drawBorder: false,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    }),
    [formatCurrency],
  );

  const chartSubtitle = useMemo(() => {
    if (isHourlyView) {
      return 'Comportamiento por hora en el rango seleccionado.';
    }
    if (selectedPreset === 'thisYear') {
      return 'Comportamiento mensual en el rango seleccionado.';
    }
    return 'Comportamiento diario en el rango seleccionado.';
  }, [isHourlyView, selectedPreset]);

  const distributionDetails = useMemo(
    () => getDistributionDetails(currentMetrics.summary, DISTRIBUTION_COLORS),
    [currentMetrics.summary],
  );

  const pieChartData = useMemo(() => {
    const visibleSegments = distributionDetails.filter(
      (segment) => segment.chartValue > 0,
    );
    if (!visibleSegments.length) return null;

    return {
      labels: visibleSegments.map((segment) => segment.label),
      datasets: [
        {
          data: visibleSegments.map((segment) => segment.chartValue),
          backgroundColor: visibleSegments.map((segment) => segment.color),
          borderWidth: 0,
        },
      ],
    };
  }, [distributionDetails]);

  const pieChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${formatCurrency(value)}`;
            },
          },
        },
      },
    }),
    [formatCurrency],
  );

  const handlePresetSelect = useCallback((key, range) => {
    if (key === 'custom') {
      if (range?.startDate && range?.endDate) {
        setSelectedPreset(key);
        setDatesSelected(range);
      }
      return;
    }

    const computedRange = getDateRange(key);
    setSelectedPreset(key);
    setDatesSelected(computedRange);
  }, []);

  return {
    rangeComparison,
    dailyChartData,
    dailyChartOptions,
    pieChartData,
    pieChartOptions,
    distributionDetails,
    formatCurrency,
    formatPercentage: formatPercentageValue,
    chartSubtitle,
    loading,
    comparisonLoading,
    selectedPreset,
    rangeLabel,
    rangeDetailLabel,
    presetLabel,
    onPresetSelect: handlePresetSelect,
    selectedRange: datesSelected,
    summary: currentMetrics.summary,
    dailyMetrics: currentMetrics.dailyMetrics,
    productsBreakdown: currentMetrics.productsBreakdown,
    salesComparison,
  };
};
