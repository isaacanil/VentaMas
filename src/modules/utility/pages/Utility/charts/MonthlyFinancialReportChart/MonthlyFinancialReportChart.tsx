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
import { useEffect, useRef, type JSX } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import type { UtilityExpenseEntry, UtilityInvoiceEntry } from '@/modules/utility/pages/Utility/types';
import Typography from '@/components/ui/Typografy/Typografy';

import { getTotalSalesPerMonth, getTotalExpensesPerMonth } from './utils';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface MonthlyFinancialReportChartProps {
  expenses: UtilityExpenseEntry[];
  invoices: UtilityInvoiceEntry[];
}

export const MonthlyFinancialReportChart = ({
  expenses,
  invoices,
}: MonthlyFinancialReportChartProps): JSX.Element => {
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  useEffect(() => {
    const chart = chartRef.current;
    return () => {
      // Cleanup chart instance on unmount
      if (chart) {
        chart.destroy();
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
  const data: ChartData<'line', number[], string> = {
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
  const options: ChartOptions<'line'> = {
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
      <Typography variant="h3">
        Finanzas Mensuales: Ventas, Gastos, Utilidad
      </Typography>
      <Line ref={chartRef} data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
  width: 100%;
  height: 200px;
`;
