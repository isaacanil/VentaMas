import {
  Suspense,
  lazy,
  type ComponentType,
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
type LazyChartProps = {
  fallback?: ReactNode;
  [key: string]: unknown;
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
  }: LazyChartProps): JSX.Element => (
    <Suspense fallback={fallback}>
      <LazyChartComponent {...props} />
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
