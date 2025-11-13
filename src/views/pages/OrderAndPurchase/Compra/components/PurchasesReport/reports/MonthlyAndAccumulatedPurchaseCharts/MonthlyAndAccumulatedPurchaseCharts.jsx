import React, { useMemo } from 'react';
import styled from 'styled-components';

import Typography from '../../../../../../../templates/system/Typografy/Typografy';

import { options } from './chartOptions';
import MonthlyPurchasesChart from './charts/MonthlyPurchasesChart';
import TotalAccumulatedPurchaseChart from './charts/TotalAccumulatedPurchasesChart';
import { accumulatePurchaseData } from './utils/accumulatePurchaseData';


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
    display: grid;
    height: 400px;
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1em;
`;
