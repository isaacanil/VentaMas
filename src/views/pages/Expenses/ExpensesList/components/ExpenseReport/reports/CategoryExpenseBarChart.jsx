import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';

import Typography from '../../../../../../templates/system/Typografy/Typografy';

import { formatPrice } from '@/utils/format';

const options = {
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
                label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ": " + formatPrice(context.parsed.y);
                    }
                    return label;
                }
            }
        }
    }
};

const accumulateCategoryData = (expenses) => {
    return expenses.reduce((acc, { expense }) => {
        const category = expense.category;
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
    }, {});
};

export const CategoryExpenseBarChart = ({ expenses }) => {
    const normalizedExpenses = Array.isArray(expenses) ? expenses : [];
    const categoryData = useMemo(
        () => accumulateCategoryData(normalizedExpenses),
        [normalizedExpenses],
    );
    const data = useMemo(() => {
        const labels = Object.keys(categoryData);
        const dataTotals = labels.map(label => categoryData[label]);

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
