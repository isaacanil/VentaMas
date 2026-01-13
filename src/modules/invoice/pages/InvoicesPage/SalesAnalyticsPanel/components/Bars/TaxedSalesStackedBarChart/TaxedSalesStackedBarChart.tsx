import {
  LinearScale,
  CategoryScale,
  BarElement,
  Chart,
  Tooltip,
} from 'chart.js';
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';
import type { SalesRecord } from '../../../utils';
import { getInvoiceDateSeconds, toNumber } from '../../../utils';

import Typography from '@/components/ui/Typografy/Typografy';
import { formatLocaleDate, formatLocaleMonthYear } from '@/utils/date/dateUtils';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

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

const formatDate = (seconds: number, byMonth = false) => {
  const date = new Date(seconds * 1000);
  return byMonth ? formatLocaleMonthYear(date) : formatLocaleDate(date);
};

const accumulateTaxedSalesData = (sales: SalesRecord[], byMonth = false) => {
  return sales.reduce<Record<string, { taxed: number; untaxed: number }>>(
    (acc, sale) => {
      const seconds = getInvoiceDateSeconds(sale.data);
      if (!seconds) return acc;
      const date = formatDate(seconds, byMonth);
      acc[date] = acc[date] || { taxed: 0, untaxed: 0 };
      acc[date].taxed += toNumber(sale.data.totalTaxes?.value);
      acc[date].untaxed += toNumber(sale.data.totalPurchaseWithoutTaxes?.value);
      return acc;
    },
    {},
  );
};

export const TaxedSalesStackedBarChart = ({ sales }: { sales: SalesRecord[] }) => {
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
      <Bar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
  height: 200px;
`;
