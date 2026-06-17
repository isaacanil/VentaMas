import styled from 'styled-components';
import type { ChartOptions } from 'chart.js';

import { LazyBar } from '@/components/charts';
import { createSingleDatasetBarData } from '@/components/charts';

interface MonthlyPurchasesChartProps {
    monthlyData: Record<string, number>;
    options: ChartOptions<'bar'>;
}

const MonthlyPurchasesChart = ({ monthlyData, options }: MonthlyPurchasesChartProps) => {
    const labels = Object.keys(monthlyData);
    const dataMonthly = labels.map((label) => monthlyData[label]);
    const data = createSingleDatasetBarData({
        labels,
        values: dataMonthly,
        datasetLabel: 'Total por Mes',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)',
    });

    return (
        <Container>
            <LazyBar data={data} options={options} />
        </Container>
    );
};

export default MonthlyPurchasesChart;

const Container = styled.div`
    /* Tu estilización aquí si es necesaria, por ejemplo: */
    width: 100%;
    height: 400px;
`;
