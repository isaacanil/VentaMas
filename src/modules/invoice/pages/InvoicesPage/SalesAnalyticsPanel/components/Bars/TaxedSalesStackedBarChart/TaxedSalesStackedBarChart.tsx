import React, { useMemo } from 'react';
import { LazyBar } from '@/components/charts';
import styled from 'styled-components';
import type { SalesRecord } from '../../../utils';
import {
  formatSalesChartDate,
  getInvoiceDateSeconds,
  shouldGroupSalesByMonth,
  toNumber,
} from '../../../utils';

import Typography from '@/components/ui/Typography/Typography';

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Ventas ($)',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Fecha',
      },
    },
  },
};

const accumulateTaxedSalesData = (sales: SalesRecord[], byMonth = false) => {
  return sales.reduce<Record<string, { taxed: number; untaxed: number }>>(
    (acc, sale) => {
      const seconds = getInvoiceDateSeconds(sale.data);
      if (!seconds) return acc;
      const date = formatSalesChartDate(
        seconds,
        byMonth ? 'monthYear' : 'shortDate',
      );
      acc[date] = acc[date] || { taxed: 0, untaxed: 0 };
      acc[date].taxed += toNumber(sale.data.totalTaxes?.value);
      acc[date].untaxed += toNumber(sale.data.totalPurchaseWithoutTaxes?.value);
      return acc;
    },
    {},
  );
};

export const TaxedSalesStackedBarChart = ({
  sales,
}: {
  sales: SalesRecord[];
}) => {
  const normalizedSales = useMemo(
    () => (Array.isArray(sales) ? sales : []),
    [sales],
  );
  const byMonth = shouldGroupSalesByMonth(normalizedSales);

  const salesByTaxStatus = useMemo(
    () => accumulateTaxedSalesData(normalizedSales, byMonth),
    [normalizedSales, byMonth],
  );

  const data = useMemo(() => {
    const labels = Object.keys(salesByTaxStatus);
    const dataTaxed = labels.map((label) => salesByTaxStatus[label].taxed);
    const dataUntaxed = labels.map((label) => salesByTaxStatus[label].untaxed);

    return {
      labels,
      datasets: [
        {
          label: 'Ventas Gravadas ',
          data: dataTaxed,
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
          stack: 'Stack 1',
        },
        {
          label: 'Ventas No Gravadas ',
          data: dataUntaxed,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          stack: 'Stack 1',
        },
      ],
    };
  }, [salesByTaxStatus]);

  if (!normalizedSales.length) {
    return null; // or some fallback UI
  }

  return (
    <Container>
      <Typography variant="h3">Ventas Gravadas vs No Gravadas</Typography>
      <LazyBar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
  height: 200px;
`;

