import React, { useMemo } from 'react';
import styled from 'styled-components';

import Typography from '../../../../../../../templates/system/Typografy/Typografy';

import { options } from './chartOptions';
import MonthlyExpenseChart from './charts/MonthlyExpenseChart';
import TotalAccumulatedChart from './charts/TotalAccumulatedChart';
import { accumulateMonthlyData } from './utils/accumulateMonthlyData';

export const MonthlyAndAccumulatedExpenseCharts = ({ expenses }) => {
    const normalizedExpenses = Array.isArray(expenses) ? expenses : [];
    const { monthlyData, totalAccumulated } = useMemo(
        () => accumulateMonthlyData(normalizedExpenses),
        [normalizedExpenses],
    );
    const labels = useMemo(() => Object.keys(monthlyData), [monthlyData]);

    const hasData = normalizedExpenses.length > 0 && labels.length > 0;

    // Calcular el valor máximo
    const maxMonthly =
        labels.length > 0 ? Math.max(...Object.values(monthlyData)) : 0;
    const maxScaleValue = Math.max(totalAccumulated ?? 0, maxMonthly);

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

    if (!hasData) {
        return null;  // or some fallback UI
    }

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
    display: grid;
    height: 400px;
`;
const Group = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1em;
`
