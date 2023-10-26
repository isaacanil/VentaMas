import React from 'react';
import { Line } from 'react-chartjs-2';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import Typography from '../../../../templates/system/Typografy/Typografy';
import styled from 'styled-components';
import { DateTime } from 'luxon';

const DailySalesWithAverageChart = ({ invoices }) => {
    const invoicesByDate = invoices.reduce((acc, sale) => {
        const date = DateTime.fromMillis(sale.data.date.seconds * 1000).toFormat('dd/MM/yyyy');  // Cambia el formato según lo necesites
        acc[date] = (acc[date] || 0) + sale.data.totalPurchase.value;
        return acc;
    }, {});
    const totalSales = Object.values(invoicesByDate).reduce((sum, value) => sum + value, 0);
    const average = totalSales / Object.keys(invoicesByDate).length;
    const chartData = {
        labels: Object.keys(invoicesByDate),  // asume que 'data' es un objeto donde las claves son fechas y los valores son totales de ventas
        datasets: [
            {
                label: 'Ventas por Día',
                data: Object.values(invoicesByDate),
                borderColor: 'blue',
                borderWidth: 2,
                fill: false,
                // tension: 0.4,
                backgroundColor: 'rgba(0, 0, 255, 0.2)',
            },
            {
                type: 'line',
                label: 'Promedio',
                data: Array(Object.keys(invoicesByDate).length).fill(average),  // 'average' es el promedio de ventas
                borderColor: 'red',
                borderDash: [5, 5],
                fill: false,
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

            x: {
                title: {
                    display: true,
                    text: 'Fecha',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Ventas ($)',
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

    return (
        <Container>
            <Typography variant='h3'>
                Ventas por Día
            </Typography>
            <Line data={chartData} options={options} />
        </Container>
    );
};

export default DailySalesWithAverageChart;

const Container = styled.div`
 height: 200px;
 width: 100%;
 display: grid;
 gap: 1em;
`