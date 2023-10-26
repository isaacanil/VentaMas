import React, { useMemo } from 'react';
import styled from 'styled-components';
import { accumulateMonthlyData } from './utils/accumulateMonthlyData';
import TotalAccumulatedChart from './charts/TotalAccumulatedChart';
import MonthlyExpenseChart from './charts/MonthlyExpenseChart';
import Typography from '../../../../../../../templates/system/Typografy/Typografy';
import { options } from './chartOptions';

export const MonthlyAndAccumulatedExpenseCharts = ({ expenses }) => {
    if (!expenses || !Array.isArray(expenses)) {
        return null;  // or some fallback UI
    }

    const { monthlyData, totalAccumulated } = useMemo(() => accumulateMonthlyData(expenses), [expenses]);
    const labels = useMemo(() => Object.keys(monthlyData), [monthlyData]);

    // Calcular el valor máximo
    const maxMonthly = Math.max(...Object.values(monthlyData));
    const maxScaleValue = Math.max(totalAccumulated, maxMonthly);

    const customOptions = useMemo(() => ({
        ...options,
        scales: {
            ...options.scales,
            y: {
                ...options.scales.y,
                max: maxScaleValue,  // Establecer el valor máximo para el eje y
            },
        },
    }), [maxScaleValue]);

    return (
        <Container>
            <Typography variant='h3'>Gastos Mensuales y Acumulados</Typography>
            <Group>
                <TotalAccumulatedChart totalAccumulated={totalAccumulated} labels={labels} options={customOptions} />
                <MonthlyExpenseChart monthlyData={monthlyData} options={customOptions} />
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
`
