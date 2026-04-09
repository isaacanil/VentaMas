import type { ChartOptions, TooltipItem } from 'chart.js';

import { formatPrice } from '@/utils/format';

const tooltipLabel = (context: TooltipItem<'bar'>): string => {
    let label = context.dataset.label ?? '';
    if (label) {
        label += `: ${formatPrice(context.parsed.y)}`;
    }
    return label;
};

export const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Monto de Gastos',
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
                label: tooltipLabel,
            },
        },
    },
};
