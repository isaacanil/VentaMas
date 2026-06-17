import { describe, expect, it } from 'vitest';

import { createCurrencyBarChartOptions } from './currencyBarChartOptions';

describe('createCurrencyBarChartOptions', () => {
  it('builds shared currency bar chart axes and tooltip formatting', () => {
    const options = createCurrencyBarChartOptions({
      yAxisTitle: 'Monto de Compras',
    });
    const tooltipLabel = options.plugins?.tooltip?.callbacks?.label;

    expect(options.responsive).toBe(true);
    expect(options.maintainAspectRatio).toBe(false);
    expect(options.scales?.y).toMatchObject({
      beginAtZero: true,
      title: {
        display: true,
        text: 'Monto de Compras',
      },
    });
    expect(options.scales?.x).toMatchObject({
      title: {
        display: true,
        text: 'Mes',
      },
    });
    expect(
      typeof tooltipLabel === 'function'
        ? tooltipLabel({
            dataset: { label: 'Compras' },
            parsed: { y: 1250 },
          } as never)
        : null,
    ).toBe('Compras: $1,250.00');
  });

  it('allows preserving legacy tooltip separators', () => {
    const options = createCurrencyBarChartOptions({
      yAxisTitle: 'Monto de Compras',
      tooltipSeparator: ' ',
    });
    const tooltipLabel = options.plugins?.tooltip?.callbacks?.label;

    expect(
      typeof tooltipLabel === 'function'
        ? tooltipLabel({
            dataset: { label: 'Compras' },
            parsed: { y: 1250 },
          } as never)
        : null,
    ).toBe('Compras $1,250.00');
  });
});
