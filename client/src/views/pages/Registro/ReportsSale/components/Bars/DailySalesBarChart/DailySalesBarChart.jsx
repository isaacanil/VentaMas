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
                text: 'Monto de Ventas',
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
        ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
        : date.toLocaleDateString();
};


const accumulateSalesData = (sales, byMonth = false) => {
    return sales.reduce((acc, sale) => {

        const date = formatDate(sale.data.date.seconds, byMonth);
        acc[date] = acc[date] || { total: 0, taxes: 0, invoices: 0, products: 0, discounts: 0, cash: 0, card: 0, transfer: 0 };
        acc[date].total += sale.data.totalPurchase.value;

        acc[date].invoices += 1;
        acc[date].products += sale.data.totalShoppingItems.value;
        acc[date].discounts += sale?.data?.discount?.value;
        const paymentValue = sale.data?.payment?.value;
        sale.data.paymentMethod.forEach(method => {
            if (method.status) {
                switch (method.method) {
                    case 'cash':
                        acc[date].cash += paymentValue;
                        break;
                    case 'card':
                        acc[date].card += paymentValue;
                        break;
                    case 'transfer':
                        acc[date].transfer += paymentValue;
                        break;
                    default:
                        break;
                }
            }
        });
        return acc;
    }, {});
};
export const DailySalesBarChart = ({ sales }) => {
    if (!sales || !Array.isArray(sales)) {
        return null;  // or some fallback UI
    }

    const dateSpan = sales.reduce(
        (span, sale) => {
            const date = sale.data.date.seconds * 1000;
            span.min = Math.min(span.min, date);
            span.max = Math.max(span.max, date);
            return span;
        },
        { min: Infinity, max: -Infinity }
    );

    const spanInMonths = (dateSpan.max - dateSpan.min) / (1000 * 60 * 60 * 24 * 30);

    const byMonth = spanInMonths > 2;

    const salesByDay = useMemo(() => accumulateSalesData(sales, byMonth), [sales, byMonth]);
    const data = useMemo(() => {
        const labels = Object.keys(salesByDay);
        const dataTotals = labels.map(label => salesByDay[label].total);
        const dataCash = labels.map(label => salesByDay[label].cash);
        const dataCard = labels.map(label => salesByDay[label].card);
        const dataTransfer = labels.map(label => salesByDay[label].transfer);

        return {
            labels,
            datasets: [
                {
                    label: 'Efectivo',
                    data: dataCash,
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1,
                    stack: 'Stack 1',
                },
                {
                    label: 'Tarjeta',
                    data: dataCard,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    stack: 'Stack 1',
                },
                {
                    label: 'Transferencia',
                    data: dataTransfer,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                    stack: 'Stack 1'
                }
            ]
        };
    }, [salesByDay]);

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

    return (
        <Container>
            <Typography variant='h3'>Ventas Totales por Día y Método de Pago</Typography>
            <Bar ref={chartRef} data={data} options={options} />
        </Container>
    )
}
const Container = styled.div`
    height: 200px;
 
    display: grid;
    gap: 1em;
`