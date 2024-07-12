import { Bar } from 'react-chartjs-2';
import React, { useEffect, useMemo, useRef } from 'react';
import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import styled from 'styled-components';
import Typography from '../../../../../../templates/system/Typografy/Typografy';

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

const formatDate = (seconds, byMonth = false) => {
    const date = new Date(seconds * 1000);
    return byMonth
      ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
      : date.toLocaleDateString();
  };

const accumulateTaxedSalesData = (sales, byMonth = false) => {
  return sales.reduce((acc, sale) => {
    const date = formatDate(sale.data.date.seconds, byMonth);
    acc[date] = acc[date] || { taxed: 0, untaxed: 0 };
    acc[date].taxed += sale.data.totalTaxes.value;
    acc[date].untaxed += sale.data.totalPurchaseWithoutTaxes.value;
    return acc;
  }, {});
};

export const TaxedSalesStackedBarChart = ({sales}) => {
  if (!sales || !Array.isArray(sales)) {
      return null;  // or some fallback UI
    }
    const dateSpan = sales.reduce(
        (span, sale) => {
          const date = sale.data.date.seconds * 1000;
          span.min = Math.min(span.min, date);
          span.max = Math.max(span.max, date);
          return span;
        },
        { min: Infinity, max: -Infinity }
      );
    
      const spanInMonths = (dateSpan.max - dateSpan.min) / (1000 * 60 * 60 * 24 * 30);
      const byMonth = spanInMonths > 2;
    
      const salesByTaxStatus = useMemo(() => accumulateTaxedSalesData(sales, byMonth), [sales, byMonth]);

  const data = useMemo(() => {
    const labels = Object.keys(salesByTaxStatus);
    const dataTaxed = labels.map(label => salesByTaxStatus[label].taxed);
    const dataUntaxed = labels.map(label => salesByTaxStatus[label].untaxed);

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
        }
      ]
    };
  }, [salesByTaxStatus]);

  return (
    <Container>
      <Typography variant='h3'>Ventas Gravadas vs No Gravadas</Typography>
      <Bar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
    height: 200px;
    display: grid;
    gap: 1em;
`;
