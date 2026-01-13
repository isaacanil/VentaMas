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
import { useEffect, useRef, type JSX } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import type { UtilityInvoiceEntry } from '@/modules/utility/pages/Utility/types';
import { getInvoiceTimestamp, getInvoiceTotalValue } from '../utils/invoiceUtils';
import Typography from '@/components/ui/Typografy/Typografy';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface DailySalesWithAverageChartProps {
  invoices: UtilityInvoiceEntry[];
}

const DailySalesWithAverageChart = ({
  invoices,
}: DailySalesWithAverageChartProps): JSX.Element => {
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
  const invoicesByDate = invoices.reduce<Record<string, number>>((acc, sale) => {
    const timestamp = getInvoiceTimestamp(sale);
    if (!timestamp) return acc;
    const date = DateTime.fromMillis(timestamp).toFormat('dd/MM/yyyy');
    acc[date] = (acc[date] || 0) + getInvoiceTotalValue(sale);
    return acc;
  }, {});
  const totalSales = Object.values(invoicesByDate).reduce(
    (sum, value) => sum + value,
    0,
  );
  const average = Object.keys(invoicesByDate).length
    ? totalSales / Object.keys(invoicesByDate).length
    : 0;
  const chartData: ChartData<'line', number[], string> = {
    labels: Object.keys(invoicesByDate), // asume que 'data' es un objeto donde las claves son fechas y los valores son totales de ventas
    datasets: [
      {
        label: 'Ventas por Día',
        data: Object.values(invoicesByDate),
        borderColor: 'blue',
        borderWidth: 2,
        fill: false,
        // tension: 0.4,
        backgroundColor: 'rgba(0, 0, 255, 0.2)',
      },
      {
        type: 'line',
        label: 'Promedio',
        data: Array(Object.keys(invoicesByDate).length).fill(average), // 'average' es el promedio de ventas
        borderColor: 'red',
        borderDash: [5, 5],
        fill: false,
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
      <Typography variant="h3">Ventas por Día</Typography>
      <Line ref={chartRef} data={chartData} options={options} />
    </Container>
  );
};

export default DailySalesWithAverageChart;

const Container = styled.div`
  display: grid;
  gap: 1em;
  width: 100%;
  height: 200px;
`;
