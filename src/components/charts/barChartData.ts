import type { ChartData } from 'chart.js';

interface SingleDatasetBarDataInput {
  labels: string[];
  values: number[];
  datasetLabel: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth?: number;
}

export const createSingleDatasetBarData = ({
  labels,
  values,
  datasetLabel,
  backgroundColor,
  borderColor,
  borderWidth = 1,
}: SingleDatasetBarDataInput): ChartData<'bar', number[], string> => ({
  labels,
  datasets: [
    {
      label: datasetLabel,
      data: values,
      backgroundColor,
      borderColor,
      borderWidth,
    },
  ],
});
