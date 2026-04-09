import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import Typography from '@/components/ui/Typografy/Typografy';
import type { Expense, ExpenseDoc } from '@/utils/expenses/types';

type ExpenseEntry = Expense | ExpenseDoc;

interface CategoryExpenseBarChartProps {
    expenses?: ExpenseEntry[];
}

const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Monto de Gastos',
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
                    let label = context.dataset.label ?? '';
                    if (label) {
                        label += ": " + formatPrice(context.parsed.y ?? 0);
                    }
                    return label;
                },
            }
        }
    }
};

const getExpenseFromEntry = (entry: ExpenseEntry): Expense =>
    'expense' in entry ? entry.expense : entry;

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
    const data = useMemo<ChartData<'bar', number[], string>>(() => {
        const labels = Object.keys(categoryData);
        const dataTotals = labels.map(label => categoryData[label] ?? 0);

        return {
            labels,
            datasets: [
                {
                    label: 'Gastos',
                    data: dataTotals,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                },
            ]
        };
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
