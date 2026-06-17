import React, { useMemo } from 'react';
import { LazyBar } from '@/components/charts';
import { createSingleDatasetBarData } from '@/components/charts';
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
        text: 'Descuentos ($)',
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

const accumulateDiscountsData = (sales: SalesRecord[], byMonth = false) => {
  return sales.reduce<Record<string, number>>((acc, sale) => {
    const seconds = getInvoiceDateSeconds(sale.data);
    if (!seconds) return acc;
    const date = formatSalesChartDate(
      seconds,
      byMonth ? 'monthYear' : 'shortDate',
    );
    acc[date] = (acc[date] || 0) + toNumber(sale?.data?.discount?.value);
    return acc;
  }, {});
};

export const DiscountsGivenBarChart = ({ sales }: { sales: SalesRecord[] }) => {
  const normalizedSales = useMemo(
    () => (Array.isArray(sales) ? sales : []),
    [sales],
  );

  const byMonth = shouldGroupSalesByMonth(normalizedSales);

  const discountsByDate = useMemo(
    () => accumulateDiscountsData(normalizedSales, byMonth),
    [normalizedSales, byMonth],
  );

  const data = useMemo(() => {
    const labels = Object.keys(discountsByDate);
    const dataTotals = labels.map((label) => discountsByDate[label]);

    return createSingleDatasetBarData({
      labels,
      values: dataTotals,
      datasetLabel: 'Descuentos ($)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
    });
  }, [discountsByDate]);

  if (!normalizedSales.length) {
    return null; // or some fallback UI
  }

  return (
    <Container>
      <Typography variant="h3">Descuentos Otorgados</Typography>
      <LazyBar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
  height: 200px;
`;

