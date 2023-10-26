import React from 'react';
import { Bar } from 'react-chartjs-2';
// import { options } from '../chartOptions';
import styled from 'styled-components';

const MonthlyExpenseChart = ({ monthlyData, options }) => {
    const labels = Object.keys(monthlyData);
    const dataMonthly = labels.map(label => monthlyData[label]);
    const data = {
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