import type { ChartOptions, TooltipItem } from 'chart.js';

import { formatPrice } from '@/utils/format';

interface CurrencyBarChartOptionsInput {
  yAxisTitle: string;
  xAxisTitle?: string;
  tooltipSeparator?: string;
}

const createCurrencyTooltipLabel = (separator: string) => (
  context: TooltipItem<'bar'>,
): string => {
  let label = context.dataset.label ?? '';
  if (label) {
    label += `${separator}${formatPrice(context.parsed.y)}`;
  }
  return label;
};

export const createCurrencyBarChartOptions = ({
  yAxisTitle,
  xAxisTitle = 'Mes',
  tooltipSeparator = ': ',
}: CurrencyBarChartOptionsInput): ChartOptions<'bar'> => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: yAxisTitle,
      },
    },
    x: {
      title: {
        display: true,
        text: xAxisTitle,
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: createCurrencyTooltipLabel(tooltipSeparator),
      },
    },
  },
});
