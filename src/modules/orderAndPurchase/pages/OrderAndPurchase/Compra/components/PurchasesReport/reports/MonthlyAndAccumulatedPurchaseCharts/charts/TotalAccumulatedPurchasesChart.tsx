import styled from 'styled-components';
import type { ChartOptions } from 'chart.js';

import { LazyBar } from '@/components/charts';
import { createSingleDatasetBarData } from '@/components/charts';

interface TotalAccumulatedPurchasesChartProps {
    totalAccumulated: number;
    options: ChartOptions<'bar'>;
}

const TotalAccumulatedPurchasesChart = ({ totalAccumulated, options }: TotalAccumulatedPurchasesChartProps) => {
    const data = createSingleDatasetBarData({
        labels: ['Total Acumulado'],
        values: [totalAccumulated],
        datasetLabel: 'Total Acumulado',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
    });

    return (
        <Container>
            <LazyBar data={data} options={options} />
        </Container>
    )
};

export default TotalAccumulatedPurchasesChart;

const Container = styled.div`
    /* Tu estilización aquí si es necesaria, por ejemplo: */
    width: 100%;
    height: 400px;
`;
