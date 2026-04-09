import {
    LinearScale,
    CategoryScale,
    BarElement,
    Chart as ChartJS,
    Tooltip,
    type ChartData,
    type ChartOptions,
    type TooltipItem,
} from "chart.js";
import React, { useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import Typography from '@/components/ui/Typografy/Typografy';
import type { Purchase } from '@/utils/purchase/types';
import { calculateReplenishmentTotals } from '@/utils/order/totals';

ChartJS.register(LinearScale, CategoryScale, BarElement, Tooltip);

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

const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Monto de Compras',
            },
        },
        x: {
            title: {
                display: true,
                text: 'Proveedor',
            },
        },
    },
    plugins: {
        tooltip: {
            callbacks: {
                label: (context: TooltipItem<'bar'>) => {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += " " + formatPrice(context.parsed.y);
                    }
                    return label;
                },
            },
        },
    },
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

        const chartData: ChartData<'bar', number[], string> = {
            labels,
            datasets: [
                {
                    label: 'Compras',
                    data: dataTotals,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        };

        return chartData;
    }, [purchasesByProvider]);

    const chartRef = useRef<ChartJS<'bar', number[], string> | null>(null);

    if (!normalizedPurchases.length) {
        return null;
    }

    return (
        <Container>
            <Typography variant='h3'>Compras Totales por Proveedor</Typography>
            <Bar ref={chartRef} data={data} options={options} />
        </Container>
    )
}

const Container = styled.div`
    display: grid;
    gap: 1em;
    height: 200px;
`;
