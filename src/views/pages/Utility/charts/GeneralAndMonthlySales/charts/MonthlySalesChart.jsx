// MonthlySalesChart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { DateTime } from 'luxon';
import React, { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const MonthlySalesChart = ({ invoices }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup chart instance on unmount
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);
  const invoicesByMonth = invoices.reduce((acc, sale) => {
    const monthYear = DateTime.fromMillis(
      sale.data.date.seconds * 1000,
    ).toFormat('MM/yyyy');
    acc[monthYear] = (acc[monthYear] || 0) + sale.data.totalPurchase.value;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(invoicesByMonth),
    datasets: [
      {
        label: 'Ventas por Mes',
        data: Object.values(invoicesByMonth),
        borderColor: '#4BC0C0',
        backgroundColor: 'blue',
        borderWidth: 2,
        fill: false,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Fecha',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Ventas ($)',
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ' ' + formatPrice(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <Container>
      {' '}
      <Line ref={chartRef} data={chartData} options={options} />
    </Container>
  );
};

export default MonthlySalesChart;
const Container = styled.div`
  display: grid;
  gap: 1em;
  height: 200px;
`;
