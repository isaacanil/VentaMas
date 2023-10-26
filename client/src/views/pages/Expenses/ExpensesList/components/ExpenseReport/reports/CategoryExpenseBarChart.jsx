import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';
import Typography from '../../../../../../templates/system/Typografy/Typografy';
import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';

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
                        label += ": " + useFormatPrice(context.parsed.y);
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
    if (!expenses || !Array.isArray(expenses)) {
        return null;  // or some fallback UI
    }

    const categoryData = useMemo(() => accumulateCategoryData(expenses), [expenses]);
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

    return (
        <Container>
            <Typography variant='h3'>Gastos Totales por Categoría</Typography>
            <Bar data={data} options={options} />
        </Container>
    )
}

const Container = styled.div`
    height: 200px;
    display: grid;
    gap: 1em;
`;
