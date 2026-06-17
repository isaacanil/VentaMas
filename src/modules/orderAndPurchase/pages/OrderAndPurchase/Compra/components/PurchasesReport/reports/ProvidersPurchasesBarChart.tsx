import { useMemo } from 'react';
import styled from 'styled-components';

import { LazyBar } from '@/components/charts';
import { createCurrencyBarChartOptions } from '@/components/charts';
import { createSingleDatasetBarData } from '@/components/charts';
import Typography from '@/components/ui/Typography/Typography';
import type { Purchase } from '@/utils/purchase/types';
import { calculateReplenishmentTotals } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/shared/utils/replenishmentTotals';

type PurchaseData = Purchase & {
    total?: number | string;
    totalPurchase?: number | string | { value?: number | string };
    provider?: { name?: string } | null;
};

type PurchaseRecord = PurchaseData & {
    data?: PurchaseData;
};

type ProviderTotals = Record<string, { total: number }>;

const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const options = createCurrencyBarChartOptions({
    yAxisTitle: 'Monto de Compras',
    xAxisTitle: 'Proveedor',
    tooltipSeparator: ' ',
});

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

const accumulatePurchaseDataByProvider = (purchases: PurchaseRecord[]): ProviderTotals => {
    return purchases.reduce<ProviderTotals>((acc, purchase) => {
        const purchaseData = purchase.data ?? purchase;
        const providerName = String(purchaseData?.provider?.name ?? '');
        if (!acc[providerName]) {
            acc[providerName] = { total: 0 };
        }
        acc[providerName].total += resolvePurchaseTotal(purchaseData);
        return acc;
    }, {});
};

interface ProviderPurchasesBarChartProps {
    purchases?: PurchaseRecord[];
}

export const ProviderPurchasesBarChart = ({ purchases }: ProviderPurchasesBarChartProps) => {
    const normalizedPurchases = useMemo(() => Array.isArray(purchases) ? purchases : [], [purchases]);

    const purchasesByProvider = useMemo(
        () => accumulatePurchaseDataByProvider(normalizedPurchases),
        [normalizedPurchases],
    );
    const data = useMemo(() => {
        const labels = Object.keys(purchasesByProvider);
        const dataTotals = labels.map((label) => purchasesByProvider[label]?.total ?? 0);

        const chartData = createSingleDatasetBarData({
            labels,
            values: dataTotals,
            datasetLabel: 'Compras',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
        });

        return chartData;
    }, [purchasesByProvider]);

    if (!normalizedPurchases.length) {
        return null;
    }

    return (
        <Container>
            <Typography variant='h3'>Compras Totales por Proveedor</Typography>
            <LazyBar data={data} options={options} />
        </Container>
    )
}

const Container = styled.div`
    display: grid;
    gap: 1em;
    height: 200px;
`;
