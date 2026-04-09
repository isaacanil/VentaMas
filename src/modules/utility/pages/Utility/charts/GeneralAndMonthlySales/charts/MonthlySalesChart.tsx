// MonthlySalesChart.js
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
} from '../../utils/invoiceUtils';

interface MonthlySalesChartProps {
  invoices: UtilityInvoiceEntry[];
}

const MonthlySalesChart = ({
  invoices,
}: MonthlySalesChartProps): JSX.Element => {
  const invoicesByMonth = invoices.reduce<Record<string, number>>(
    (acc, sale) => {
      const timestamp = getInvoiceTimestamp(sale);
      if (!timestamp) return acc;
      const monthYear = DateTime.fromMillis(timestamp).toFormat('MM/yyyy');
      acc[monthYear] = (acc[monthYear] || 0) + getInvoiceTotalValue(sale);
      return acc;
    },
    {},
  );

  const chartData: ChartData<'line', number[], string> = {
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
      {' '}
      <LazyLine data={chartData} options={options} />
    </Container>
  );
};

export default MonthlySalesChart;
const Container = styled.div`
  display: grid;
  gap: 1em;
  height: 200px;
`;

