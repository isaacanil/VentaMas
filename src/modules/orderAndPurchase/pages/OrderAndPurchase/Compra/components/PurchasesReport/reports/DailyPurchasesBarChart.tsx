import { useMemo } from 'react';
import styled from 'styled-components';

import { LazyBar } from '@/components/charts';
import { createCurrencyBarChartOptions } from '@/components/charts';
import { createSingleDatasetBarData } from '@/components/charts';
import Typography from '@/components/ui/Typography/Typography';
import type { Purchase } from '@/utils/purchase/types';
import type { TimestampLike } from '@/utils/date/types';
import { toMillis } from '@/utils/date/toMillis';
import { calculateReplenishmentTotals } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/shared/utils/replenishmentTotals';

type PurchaseData = Purchase & {
    createdAt?: TimestampLike;
    date?: TimestampLike;
    displayDate?: string;
    total?: number | string;
    totalPurchase?: number | string | { value?: number | string };
};

type PurchaseRecord = PurchaseData & {
    data?: PurchaseData;
};

type DayTotals = Record<string, { total: number; label: string }>;

const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const options = createCurrencyBarChartOptions({
    yAxisTitle: 'Monto de Compras',
    xAxisTitle: 'Fecha',
    tooltipSeparator: ' ',
});

const resolvePurchaseDate = (purchaseData: PurchaseData): Date | null => {
    const dateValue =
        purchaseData?.dates?.createdAt ??
        purchaseData?.createdAt ??
        purchaseData?.date ??
        purchaseData?.deliveryAt ??
        purchaseData?.paymentAt ??
        purchaseData?.deliveryDate ??
        purchaseData?.paymentDate;

    const timestamp = toMillis(dateValue);
    if (!Number.isFinite(timestamp)) return null;

    return new Date(timestamp as number);
};

const resolvePurchaseTotal = (purchaseData: PurchaseData): number => {
    const directTotals: number[] = [
        toNumber(purchaseData?.total),
    ];

    if (purchaseData?.totalPurchase && typeof purchaseData.totalPurchase === 'object') {
        const withValue = purchaseData.totalPurchase as { value?: number | string };
        directTotals.push(toNumber(withValue.value));
    } else {
        directTotals.push(toNumber(purchaseData?.totalPurchase));
    }

    const directTotal = directTotals.find((value) => value > 0);
    if (directTotal !== undefined) return directTotal;

    const replenishmentTotals = calculateReplenishmentTotals(purchaseData?.replenishments || []);
    return toNumber(replenishmentTotals.grandTotal);
};

const accumulatePurchaseDataByDay = (purchases: PurchaseRecord[]): DayTotals => {
    return purchases.reduce<DayTotals>((acc, purchase) => {
        const purchaseData = purchase?.data ?? purchase;
        const date = resolvePurchaseDate(purchaseData);
        if (!date) return acc;

        const total = resolvePurchaseTotal(purchaseData);
        const dayKey = date.toISOString().split('T')[0];
        const displayDate =
            typeof purchaseData?.displayDate === 'string'
                ? purchaseData.displayDate
                : date.toLocaleDateString();

        if (!acc[dayKey]) {
            acc[dayKey] = { total: 0, label: displayDate };
        }

        acc[dayKey].total += total;

        return acc;
    }, {});
};

interface DailyPurchasesBarChartProps {
    purchases?: PurchaseRecord[];
}

export const DailyPurchasesBarChart = ({ purchases }: DailyPurchasesBarChartProps) => {
    const normalizedPurchases = useMemo(
        () => (Array.isArray(purchases) ? purchases : []),
        [purchases],
    );

    const purchasesByDay = useMemo(
        () => accumulatePurchaseDataByDay(normalizedPurchases),
        [normalizedPurchases],
    );

    const sortedKeys = useMemo(
        () => Object.keys(purchasesByDay).sort((a, b) => a.localeCompare(b)),
        [purchasesByDay],
    );

    const data = useMemo(() => {
        const labels = sortedKeys.map((key) => purchasesByDay[key].label);
        const totals = sortedKeys.map((key) => purchasesByDay[key].total);

        const chartData = createSingleDatasetBarData({
            labels,
            values: totals,
            datasetLabel: 'Compras',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
        });

        return chartData;
    }, [purchasesByDay, sortedKeys]);

    if (!normalizedPurchases.length || !sortedKeys.length) {
        return null;
    }

    return (
        <Container>
            <Typography variant='h3'>Compras totales por dia</Typography>
            <LazyBar data={data} options={options} />
        </Container>
    );
};

const Container = styled.div`
    display: grid;
    gap: 1em;
    height: 200px;
`;
