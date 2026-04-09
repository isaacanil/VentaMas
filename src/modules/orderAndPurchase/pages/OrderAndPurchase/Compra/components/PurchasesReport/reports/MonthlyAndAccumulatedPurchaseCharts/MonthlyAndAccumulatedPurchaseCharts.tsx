import React, { useMemo } from 'react';
import styled from 'styled-components';
import type { ChartOptions } from 'chart.js';

import Typography from '@/components/ui/Typografy/Typografy';
import type { Purchase } from '@/utils/purchase/types';
import { calculateReplenishmentTotals } from '@/utils/order/totals';

import { options } from './chartOptions';
import MonthlyPurchasesChart from './charts/MonthlyPurchasesChart';
import TotalAccumulatedPurchaseChart from './charts/TotalAccumulatedPurchasesChart';
import { accumulatePurchaseData } from './utils/accumulatePurchaseData';

type PurchaseData = Purchase & {
    total?: number | string;
    totalPurchase?: number | string | { value?: number | string };
};

type PurchaseRecord = PurchaseData & {
    data?: PurchaseData;
};

type MonthlyData = Record<string, number>;

interface AccumulatedPurchaseData {
    monthlyData: MonthlyData;
    totalAccumulated: number;
}

interface MonthlyAndAccumulatedPurchaseChartsProps {
    purchases?: PurchaseRecord[];
}

const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const resolvePurchaseTotal = (purchaseData: PurchaseData): number => {
    const directCandidates: Array<number> = [];
    directCandidates.push(toNumber(purchaseData.total));
    if (purchaseData.totalPurchase && typeof purchaseData.totalPurchase === 'object') {
        const withValue = purchaseData.totalPurchase as { value?: number | string };
        directCandidates.push(toNumber(withValue.value));
    } else {
        directCandidates.push(toNumber(purchaseData.totalPurchase));
    }
    const directTotal = directCandidates.find((value) => value > 0);
    if (directTotal !== undefined) return directTotal;
    const totals = calculateReplenishmentTotals(purchaseData.replenishments || []);
    return toNumber(totals.grandTotal);
};

const normalizePurchaseForAccumulation = (purchase: PurchaseRecord): PurchaseRecord => {
    const purchaseData = purchase.data ?? purchase;
    const total = resolvePurchaseTotal(purchaseData);
    return {
        ...purchase,
        data: {
            ...purchaseData,
            total,
        },
    };
};

export const MonthlyAndAccumulatedPurchaseCharts = ({ purchases }: MonthlyAndAccumulatedPurchaseChartsProps) => {
    const normalizedPurchases = useMemo(
        () => (Array.isArray(purchases) ? purchases : []),
        [purchases],
    );

    const purchasesForAccumulation = useMemo(
        () => normalizedPurchases.map(normalizePurchaseForAccumulation),
        [normalizedPurchases],
    );

    const { monthlyData, totalAccumulated } = useMemo<AccumulatedPurchaseData>(() => {
        const result = accumulatePurchaseData(purchasesForAccumulation) as Partial<AccumulatedPurchaseData> | null;
        const safeMonthlyData: MonthlyData = {};
        if (result?.monthlyData && typeof result.monthlyData === 'object') {
            Object.entries(result.monthlyData as Record<string, unknown>).forEach(([key, value]) => {
                safeMonthlyData[key] = toNumber(value);
            });
        }
        return {
            monthlyData: safeMonthlyData,
            totalAccumulated: toNumber(result?.totalAccumulated),
        };
    }, [purchasesForAccumulation]);

    const labels = useMemo(() => Object.keys(monthlyData), [monthlyData]);

    const hasData = normalizedPurchases.length > 0 && labels.length > 0;

    const maxMonthly = labels.length > 0 ? Math.max(...Object.values(monthlyData)) : 0;
    const safeTotalAccumulated = Number.isFinite(totalAccumulated) ? totalAccumulated : 0;
    const maxScaleValue = Math.max(safeTotalAccumulated, maxMonthly);
    const baseOptions = options as ChartOptions<'bar'>;

    const customOptions = useMemo<ChartOptions<'bar'>>(() => ({
        ...baseOptions,
        scales: {
            ...baseOptions.scales,
            y: {
                ...(baseOptions.scales?.y || {}),
                max: maxScaleValue,
            },
        },
    }), [baseOptions, maxScaleValue]);

    if (!hasData) {
        return null;
    }

    return (
        <Container>
            <Typography variant='h3'>Compras Mensuales y Acumuladas</Typography>
            <Group>
                <TotalAccumulatedPurchaseChart totalAccumulated={safeTotalAccumulated} options={customOptions} />
                <MonthlyPurchasesChart monthlyData={monthlyData} options={customOptions} />
            </Group>
        </Container>
    );
};

const Container = styled.div`
    display: grid;
    height: 400px;
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1em;
`;
