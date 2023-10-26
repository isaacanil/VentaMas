import React, { useMemo } from 'react';
import { Bar,  Line } from 'react-chartjs-2';
import styled from 'styled-components';
import Typography from '../../../../../../templates/system/Typografy/Typografy';
import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';
import { LineElement, PointElement, BarElement } from 'chart.js';
import {Chart} from 'chart.js';
// Registrar los elementos Line, Point y Bar
Chart.register(LineElement, PointElement, BarElement);

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
                text: 'Mes',
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

const accumulateMonthlyData = (expenses) => {
    const monthlyData = {};
    let totalAccumulated = 0;

    for (let { expense } of expenses) {
        const date = new Date(expense.dates.expenseDate);
        const monthYear = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + expense.amount;
        totalAccumulated += expense.amount;
    }

    return { monthlyData, totalAccumulated };
};

export const MonthlyExpenseBarChart = ({ expenses }) => {
    if (!expenses || !Array.isArray(expenses)) {
        return null;  // or some fallback UI
    }

    const { monthlyData, totalAccumulated } = useMemo(() => accumulateMonthlyData(expenses), [expenses]);
    const data = useMemo(() => {
        const labels = Object.keys(monthlyData);
        const dataMonthly = labels.map(label => monthlyData[label]);
        const dataAccumulated = labels.map(() => totalAccumulated);

        return {
            labels,
            datasets: [
                {
                    type: 'line',  // especifica el tipo de gráfico para este dataset
                    label: 'Total Acumulado',
                    data: dataAccumulated,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    fill: false,
                },
                {
                    type: 'bar',  // especifica el tipo de gráfico para este dataset
                    label: 'Total por Mes',
                    data: dataMonthly,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                },
            ]
        };
    }, [monthlyData, totalAccumulated]);

    return (
        <Container>
            <Typography variant='h3'>Gastos Totales Acumulados y por Mes</Typography>
            <Line data={data} options={options} />  
        </Container>
    )
}

const Container = styled.div`
    height: 200px;
    display: grid;
    gap: 1em;
`;
