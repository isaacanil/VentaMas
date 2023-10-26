import React, { useMemo } from 'react';
import styled from 'styled-components';
import { accumulatePurchaseData } from './utils/accumulatePurchaseData';
import TotalAccumulatedPurchaseChart from './charts/TotalAccumulatedPurchasesChart';
import MonthlyPurchasesChart from './charts/MonthlyPurchasesChart';
import { options } from './chartOptions';
import Typography from '../../../../../../../templates/system/Typografy/Typografy';

export const MonthlyAndAccumulatedPurchaseCharts = ({ purchases }) => {
    if (!purchases || !Array.isArray(purchases)) {
        return null;
    }

    const { monthlyData, totalAccumulated } = useMemo(() => accumulatePurchaseData(purchases), [purchases]);
    const labels = useMemo(() => Object.keys(monthlyData), [monthlyData]);

    const maxMonthly = Math.max(...Object.values(monthlyData));
    const maxScaleValue = Math.max(totalAccumulated, maxMonthly);

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
    height: 400px;
    display: grid;
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1em;
`;
