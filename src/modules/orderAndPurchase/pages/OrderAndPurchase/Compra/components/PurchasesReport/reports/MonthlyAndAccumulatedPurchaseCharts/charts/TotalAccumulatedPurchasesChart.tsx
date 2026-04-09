import React from 'react';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';
import type { ChartData, ChartOptions } from 'chart.js';

interface TotalAccumulatedPurchasesChartProps {
    totalAccumulated: number;
    options: ChartOptions<'bar'>;
}

const TotalAccumulatedPurchasesChart = ({ totalAccumulated, options }: TotalAccumulatedPurchasesChartProps) => {
    const data: ChartData<'bar', number[], string> = {
        labels: ['Total Acumulado'],
        datasets: [{
            label: 'Total Acumulado',
            data: [totalAccumulated],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }]
    };

    return (
        <Container>
            <Bar data={data} options={options} />
        </Container>
    )
};

export default TotalAccumulatedPurchasesChart;

const Container = styled.div`
    /* Tu estilización aquí si es necesaria, por ejemplo: */
    width: 100%;
    height: 400px;
`;
