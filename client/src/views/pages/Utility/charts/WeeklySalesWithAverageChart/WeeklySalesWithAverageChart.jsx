import React from 'react';
import { Line } from 'react-chartjs-2';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import Typography from '../../../../templates/system/Typografy/Typografy';
import styled from 'styled-components';
import { DateTime } from 'luxon';

const WeeklySalesWithAverageChart = ({ invoices }) => {
    const invoicesByWeek = invoices.reduce((acc, sale) => {
        const weekNumber = DateTime.fromMillis(sale.data.date.seconds * 1000).toFormat('WW/yyyy');  // Obtén el número de semana y año
        acc[weekNumber] = (acc[weekNumber] || 0) + sale.data.totalPurchase.value;
        return acc;
    }, {});
    const totalSales = Object.values(invoicesByWeek).reduce((sum, value) => sum + value, 0);
    const average = totalSales / Object.keys(invoicesByWeek).length;
    const chartData = {
        labels: Object.keys(invoicesByWeek),  // Etiquetas de semana y año como '01/2023', '02/2023', etc.
        datasets: [
            {
                label: 'Ventas por Semana',
                data: Object.values(invoicesByWeek),
                borderColor: 'blue',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                backgroundColor: 'rgba(0, 0, 255, 0.2)',
            },
            {
                type: 'line',
                label: 'Promedio',
                data: Array(Object.keys(invoicesByWeek).length).fill(average),
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
                    text: 'Semana del Año',
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
                            label += ": " + useFormatPrice(context.parsed.y);
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
                Ventas por Semana
            </Typography>
            <Line data={chartData} options={options} />
        </Container>
    );
};

export default WeeklySalesWithAverageChart;

const Container = styled.div`
 height: 200px;
 width: 100%;
 display: grid;
 gap: 1em;
`;
