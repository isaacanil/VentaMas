import type { JSX } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import styled from 'styled-components';

import { createSingleDatasetBarData } from '@/components/charts';

interface TotalAccumulatedChartProps {
    totalAccumulated: number;
    options: ChartOptions<'bar'>;
    labels?: string[];
}

const TotalAccumulatedChart = ({
    totalAccumulated,
    options,
}: TotalAccumulatedChartProps): JSX.Element => {
    const data = createSingleDatasetBarData({
        labels: ['Total Acumulado'],
        values: [totalAccumulated],
        datasetLabel: 'Total Acumulado',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
    });

    return (
        <Container>
            <Bar data={data} options={options} />
        </Container>
    )
};

export default TotalAccumulatedChart;

const Container = styled.div``
