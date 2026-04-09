import type { JSX } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import styled from 'styled-components';

interface MonthlyExpenseChartProps {
    monthlyData: Record<string, number>;
    options: ChartOptions<'bar'>;
}

const MonthlyExpenseChart = ({
    monthlyData,
    options,
}: MonthlyExpenseChartProps): JSX.Element => {
    const labels = Object.keys(monthlyData);
    const dataMonthly = labels.map(label => monthlyData[label] ?? 0);
    const data: ChartData<'bar', number[], string> = {
        labels,
        datasets: [{
            label: 'Total por Mes',
            data: dataMonthly,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }]
    };

    return (
        <Container>
            <Bar data={data} options={options} />

        </Container>
    );
};

export default MonthlyExpenseChart;
const Container = styled.div``
