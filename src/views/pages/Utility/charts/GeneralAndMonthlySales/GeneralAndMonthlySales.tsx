// @ts-nocheck
import React from 'react';
import styled from 'styled-components';

import Typography from '@/views/templates/system/Typografy/Typografy';

import MonthlySalesChart from './charts/MonthlySalesChart';
import TotalSalesChart from './charts/TotalSalesChart';

const GeneralAndMonthlySales = ({ invoices }) => {
  const totalSales = invoices.reduce(
    (sum, invoice) => sum + invoice.data.totalPurchase.value,
    0,
  );

  return (
    <Container>
      <Typography variant="h3">
        Tendencia de Ventas Mensuales y Resumen Total
      </Typography>
      <Group>
        <TotalSalesChart totalSales={totalSales} />
        <MonthlySalesChart invoices={invoices} />
      </Group>
    </Container>
  );
};

export default GeneralAndMonthlySales;

const Container = styled.div`
  display: grid;
  height: 200px;
`;
const Group = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1em;
`;
