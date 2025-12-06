import React from 'react';
import styled from 'styled-components';

import Typography from '../../../../../../templates/system/Typografy/Typografy';

import { GenericCustomerSalesChart } from './Bars/GenericCustomerSalesChart';
import { TopSpendingCustomersChart } from './Bars/TopSpendingCustomersChart';

export const TotalSalesPerCustomerChart = ({ sales }) => {
  if (!sales || !Array.isArray(sales)) {
    return null; // or some fallback UI
  }

  return (
    <Container>
      <Typography variant="h2">Ventas Totales por Cliente</Typography>
      <Group>
        <GenericCustomerSalesChart sales={sales} />
        <TopSpendingCustomersChart sales={sales} />
      </Group>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
  align-content: start;
  align-items: start;
`;
const Group = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1em;
  align-items: end;
`;
