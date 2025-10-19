import { DateTime } from 'luxon';
import { useCallback, useMemo, useState } from 'react';

import { useLocalFbGetExpenses } from '../../../../firebase/expenses/Items/useFbGetExpenses';
import { fbGetInvoices } from '../../../../firebase/invoices/fbGetInvoices';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';
import { getDateRange } from '../../../../utils/date/getDateRange';
import { QUICK_RANGES, DISTRIBUTION_COLORS } from '../constants/utilityConstants';
import { buildFinancialMetrics, formatPercentage, getDistributionDetails } from '../utils/metrics';
import { computePreviousRange } from '../utils/range';

const rangesAreEqual = (a, b) =>
    Boolean(a?.startDate && a?.endDate && b?.startDate && b?.endDate) &&
    a.startDate === b.startDate &&
    a.endDate === b.endDate;

export const useUtilityDashboard = () => {
    const [datesSelected, setDatesSelected] = useState(() => getDateRange('today'));
    const [selectedPreset, setSelectedPreset] = useState('today');

    const thisWeekRange = useMemo(() => getDateRange('thisWeek'), []);
    const lastWeekRange = useMemo(() => getDateRange('lastWeek'), []);
    const previousRange = useMemo(
        () => computePreviousRange(datesSelected, selectedPreset),
        [datesSelected, selectedPreset]
    );

    const { expenses, loading: expensesLoading } = useLocalFbGetExpenses(datesSelected);
    const { invoices, loading: invoicesLoading } = fbGetInvoices(datesSelected);

    const { expenses: previousExpenses, loading: prevExpensesLoading } = useLocalFbGetExpenses(previousRange);
    const { invoices: previousInvoices, loading: prevInvoicesLoading } = fbGetInvoices(previousRange);
    
    const { expenses: weekExpenses, loading: weekExpensesLoading } = useLocalFbGetExpenses(thisWeekRange);
    const { invoices: weekInvoices, loading: weekInvoicesLoading } = fbGetInvoices(thisWeekRange);

    const { expenses: lastWeekExpenses, loading: lastWeekExpensesLoading } = useLocalFbGetExpenses(lastWeekRange);
    const { invoices: lastWeekInvoices, loading: lastWeekInvoicesLoading } = fbGetInvoices(lastWeekRange);
    console.log("invoices: ", invoices);
    const currentMetrics = useMemo(
        () => buildFinancialMetrics(invoices, expenses, datesSelected),
        [invoices, expenses, datesSelected]
    );
    const previousMetrics = useMemo(
        () => buildFinancialMetrics(previousInvoices, previousExpenses, previousRange),
        [previousInvoices, previousExpenses, previousRange]
    );

    const isCurrentWeekRange = rangesAreEqual(datesSelected, thisWeekRange);

    const weekMetrics = useMemo(
        () =>
            isCurrentWeekRange
                ? currentMetrics
                : buildFinancialMetrics(weekInvoices, weekExpenses, thisWeekRange),
        [isCurrentWeekRange, currentMetrics, weekInvoices, weekExpenses, thisWeekRange]
    );
    const lastWeekMetrics = useMemo(
        () => buildFinancialMetrics(lastWeekInvoices, lastWeekExpenses, lastWeekRange),
        [lastWeekInvoices, lastWeekExpenses, lastWeekRange]
    );

    const loading = invoicesLoading || expensesLoading;
    const weekRangeLoading = isCurrentWeekRange
        ? loading
        : weekInvoicesLoading || weekExpensesLoading;
    const lastWeekRangeLoading = lastWeekInvoicesLoading || lastWeekExpensesLoading;
    const previousRangeLoading = prevInvoicesLoading || prevExpensesLoading;

    const comparisonLoading =
        selectedPreset === 'thisWeek'
            ? weekRangeLoading || lastWeekRangeLoading
            : loading || previousRangeLoading;

    const formatCurrency = useCallback(
        (value) => useFormatPrice(value ?? 0, 'rd'),
        []
    );
    const formatPercentageValue = useCallback((value) => formatPercentage(value), []);

    const weeklyComparison = useMemo(() => {
        const today = DateTime.local().startOf('day');
        const startOfWeek = today.startOf('week');
        const daysElapsed = Math.max(0, Math.floor(today.diff(startOfWeek, 'days').days));
        const dayCount = daysElapsed + 1;

        const sumWeekToDate = (metrics) =>
            metrics.dailyMetrics
                .slice(0, dayCount)
                .reduce((acc, day) => acc + day.netProfit, 0);

        const current = sumWeekToDate(weekMetrics);
        const previous = sumWeekToDate(lastWeekMetrics);
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
    }, [weekMetrics, lastWeekMetrics]);

    const rangeComparison = useMemo(() => {
        const meta = (() => {
            switch (selectedPreset) {
                case 'today':
                    return { title: 'Resultados de hoy', previousLabel: 'Ayer' };
                case 'yesterday':
                    return { title: 'Resultados de ayer', previousLabel: 'Anteayer' };
                case 'thisWeek':
                    return { title: 'Semana actual', previousLabel: 'Semana pasada' };
                case 'thisMonth':
                    return { title: 'Mes actual', previousLabel: 'Mes pasado' };
                case 'thisYear':
                    return { title: 'Año actual', previousLabel: 'Año pasado' };
                default:
                    return { title: 'Período seleccionado', previousLabel: 'Período anterior' };
            }
        })();

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
    }, [selectedPreset, currentMetrics.summary, previousMetrics.summary, weeklyComparison]);

    const lastSevenDaysMetrics = useMemo(() => {
        const today = DateTime.local().endOf('day').toMillis();
        const combined = [...lastWeekMetrics.dailyMetrics, ...weekMetrics.dailyMetrics]
            .filter((item) => item.timestamp <= today)
            .sort((a, b) => a.timestamp - b.timestamp);

        const uniqueByDate = combined.filter(
            (item, index, arr) => index === arr.findIndex((reference) => reference.isoDate === item.isoDate)
        );

        const sliced = uniqueByDate.slice(-7);
        if (sliced.length) {
            return sliced;
        }

        return currentMetrics.dailyMetrics.slice(-7);
    }, [weekMetrics.dailyMetrics, lastWeekMetrics.dailyMetrics, currentMetrics.dailyMetrics]);

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

        return Array.from(groups.values()).sort((a, b) => a.timestamp - b.timestamp);
    }, [currentMetrics.dailyMetrics]);

    const chartDailyMetrics = useMemo(() => {
        if (selectedPreset === 'thisYear') {
            return yearlyAggregatedMetrics;
        }

        if (selectedPreset === 'today' || selectedPreset === 'yesterday') {
            return lastSevenDaysMetrics;
        }

        if (selectedPreset === 'thisWeek') {
            const today = DateTime.local().endOf('day').toMillis();
            const filtered = weekMetrics.dailyMetrics.filter((item) => item.timestamp <= today);
            return filtered.length ? filtered : lastSevenDaysMetrics;
        }

        return currentMetrics.dailyMetrics;
    }, [
        selectedPreset,
        yearlyAggregatedMetrics,
        lastSevenDaysMetrics,
        weekMetrics.dailyMetrics,
        currentMetrics.dailyMetrics,
    ]);

    const dailyChartData = useMemo(() => {
        if (!chartDailyMetrics.length) return null;
        const labels = chartDailyMetrics.map((item) => item.dateLabel);
        const salesData = chartDailyMetrics.map((item) => item.sales);
        const profitData = chartDailyMetrics.map((item) => item.netProfit);

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
    }, [chartDailyMetrics]);

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
        [formatCurrency]
    );

    const distributionDetails = useMemo(
        () => getDistributionDetails(currentMetrics.summary, DISTRIBUTION_COLORS),
        [currentMetrics.summary]
    );

    const pieChartData = useMemo(() => {
        const visibleSegments = distributionDetails.filter((segment) => segment.chartValue > 0);
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
        [formatCurrency]
    );

    const handlePresetSelect = useCallback(
        (key) => {
            const range = getDateRange(key);
            setSelectedPreset(key);
            setDatesSelected(range);
        },
        []
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

    return {
        rangeComparison,
        dailyChartData,
        dailyChartOptions,
        pieChartData,
        pieChartOptions,
        distributionDetails,
        formatCurrency,
        formatPercentage: formatPercentageValue,
        loading,
        comparisonLoading,
        selectedPreset,
        rangeLabel,
        onPresetSelect: handlePresetSelect,
        quickRanges: QUICK_RANGES,
        summary: currentMetrics.summary,
        dailyMetrics: currentMetrics.dailyMetrics,
        productsBreakdown: currentMetrics.productsBreakdown,
    };
};
