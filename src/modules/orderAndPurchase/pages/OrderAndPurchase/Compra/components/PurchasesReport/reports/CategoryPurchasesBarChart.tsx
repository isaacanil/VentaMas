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
import type { Purchase, PurchaseReplenishment } from '@/utils/purchase/types';
import { calculateReplenishmentTotals } from '@/utils/order/totals';

ChartJS.register(LinearScale, CategoryScale, BarElement, Tooltip);

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
                text: 'Categoría',
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

        const chartData: ChartData<'bar', number[], string> = {
            labels,
            datasets: [
                {
                    label: 'Compras',
                    data: dataTotals,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                },
            ],
        };

        return chartData;
    }, [purchasesByCategory]);

    const chartRef = useRef<ChartJS<'bar', number[], string> | null>(null);

    if (!normalizedPurchases.length) {
        return null;
    }

    return (
        <Container>
            <Typography variant='h3'>Compras Totales por Categoría</Typography>
            <Bar ref={chartRef} data={data} options={options} />
        </Container>
    )
}

const Container = styled.div`
    display: grid;
    gap: 1em;
    height: 200px;
`;
