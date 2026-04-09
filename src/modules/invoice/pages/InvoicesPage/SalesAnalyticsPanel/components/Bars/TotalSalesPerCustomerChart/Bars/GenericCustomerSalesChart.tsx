import React, { useMemo } from 'react';
import type { SalesRecord } from '../../../../utils';
import { toNumber } from '../../../../utils';
import { LazyBar } from '@/components/charts/LazyCharts';
import styled from 'styled-components';

import Typography from '@/components/ui/Typografy/Typografy';

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { title: { display: true, text: 'Ventas ($)' } },
    x: { title: { display: true, text: 'Cliente' } },
  },
};

const accumulateGenericCustomerSalesData = (sales: SalesRecord[]) => {
  return sales.reduce<Record<string, number>>((acc, sale) => {
    if (
      sale &&
      sale.data &&
      sale.data.client &&
      typeof sale.data.client.name === 'string'
    ) {
      const customerName = sale.data.client.name.toLowerCase();

      if (
        customerName.includes('generico') ||
        customerName.includes('genérico') ||
        customerName.includes('generic client')
      ) {
        acc['Generico'] =
          (acc['Generico'] || 0) + toNumber(sale.data.totalPurchase?.value);
      }
    } else {
      console.warn(
        'Sale data or client name is undefined or not a string:',
        sale,
      );
    }

    return acc;
  }, {});
};

export const GenericCustomerSalesChart = ({
  sales,
}: {
  sales: SalesRecord[];
}) => {
  const normalizedSales = useMemo(
    () => (Array.isArray(sales) ? sales : []),
    [sales],
  );

  const salesByGenericCustomer = useMemo(
    () => accumulateGenericCustomerSalesData(normalizedSales),
    [normalizedSales],
  );

  const data = useMemo(() => {
    const labels = Object.keys(salesByGenericCustomer);
    const dataTotals = labels.map((label) => salesByGenericCustomer[label]);

    return {
      labels,
      datasets: [
        {
          label: 'Ventas ($)',
          data: dataTotals,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [salesByGenericCustomer]);

  if (!normalizedSales.length) {
    return null; // or some fallback UI
  }

  return (
    <Container>
      <Typography variant="h4">Ventas Genéricas</Typography>
      <LazyBar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
  height: 200px;
`;

