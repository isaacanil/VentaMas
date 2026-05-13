import {
  Suspense,
  lazy,
  type ComponentType,
  type ComponentProps,
  type JSX,
  type ReactNode,
} from 'react';

import {
  loadBarChart,
  loadDoughnutChart,
  loadLineChart,
  loadRadarChart,
} from './loadChart';

type ReactChartModule = typeof import('react-chartjs-2');
type LazyChartProps<T extends ComponentType<any>> = Omit<
  ComponentProps<T>,
  'data' | 'options'
> & {
  data?: unknown;
  options?: unknown;
  fallback?: ReactNode;
};

export type LazyChartHandle = {
  destroy?: () => void;
};

const createLazyChart = <T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  displayName: string,
) => {
  const LazyChartComponent = lazy(loader);

  const WrappedChart = ({
    fallback = null,
    ...props
  }: LazyChartProps<T>): JSX.Element => (
    <Suspense fallback={fallback}>
      <LazyChartComponent {...(props as ComponentProps<T>)} />
    </Suspense>
  );

  WrappedChart.displayName = displayName;

  return WrappedChart;
};

export const LazyBar = createLazyChart<ReactChartModule['Bar']>(
  loadBarChart,
  'LazyBar',
);
export const LazyDoughnut = createLazyChart<ReactChartModule['Doughnut']>(
  loadDoughnutChart,
  'LazyDoughnut',
);
export const LazyLine = createLazyChart<ReactChartModule['Line']>(
  loadLineChart,
  'LazyLine',
);
export const LazyRadar = createLazyChart<ReactChartModule['Radar']>(
  loadRadarChart,
  'LazyRadar',
);
