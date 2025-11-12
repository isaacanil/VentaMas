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
import React, { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import styled from 'styled-components';

import { useFormatPrice } from '../../../../../hooks/useFormatPrice.js';
import Typography from '../../../../templates/system/Typografy/Typografy.jsx';

import { getTotalSalesPerMonth, getTotalExpensesPerMonth } from './utils.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export const MonthlyFinancialReportChart = ({ expenses, invoices }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup chart instance on unmount
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);
  const salesPerMonth = getTotalSalesPerMonth(invoices);
  const expensesPerMonth = getTotalExpensesPerMonth(expenses);
  const allMonths = [
    ...new Set([
      ...Object.keys(salesPerMonth),
      ...Object.keys(expensesPerMonth),
    ]),
  ].sort();
  const salesData = allMonths.map((month) => salesPerMonth[month] || 0);
  const expensesData = allMonths.map((month) => expensesPerMonth[month] || 0);
  const data = {
    labels: allMonths,
    datasets: [
      {
        label: 'Ventas',
        data: salesData,
        borderColor: 'rgb(75, 192, 192)',
        fill: true,
        backgroundColor: 'blue',
        tension: 0.1,
      },
      {
        label: 'Gastos',
        data: expensesData,
        borderColor: 'rgb(255, 99, 132)',
        fill: true,
        backgroundColor: 'red',
        tension: 0.1,
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
          text: 'Meses',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ' ' + useFormatPrice(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <Container>
      <Typography variant="h3">
        Finanzas Mensuales: Ventas, Gastos, Utilidad
      </Typography>
      <Line ref={chartRef} data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  height: 200px;
  width: 100%;
  display: grid;
  gap: 1em;
`;
