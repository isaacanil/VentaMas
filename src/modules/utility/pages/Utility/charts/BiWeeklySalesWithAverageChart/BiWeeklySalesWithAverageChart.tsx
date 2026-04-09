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

interface BiWeeklySalesWithAverageChartProps {
  invoices: UtilityInvoiceEntry[];
}

const BiWeeklySalesWithAverageChart = ({
  invoices,
}: BiWeeklySalesWithAverageChartProps): JSX.Element => {
  const invoicesByBiWeek = invoices.reduce<Record<string, number>>(
    (acc, sale) => {
      const timestamp = getInvoiceTimestamp(sale);
      if (!timestamp) return acc;
      const date = DateTime.fromMillis(timestamp);
      const biWeekNumber = date.day <= 15 ? '1ra Quincena' : '2da Quincena';
      const key = `${biWeekNumber}/${date.toFormat('MM/yyyy')}`;
      acc[key] = (acc[key] || 0) + getInvoiceTotalValue(sale);
      return acc;
    },
    {},
  );
  const totalSales = Object.values(invoicesByBiWeek).reduce(
    (sum, value) => sum + value,
    0,
  );
  const average = Object.keys(invoicesByBiWeek).length
    ? totalSales / Object.keys(invoicesByBiWeek).length
    : 0;
  const chartData: ChartData<'line', number[], string> = {
    labels: Object.keys(invoicesByBiWeek),
    datasets: [
      {
        label: 'Ventas por Quincena',
        data: Object.values(invoicesByBiWeek),
        borderColor: 'blue',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        backgroundColor: 'rgba(0, 0, 255, 0.2)',
      },
      {
        type: 'line',
        label: 'Promedio',
        data: Array(Object.keys(invoicesByBiWeek).length).fill(average),
        borderColor: 'red',
        borderDash: [5, 5],
        fill: false,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Quincena del Año',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Ventas ($)',
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
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
      <Typography variant="h3">Ventas por Quincena</Typography>
      <LazyLine data={chartData} options={options} />
    </Container>
  );
};

export default BiWeeklySalesWithAverageChart;

const Container = styled.div`
  display: grid;
  gap: 1em;
  width: 100%;
  height: 200px;
`;

