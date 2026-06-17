import { describe, expect, it } from 'vitest';

import { createSingleDatasetBarData } from './barChartData';

describe('createSingleDatasetBarData', () => {
  it('builds one-dataset bar chart data with shared styling inputs', () => {
    expect(
      createSingleDatasetBarData({
        labels: ['enero', 'febrero'],
        values: [120, 240],
        datasetLabel: 'Total por Mes',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
      }),
    ).toEqual({
      labels: ['enero', 'febrero'],
      datasets: [
        {
          label: 'Total por Mes',
          data: [120, 240],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    });
  });
});
