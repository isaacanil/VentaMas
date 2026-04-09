import type { JSX } from 'react';
import { useEffect, useRef } from 'react';
import {
  createChart,
  type ChartOptions,
  type IChartApi,
  type ISeriesApi,
  type SeriesDataItemTypeMap,
  type SeriesDefinition,
  type SeriesPartialOptionsMap,
  type SeriesType,
  type Time,
} from 'lightweight-charts';

export type ChartTime = Time;

export interface SeriesConfig<TSeries extends SeriesType = SeriesType> {
  definition: SeriesDefinition<TSeries>;
  data: Array<SeriesDataItemTypeMap<ChartTime>[TSeries]>;
  options?: SeriesPartialOptionsMap[TSeries];
}

export interface LightweightChartsWrapperProps {
  options: ChartOptions;
  series: SeriesConfig[];
  height?: number;
  width?: number | string;
  className?: string;
}

export const LightweightChartsWrapper = ({
  options,
  series,
  height = 240,
  width = '100%',
  className,
}: LightweightChartsWrapperProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Array<ISeriesApi<SeriesType, ChartTime>>>([]);
  const initialOptionsRef = useRef(options);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, initialOptionsRef.current);
    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = [];
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions(options);
  }, [options]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    seriesRefs.current.forEach(seriesApi => {
      chart.removeSeries(seriesApi);
    });
    seriesRefs.current = series.map(seriesConfig => {
      const seriesApi = chart.addSeries(
        seriesConfig.definition,
        seriesConfig.options,
      );
      seriesApi.setData(seriesConfig.data);
      return seriesApi;
    });

    if (seriesRefs.current.length > 0) {
      chart.timeScale().fitContent();
    }
  }, [series]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
    />
  );
};
