import { formatPrice } from '@/utils/format';
import type { ChartOptions } from 'chart.js';

export const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Monto de Compras',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Mes',
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || '';
          if (label) {
            label += `: ${formatPrice(context.parsed.y)}`;
          }
          return label;
        },
      },
    },
  },
};
