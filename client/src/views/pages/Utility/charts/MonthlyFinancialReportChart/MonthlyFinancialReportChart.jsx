import React from 'react'
import { Line } from 'react-chartjs-2';
import { getTotalSalesPerMonth, getTotalExpensesPerMonth } from './utils.js';

import styled from 'styled-components';
import Typography from '../../../../templates/system/Typografy/Typografy.jsx';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice.js';


export const MonthlyFinancialReportChart = ({ expenses, invoices }) => {
    const salesPerMonth = getTotalSalesPerMonth(invoices);
    const expensesPerMonth = getTotalExpensesPerMonth(expenses);
    const allMonths = [...new Set([...Object.keys(salesPerMonth), ...Object.keys(expensesPerMonth)])].sort();
    const salesData = allMonths.map(month => salesPerMonth[month] || 0);
    const expensesData = allMonths.map(month => expensesPerMonth[month] || 0);
    const data = {
        labels: allMonths,
        datasets: [
            {
                label: 'Ventas',
                data: salesData,
                borderColor: 'rgb(75, 192, 192)',
                fill: true,
                backgroundColor: 'blue',
                tension: 0.1,
            },
            {
                label: 'Gastos',
                data: expensesData,
                borderColor: 'rgb(255, 99, 132)',
                fill: true,
                backgroundColor: 'red',
                tension: 0.1,
            },
        ],
    };
    const options = {
  
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
          },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Ventas ($)',
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Meses',
                },
            },
        },
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += " " + useFormatPrice(context.parsed.y);
                        }
                        return label;
                    }
                }
            },

        }
    }

    return (
        <Container>
            <Typography variant='h3'>Finanzas Mensuales: Ventas, Gastos, Utilidad</Typography>
            <Line data={data} options={options} />
        </Container>
    );
}

const Container = styled.div`
 height: 200px;
 width: 100%;
 display: grid;
 gap: 1em;
`;
