import { useMemo } from 'react';
import styled from 'styled-components';

import { LazyBar } from '@/components/charts';
import { createCurrencyBarChartOptions } from '@/components/charts';
import { createSingleDatasetBarData } from '@/components/charts';
import Typography from '@/components/ui/Typography/Typography';
import type { Purchase, PurchaseReplenishment } from '@/utils/purchase/types';
import { calculateReplenishmentTotals } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/shared/utils/replenishmentTotals';

type PurchaseData = Purchase;

type PurchaseRecord = PurchaseData & {
    data?: PurchaseData;
};

type PurchaseReplenishmentWithCategory = PurchaseReplenishment & {
    category?: string;
};

type CategoryTotals = Record<string, { total: number }>;

const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const options = createCurrencyBarChartOptions({
    yAxisTitle: 'Monto de Compras',
    xAxisTitle: 'Categoría',
    tooltipSeparator: ' ',
});

const accumulatePurchaseDataByCategory = (purchases: PurchaseRecord[]): CategoryTotals => {
    return purchases.reduce<CategoryTotals>((acc, purchase) => {
        const purchaseData = purchase.data ?? purchase;
        const replenishments = Array.isArray(purchaseData.replenishments)
            ? purchaseData.replenishments
            : [];

        replenishments.forEach((replenishment) => {
            const category = String((replenishment as PurchaseReplenishmentWithCategory).category);
            const totals = calculateReplenishmentTotals([replenishment]);
            if (!acc[category]) {
                acc[category] = { total: 0 };
            }
            acc[category].total += toNumber(totals.grandTotal);
        });
        return acc;
    }, {});
};

interface CategoryPurchasesBarChartProps {
    purchases?: PurchaseRecord[];
}

export const CategoryPurchasesBarChart = ({ purchases }: CategoryPurchasesBarChartProps) => {
    const normalizedPurchases = useMemo(() => Array.isArray(purchases) ? purchases : [], [purchases]);

    const purchasesByCategory = useMemo(
        () => accumulatePurchaseDataByCategory(normalizedPurchases),
        [normalizedPurchases],
    );
    const data = useMemo(() => {
        const labels = Object.keys(purchasesByCategory);
        const dataTotals = labels.map((label) => purchasesByCategory[label]?.total ?? 0);

        const chartData = createSingleDatasetBarData({
            labels,
            values: dataTotals,
            datasetLabel: 'Compras',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
        });

        return chartData;
    }, [purchasesByCategory]);

    if (!normalizedPurchases.length) {
        return null;
    }

    return (
        <Container>
            <Typography variant='h3'>Compras Totales por Categoría</Typography>
            <LazyBar data={data} options={options} />
        </Container>
    )
}

const Container = styled.div`
    display: grid;
    gap: 1em;
    height: 200px;
`;
