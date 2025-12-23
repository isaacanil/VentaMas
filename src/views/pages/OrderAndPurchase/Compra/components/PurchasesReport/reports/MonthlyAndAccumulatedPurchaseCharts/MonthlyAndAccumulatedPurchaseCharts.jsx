import React, { useMemo } from 'react';
import styled from 'styled-components';

import Typography from '@/views/templates/system/Typografy/Typografy';

import { options } from './chartOptions';
import MonthlyPurchasesChart from './charts/MonthlyPurchasesChart';
import TotalAccumulatedPurchaseChart from './charts/TotalAccumulatedPurchasesChart';
import { accumulatePurchaseData } from './utils/accumulatePurchaseData';


export const MonthlyAndAccumulatedPurchaseCharts = ({ purchases }) => {
    const normalizedPurchases = useMemo(() => Array.isArray(purchases) ? purchases : [], [purchases]);

    const { monthlyData, totalAccumulated } = useMemo(
        () => accumulatePurchaseData(normalizedPurchases),
        [normalizedPurchases],
    );
    const labels = useMemo(() => Object.keys(monthlyData), [monthlyData]);

    const hasData = normalizedPurchases.length > 0 && labels.length > 0;

    const maxMonthly =
        labels.length > 0 ? Math.max(...Object.values(monthlyData)) : 0;
    const maxScaleValue = Math.max(totalAccumulated ?? 0, maxMonthly);

    const customOptions = useMemo(() => ({
        ...options,
        scales: {
            ...options.scales,
            y: {
                ...options.scales.y,
                max: maxScaleValue,
            },
        },
    }), [maxScaleValue]);

    if (!hasData) {
        return null;
    }

    return (
        <Container>
            <Typography variant='h3'>Compras Mensuales y Acumuladas</Typography>
            <Group>
                <TotalAccumulatedPurchaseChart totalAccumulated={totalAccumulated} labels={labels} options={customOptions} />
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
