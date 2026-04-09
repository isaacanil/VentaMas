type ChartDataset<TData = number[]> = {
  data: TData;
  [key: string]: unknown;
};

export type ChartType = 'bar' | 'doughnut' | 'line' | 'pie' | 'radar';

export type ChartData<
  TType extends ChartType = ChartType,
  TData = number[],
  TLabel = string,
> = {
  labels?: TLabel[];
  datasets: Array<ChartDataset<TData>>;
  [key: string]: unknown;
  _type?: TType;
};

export type ChartOptions<TType extends ChartType = ChartType> = {
  [key: string]: unknown;
  _type?: TType;
};

export type TooltipItem<TType extends ChartType = ChartType> = {
  dataset: { label?: string };
  parsed: { x?: number; y?: number };
  label?: string;
  raw?: unknown;
  _type?: TType;
};
