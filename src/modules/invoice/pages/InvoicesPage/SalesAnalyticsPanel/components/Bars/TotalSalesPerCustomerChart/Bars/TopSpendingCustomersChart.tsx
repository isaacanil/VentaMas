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

const accumulateSalesPerCustomerData = (sales: SalesRecord[]) => {
  return sales.reduce<Record<string, number>>((acc, sale) => {
    const customerName = sale.data.client?.name || 'Cliente sin nombre';
    acc[customerName] =
      (acc[customerName] || 0) + toNumber(sale.data.totalPurchase?.value);
    return acc;
  }, {});
};
const getTop20SpendingCustomers = (sales: SalesRecord[]) => {
  const salesPerCustomer = accumulateSalesPerCustomerData(sales);

  // Filtrar out clientes genéricos
  const filteredSalesPerCustomer = Object.entries(salesPerCustomer).filter(
    ([customerName]) => !/generico|generic|genérico/i.test(customerName),
  );

  // Ordenar y obtener el Top 20
  return filteredSalesPerCustomer
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .reduce<Record<string, number>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
};

export const TopSpendingCustomersChart = ({
  sales,
}: {
  sales: SalesRecord[];
}) => {
  const normalizedSales = useMemo(
    () => (Array.isArray(sales) ? sales : []),
    [sales],
  );

  const top20SpendingCustomers = useMemo(
    () => getTop20SpendingCustomers(normalizedSales),
    [normalizedSales],
  );

  const data = useMemo(() => {
    const labels = Object.keys(top20SpendingCustomers);
    const dataTotals = labels.map((label) => top20SpendingCustomers[label]);

    return {
      labels,
      datasets: [
        {
          label: 'Ventas ($)',
          data: dataTotals,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [top20SpendingCustomers]);

  if (!normalizedSales.length) {
    return null; // or some fallback UI
  }

  return (
    <Container>
      <Typography variant="h4">Clientes Destacados</Typography>
      <LazyBar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
  height: 200px;
`;

