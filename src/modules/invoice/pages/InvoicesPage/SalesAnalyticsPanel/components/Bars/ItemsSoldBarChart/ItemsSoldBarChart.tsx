import React, { useMemo } from 'react';
import { LazyBar } from '@/components/charts/LazyCharts';
import styled from 'styled-components';
import type { SalesRecord } from '../../../utils';
import { toNumber } from '../../../utils';

import Typography from '@/components/ui/Typografy/Typografy';

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Ítems Vendidos',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Categoría de Producto',
      },
    },
  },
};

const accumulateItemsSoldData = (sales: SalesRecord[]) => {
  return sales.reduce<Record<string, number>>((acc, sale) => {
    (sale.data.products ?? []).forEach((product) => {
      const categoryValue = product.category;
      let category = 'Sin categoría';
      if (typeof categoryValue === 'string') {
        category = categoryValue;
      } else if (
        categoryValue &&
        typeof categoryValue === 'object' &&
        'name' in categoryValue &&
        typeof (categoryValue as { name?: unknown }).name === 'string'
      ) {
        category = (categoryValue as { name: string }).name;
      }
      const amount = toNumber(
        typeof product.amountToBuy === 'number'
          ? product.amountToBuy
          : (product.amountToBuy?.total ?? product.amountToBuy?.unit),
      );
      acc[category] = (acc[category] || 0) + amount;
    });
    return acc;
  }, {});
};

export const ItemsSoldBarChart = ({ sales }: { sales: SalesRecord[] }) => {
  const normalizedSales = useMemo(
    () => (Array.isArray(sales) ? sales : []),
    [sales],
  );

  const itemsSoldByCategory = useMemo(
    () => accumulateItemsSoldData(normalizedSales),
    [normalizedSales],
  );

  const data = useMemo(() => {
    const labels = Object.keys(itemsSoldByCategory);
    const dataTotals = labels.map((label) => itemsSoldByCategory[label]);

    return {
      labels,
      datasets: [
        {
          label: 'Ítems Vendidos',
          data: dataTotals,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [itemsSoldByCategory]);

  if (!normalizedSales.length) {
    return null; // or some fallback UI
  }

  return (
    <Container>
      <Typography variant="h3">Ítems Vendidos por Categoría</Typography>
      <LazyBar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  height: 200px;
`;

