import type { JSX } from 'react';
import { useMemo } from 'react';
import type { ChartOptions } from 'chart.js';
import styled from 'styled-components';

import Typography from '@/components/ui/Typografy/Typografy';
import type { ExpenseDoc } from '@/utils/expenses/types';

import { options } from './chartOptions';
import MonthlyExpenseChart from './charts/MonthlyExpenseChart';
import TotalAccumulatedChart from './charts/TotalAccumulatedChart';
import { accumulateMonthlyData } from './utils/accumulateMonthlyData';

type MonthlyExpenseData = Record<string, number>;

interface AccumulatedExpenseData {
    monthlyData: MonthlyExpenseData;
    totalAccumulated: number;
}

interface MonthlyAndAccumulatedExpenseChartsProps {
    expenses?: ExpenseDoc[] | null;
}

export const MonthlyAndAccumulatedExpenseCharts = ({
    expenses,
}: MonthlyAndAccumulatedExpenseChartsProps): JSX.Element | null => {
    const normalizedExpenses = useMemo<ExpenseDoc[]>(
        () => Array.isArray(expenses) ? expenses : [],
        [expenses]
    );
    const { monthlyData, totalAccumulated } = useMemo<AccumulatedExpenseData>(() => {
        const result = accumulateMonthlyData(
            normalizedExpenses
        ) as Partial<AccumulatedExpenseData> | null;
        return {
            monthlyData: result?.monthlyData ?? {},
            totalAccumulated: result?.totalAccumulated ?? 0,
        };
    }, [normalizedExpenses]);
    const labels = useMemo<string[]>(() => Object.keys(monthlyData), [monthlyData]);

    const hasData = normalizedExpenses.length > 0 && labels.length > 0;

    // Calcular el valor máximo
    const maxMonthly =
        labels.length > 0 ? Math.max(...Object.values(monthlyData)) : 0;
    const maxScaleValue = Math.max(totalAccumulated, maxMonthly);
    const baseOptions: ChartOptions<'bar'> = options;

    const customOptions = useMemo<ChartOptions<'bar'>>(() => ({
        ...baseOptions,
        scales: {
            ...baseOptions.scales,
            y: {
                ...baseOptions.scales?.y,
                max: maxScaleValue,  // Establecer el valor máximo para el eje y
            },
        },
    }), [baseOptions, maxScaleValue]);

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
