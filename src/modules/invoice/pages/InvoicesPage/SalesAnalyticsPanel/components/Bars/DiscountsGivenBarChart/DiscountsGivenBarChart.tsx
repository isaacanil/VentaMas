import React, { useMemo } from 'react';
import { LazyBar } from '@/components/charts/LazyCharts';
import styled from 'styled-components';
import type { SalesRecord } from '../../../utils';
import { getInvoiceDateSeconds, toNumber } from '../../../utils';

import Typography from '@/components/ui/Typografy/Typografy';
import {
  formatLocaleDate,
  formatLocaleMonthYear,
} from '@/utils/date/dateUtils';

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

const formatDate = (seconds: number, byMonth = false) => {
  const date = new Date(seconds * 1000);
  return byMonth ? formatLocaleMonthYear(date) : formatLocaleDate(date);
};

const accumulateDiscountsData = (sales: SalesRecord[], byMonth = false) => {
  return sales.reduce<Record<string, number>>((acc, sale) => {
    const seconds = getInvoiceDateSeconds(sale.data);
    if (!seconds) return acc;
    const date = formatDate(seconds, byMonth);
    acc[date] = (acc[date] || 0) + toNumber(sale?.data?.discount?.value);
    return acc;
  }, {});
};

export const DiscountsGivenBarChart = ({ sales }: { sales: SalesRecord[] }) => {
  const normalizedSales = useMemo(
    () => (Array.isArray(sales) ? sales : []),
    [sales],
  );

  const dateSpan = useMemo(
    () =>
      normalizedSales.reduce(
        (span, sale) => {
          const seconds = getInvoiceDateSeconds(sale.data);
          if (!seconds) return span;
          const date = seconds * 1000;
          return {
            min: Math.min(span.min, date),
            max: Math.max(span.max, date),
          };
        },
        { min: Infinity, max: -Infinity },
      ),
    [normalizedSales],
  );

  const spanInMonths =
    normalizedSales.length > 0
      ? (dateSpan.max - dateSpan.min) / (1000 * 60 * 60 * 24 * 30)
      : 0;
  const byMonth = spanInMonths > 2;

  const discountsByDate = useMemo(
    () => accumulateDiscountsData(normalizedSales, byMonth),
    [normalizedSales, byMonth],
  );

  const data = useMemo(() => {
    const labels = Object.keys(discountsByDate);
    const dataTotals = labels.map((label) => discountsByDate[label]);

    return {
      labels,
      datasets: [
        {
          label: 'Descuentos ($)',
          data: dataTotals,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
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

