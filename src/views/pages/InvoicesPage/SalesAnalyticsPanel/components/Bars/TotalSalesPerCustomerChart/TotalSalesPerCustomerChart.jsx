import { Bar } from 'react-chartjs-2';
import React, { useEffect, useMemo } from 'react';
import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import styled from 'styled-components';
import Typography from '../../../../../../templates/system/Typografy/Typografy';
import { GenericCustomerSalesChart } from './Bars/GenericCustomerSalesChart';
import { TopSpendingCustomersChart } from './Bars/TopSpendingCustomersChart';

export const TotalSalesPerCustomerChart = ({ sales }) => {
    if (!sales || !Array.isArray(sales)) {
        return null;  // or some fallback UI
    }

    return (
        <Container>
            <Typography variant='h2'>
                Ventas Totales por Cliente
            </Typography>
            <Group>
                <GenericCustomerSalesChart sales={sales} />
                <TopSpendingCustomersChart sales={sales} />
            </Group>
        </Container>
    );
};

const Container = styled.div`
    
    display: grid;
    align-items: start;
    align-content: start;
    
    gap: 1em;
`;
const Group = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: end;
  gap: 1em;
`
