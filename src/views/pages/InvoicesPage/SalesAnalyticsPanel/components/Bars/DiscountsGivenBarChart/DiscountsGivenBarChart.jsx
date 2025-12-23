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

import Typography from '@/views/templates/system/Typografy/Typografy';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

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

const formatDate = (seconds, byMonth = false) => {
  const date = new Date(seconds * 1000);
  return byMonth
    ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : date.toLocaleDateString();
};

const accumulateDiscountsData = (sales, byMonth = false) => {
  return sales.reduce((acc, sale) => {
    const date = formatDate(sale.data.date.seconds, byMonth);
    acc[date] = (acc[date] || 0) + sale?.data?.discount?.value;
    return acc;
  }, {});
};

export const DiscountsGivenBarChart = ({ sales }) => {
  const normalizedSales = useMemo(() => Array.isArray(sales) ? sales : [], [sales]);

  const dateSpan = useMemo(
    () =>
      normalizedSales.reduce(
        (span, sale) => {
          const date = sale.data.date.seconds * 1000;
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
      <Bar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
  height: 200px;
`;
