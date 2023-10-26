import React from 'react';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';


const MonthlyPurchasesChart = ({ monthlyData, options }) => {
    const labels = Object.keys(monthlyData);
    const dataMonthly = labels.map(label => monthlyData[label]);
    const data = {
        labels,
        datasets: [{
            label: 'Total por Mes',
            data: dataMonthly,
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1,
        }]
    };

    return (
        <Container>
            <Bar data={data} options={options} />
        </Container>
    );
};

export default MonthlyPurchasesChart;

const Container = styled.div`
    // Tu estilización aquí si es necesaria, por ejemplo:
    width: 100%;
    height: 400px;
`;
