import type { JSX } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import styled from 'styled-components';

interface TotalAccumulatedChartProps {
    totalAccumulated: number;
    options: ChartOptions<'bar'>;
    labels?: string[];
}

const TotalAccumulatedChart = ({
    totalAccumulated,
    options,
}: TotalAccumulatedChartProps): JSX.Element => {
    const data: ChartData<'bar', number[], string> = {
        labels: ['Total Acumulado'],
        datasets: [{
            label: 'Total Acumulado',
            data: [totalAccumulated],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
        }]
    };

    return (
        <Container>
            <Bar data={data} options={options} />
        </Container>
    )
};

export default TotalAccumulatedChart;

const Container = styled.div``
