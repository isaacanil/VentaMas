import React, { useMemo } from 'react';
import { LazyBar } from '@/components/charts';
import { createCurrencyBarChartOptions } from '@/components/charts';
import { createSingleDatasetBarData } from '@/components/charts';
import styled from 'styled-components';
import type { SalesRecord } from '../../../utils';
import { toNumber } from '../../../utils';

import Typography from '@/components/ui/Typography/Typography';

const options = createCurrencyBarChartOptions({
  yAxisTitle: 'Ventas ($) ',
  xAxisTitle: 'Categoría de Producto',
  tooltipSeparator: ' ',
});

const accumulateCategorySalesData = (sales: SalesRecord[]) => {
  return sales.reduce<Record<string, number>>((acc, sale) => {
    (sale.data.products ?? []).forEach((product) => {
      const categoryValue = product?.category;
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
      const price = toNumber(product?.pricing?.price);
      const taxPercent = toNumber(product?.pricing?.tax);
      const amountToBuy = toNumber(
        typeof product?.amountToBuy === 'number'
          ? product?.amountToBuy
          : (product?.amountToBuy?.total ?? product?.amountToBuy?.unit),
      );
      const subtotal = price * amountToBuy;
      const taxAmount = subtotal * (taxPercent / 100);
      acc[category] = (acc[category] || 0) + subtotal + taxAmount;
    });
    return acc;
  }, {});
};

export const ProductCategorySalesBarChart = ({
  sales,
}: {
  sales: SalesRecord[];
}) => {
  const normalizedSales = useMemo(
    () => (Array.isArray(sales) ? sales : []),
    [sales],
  );

  const salesByCategory = useMemo(
    () => accumulateCategorySalesData(normalizedSales),
    [normalizedSales],
  );

  const data = useMemo(() => {
    const labels = Object.keys(salesByCategory);
    const dataTotals = labels.map((label) => salesByCategory[label]);

    return createSingleDatasetBarData({
      labels,
      values: dataTotals,
      datasetLabel: 'Ventas ',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
    });
  }, [salesByCategory]);

  if (!normalizedSales.length) {
    return null; // or some fallback UI
  }

  return (
    <Container>
      <Typography variant="h3">Ventas por Categoría de Producto</Typography>
      <LazyBar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
  height: 200px;
`;

