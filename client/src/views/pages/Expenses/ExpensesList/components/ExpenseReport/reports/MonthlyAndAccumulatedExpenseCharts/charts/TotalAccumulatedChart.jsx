import React from 'react';
import { Bar } from 'react-chartjs-2';
// import { options } from '../chartOptions';
import styled from 'styled-components';

const TotalAccumulatedChart = ({ totalAccumulated, options }) => {
    const data = {
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