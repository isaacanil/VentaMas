import { Bar } from 'react-chartjs-2';
import React, { useEffect, useMemo } from 'react';
import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import styled from 'styled-components';
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
                text: 'Descuentos ($)',
            },
        },
        x: {
            title: {
                display: true,
                text: 'Fecha',
            },
        },
    },
    
};

const formatDate = (seconds, byMonth = false) => {
    const date = new Date(seconds * 1000);
    return byMonth
        ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
        : date.toLocaleDateString();
};

const accumulateDiscountsData = (sales, byMonth = false) => {
    return sales.reduce((acc, sale) => {
        const date = formatDate(sale.data.date.seconds, byMonth);
        acc[date] = (acc[date] || 0) + sale?.data?.discount?.value;
        return acc;
    }, {});
};

export const DiscountsGivenBarChart = ({ sales }) => {
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

    const discountsByDate = useMemo(() => accumulateDiscountsData(sales, byMonth), [sales, byMonth]);

    const data = useMemo(() => {
        const labels = Object.keys(discountsByDate);
        const dataTotals = labels.map(label => discountsByDate[label]);

        return {
            labels,
            datasets: [{
                label: 'Descuentos ($)',
                data: dataTotals,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            }]
        };
    }, [discountsByDate]);

    return (
        <Container>
            <Typography variant='h3'>Descuentos Otorgados</Typography>
            <Bar data={data} options={options} />
        </Container>
    );
};

const Container = styled.div`
    height: 200px;
    display: grid;
    gap: 1em;
`;
