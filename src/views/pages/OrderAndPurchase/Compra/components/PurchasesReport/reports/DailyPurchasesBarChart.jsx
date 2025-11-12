import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import React, { useEffect, useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2'
import styled from 'styled-components';

import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';
import Typography from '../../../../../../templates/system/Typografy/Typografy';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Monto de Compras',
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

const formatDate = (milliseconds, byMonth = false) => {
    const date = new Date(milliseconds);
    return byMonth
        ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
        : date.toLocaleDateString();
};

const accumulatePurchaseData = (purchases, byMonth = false) => {
    return purchases.reduce((acc, purchase) => {
        const date = formatDate(purchase.data.dates.createdAt, byMonth);
        acc[date] = acc[date] || { total: 0 };
        acc[date].total += purchase.data.total;
        return acc;
    }, {});
};
const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
};


export const DailyPurchasesBarChart = ({ purchases }) => {
    if (!purchases || !Array.isArray(purchases)) {
        return null;
    }

    const dateSpan = purchases.reduce(
        (span, purchase) => {
            const date = purchase.data.dates.createdAt;  // Corrección aquí
            span.min = Math.min(span.min, date);
            span.max = Math.max(span.max, date);
            return span;
        },
        { min: Infinity, max: -Infinity }
    );

    const spanInMonths = (dateSpan.max - dateSpan.min) / (1000 * 60 * 60 * 24 * 30);

    const byMonth = spanInMonths > 2;

    const purchasesByDay = useMemo(() => accumulatePurchaseData(purchases, byMonth), [purchases, byMonth]);    const data = useMemo(() => {
        const labels = Object.keys(purchasesByDay)
            .sort((a, b) => parseDate(b) - parseDate(a));
        const dataTotals = labels.map(label => purchasesByDay[label].total);

        return {
            labels,
            datasets: [
                {
                    label: 'Compras',
                    data: dataTotals,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                },
            ]
        };
    }, [purchasesByDay]);

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
        };    }, []);

    return (
        <Container>
            <Typography variant='h3'>Compras Totales por Día</Typography>
            <Bar ref={chartRef} data={data} options={options} />
        </Container>
    )
}
const Container = styled.div`
    height: 200px;
 
    display: grid;
    gap: 1em;
`
