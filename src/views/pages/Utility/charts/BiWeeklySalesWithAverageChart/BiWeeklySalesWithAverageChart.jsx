import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { DateTime } from 'luxon';
import React, { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import styled from 'styled-components';

import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import Typography from '../../../../templates/system/Typografy/Typografy';


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const BiWeeklySalesWithAverageChart = ({ invoices }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup chart instance on unmount
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, []);
    const invoicesByBiWeek = invoices.reduce((acc, sale) => {
        const date = DateTime.fromMillis(sale.data.date.seconds * 1000);
        const biWeekNumber = date.day <= 15 ? '1ra Quincena' : '2da Quincena';
        const key = `${biWeekNumber}/${date.toFormat('MM/yyyy')}`;  // Formato como '1ra Quincena/01/2023', '2da Quincena/01/2023', etc.
        acc[key] = (acc[key] || 0) + sale.data.totalPurchase.value;
        return acc;
    }, {});
    const totalSales = Object.values(invoicesByBiWeek).reduce((sum, value) => sum + value, 0);
    const average = totalSales / Object.keys(invoicesByBiWeek).length;
    const chartData = {
        labels: Object.keys(invoicesByBiWeek),
        datasets: [
            {
                label: 'Ventas por Quincena',
                data: Object.values(invoicesByBiWeek),
                borderColor: 'blue',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                backgroundColor: 'rgba(0, 0, 255, 0.2)',
            },
            {
                type: 'line',
                label: 'Promedio',
                data: Array(Object.keys(invoicesByBiWeek).length).fill(average),
                borderColor: 'red',
                borderDash: [5, 5],
                fill: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Quincena del Año',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Ventas ($)',
                },
            },
        },
        interaction: {
            mode: 'index',
            intersect: false
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
                Ventas por Quincena
            </Typography>
            <Line ref={chartRef} data={chartData} options={options} />
        </Container>
    );
};

export default BiWeeklySalesWithAverageChart;

const Container = styled.div`
 height: 200px;
 width: 100%;
 display: grid;
 gap: 1em;
`;
