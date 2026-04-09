import { DateTime } from 'luxon';
import type { JSX } from 'react';
import styled from 'styled-components';

import type { ChartData, ChartOptions } from '@/components/charts/chartTypes';
import { LazyLine } from '@/components/charts/LazyCharts';
import { formatPrice } from '@/utils/format';
import type { UtilityInvoiceEntry } from '@/modules/utility/pages/Utility/types';
import {
  getInvoiceTimestamp,
  getInvoiceTotalValue,
} from '../utils/invoiceUtils';
import Typography from '@/components/ui/Typografy/Typografy';

interface WeeklySalesWithAverageChartProps {
  invoices: UtilityInvoiceEntry[];
}

const WeeklySalesWithAverageChart = ({
  invoices,
}: WeeklySalesWithAverageChartProps): JSX.Element => {
  const invoicesByWeek = invoices.reduce<Record<string, number>>(
    (acc, sale) => {
      const timestamp = getInvoiceTimestamp(sale);
      if (!timestamp) return acc;
      const weekNumber = DateTime.fromMillis(timestamp).toFormat('WW/yyyy');
      acc[weekNumber] = (acc[weekNumber] || 0) + getInvoiceTotalValue(sale);
      return acc;
    },
    {},
  );
  const totalSales = Object.values(invoicesByWeek).reduce(
    (sum, value) => sum + value,
    0,
  );
  const average = Object.keys(invoicesByWeek).length
    ? totalSales / Object.keys(invoicesByWeek).length
    : 0;
  const chartData: ChartData<'line', number[], string> = {
    labels: Object.keys(invoicesByWeek), // Etiquetas de semana y año como '01/2023', '02/2023', etc.
    datasets: [
      {
        label: 'Ventas por Semana',
        data: Object.values(invoicesByWeek),
        borderColor: 'blue',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        backgroundColor: 'rgba(0, 0, 255, 0.2)',
      },
      {
        type: 'line',
        label: 'Promedio',
        data: Array(Object.keys(invoicesByWeek).length).fill(average),
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
          text: 'Semana del Año',
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
              label += ': ' + formatPrice(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <Container>
      <Typography variant="h3">Ventas por Semana</Typography>
      <LazyLine data={chartData} options={options} />
    </Container>
  );
};

export default WeeklySalesWithAverageChart;

const Container = styled.div`
  display: grid;
  gap: 1em;
  width: 100%;
  height: 200px;
`;

