import type { JSX } from 'react';
import styled from 'styled-components';

import type { ChartData, ChartOptions } from '@/components/charts/chartTypes';
import { LazyBar } from '@/components/charts/LazyCharts';
import { formatPrice } from '@/utils/format';

interface TotalSalesChartProps {
  totalSales: number;
}

const TotalSalesChart = ({ totalSales }: TotalSalesChartProps): JSX.Element => {
  // Datos para el gráfico de barras
  const chartData: ChartData<'bar', number[], string> = {
    labels: ['Total de Ventas'],
    datasets: [
      {
        label: 'Ventas Totales',
        data: [totalSales],
        backgroundColor: '#4BC0C0',
        borderColor: '#4BC0C0',
        borderWidth: 1,
      },
    ],
  };

  // Opciones para el gráfico de barras
  const options: ChartOptions<'bar'> = {
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
          text: 'Resumen',
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

  // Renderizando el gráfico de barras
  return (
    <Container>
      {/* <Typography variant='h4'>
                Ventas Totales
            </Typography> */}
      <LazyBar data={chartData} options={options} />
    </Container>
  );
};

export default TotalSalesChart;
const Container = styled.div`
  display: grid;
  gap: 1em;
  height: 200px;
`;

