import { Bar } from 'react-chartjs-2'
import React, { useEffect, useMemo, useRef } from 'react';
import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import styled from 'styled-components';
import Typography from '../../../../../../templates/system/Typografy/Typografy';
import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

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
                text: 'Fecha',
            },
        },
    },
    plugins: {
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
        }
    }
};

const formatDate = (seconds, byMonth = false) => {
    const date = new Date(seconds * 1000);
    return byMonth
        ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
        : date.toLocaleDateString();
};



const accumulateExpenseData = (expenses, byMonth = false) => {
    return expenses.reduce((acc, { expense }) => {  // Destructura para obtener la propiedad expense
        const date = formatDate(expense.dates.expenseDate, byMonth);  // Acceso actualizado
        acc[date] = acc[date] || { total: 0 };
        acc[date].total += expense.amount;  // Acceso actualizado
        return acc;
    }, {});
};


export const DailyExpenseBarChart = ({ expenses }) => {
    if (!expenses || !Array.isArray(expenses)) {
        return null;  // or some fallback UI
    }

    const dateSpan = expenses.reduce(
        (span, expense) => {
            const date = expense.dateExpense;
            span.min = Math.min(span.min, date);
            span.max = Math.max(span.max, date);
            return span;
        },
        { min: Infinity, max: -Infinity }
    );

    const spanInMonths = (dateSpan.max - dateSpan.min) / (1000 * 60 * 60 * 24 * 30);

    const byMonth = spanInMonths > 2;

    const expensesByDay = useMemo(() => accumulateExpenseData(expenses, byMonth), [expenses, byMonth]);
    const data = useMemo(() => {
        const labels = Object.keys(expensesByDay);
        const dataTotals = labels.map(label => expensesByDay[label].total);
        
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
    }, [expensesByDay]);

    const chartRef = useRef(null);

    useEffect(() => {
        return () => {
            if (chartRef.current && chartRef.current instanceof Chart) {
                chartRef.current.destroy();
            }
        };
    }, []);
    useEffect(() => {
        return () => {
            if (chartRef.current && chartRef.current instanceof Chart) {
                chartRef.current.destroy();
            }
        };
    }, []);
    console.log(expenses)

    return (
        <Container>
             <Typography variant='h3'>Gastos Totales por Día</Typography>
            <Bar ref={chartRef} data={data} options={options} />
        </Container>
    )
}
const Container = styled.div`
    height: 200px;
 
    display: grid;
    gap: 1em;
`