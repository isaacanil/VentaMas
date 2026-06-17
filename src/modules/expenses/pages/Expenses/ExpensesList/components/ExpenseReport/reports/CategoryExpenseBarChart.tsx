import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';

import { createCurrencyBarChartOptions } from '@/components/charts';
import { createSingleDatasetBarData } from '@/components/charts';
import Typography from '@/components/ui/Typography';
import type { Expense, ExpenseDoc } from '@/utils/expenses/types';

type ExpenseEntry = Expense | ExpenseDoc;

interface CategoryExpenseBarChartProps {
    expenses?: ExpenseEntry[];
}

const options = createCurrencyBarChartOptions({
    yAxisTitle: 'Monto de Gastos',
    xAxisTitle: 'Categoría',
});

const getExpenseFromEntry = (entry: ExpenseEntry): Expense =>
    'expense' in entry ? (entry.expense as Expense) : entry;

const coerceExpenseAmount = (amount: Expense['amount']): number => {
    const value = typeof amount === 'number' ? amount : Number(amount);
    return Number.isFinite(value) ? value : 0;
};

const accumulateCategoryData = (expenses: ExpenseEntry[]): Record<string, number> => {
    return expenses.reduce<Record<string, number>>((acc, entry) => {
        const expense = getExpenseFromEntry(entry);
        const categoryKey = expense.category ?? 'undefined';
        acc[categoryKey] = (acc[categoryKey] ?? 0) + coerceExpenseAmount(expense.amount);
        return acc;
    }, {});
};

export const CategoryExpenseBarChart = ({ expenses }: CategoryExpenseBarChartProps) => {
    const normalizedExpenses = useMemo(
        () => (Array.isArray(expenses) ? expenses : []),
        [expenses]
    );
    const categoryData = useMemo(
        () => accumulateCategoryData(normalizedExpenses),
        [normalizedExpenses],
    );
    const data = useMemo(() => {
        const labels = Object.keys(categoryData);
        const dataTotals = labels.map(label => categoryData[label] ?? 0);

        return createSingleDatasetBarData({
            labels,
            values: dataTotals,
            datasetLabel: 'Gastos',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
        });
    }, [categoryData]);

    if (!normalizedExpenses.length) {
        return null;  // or some fallback UI
    }

    return (
        <Container>
            <Typography variant='h3'>Gastos Totales por Categoría</Typography>
            <Bar data={data} options={options} />
        </Container>
    )
}

const Container = styled.div`
    display: grid;
    gap: 1em;
    height: 200px;
`;
