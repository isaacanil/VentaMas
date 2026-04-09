import type { JSX } from 'react';
import styled from 'styled-components';

import type { ChartData, ChartOptions } from '@/components/charts/chartTypes';
import { LazyLine } from '@/components/charts/LazyCharts';
import { SimpleTypography } from '@/components/ui/Typografy/SimpleTypography';

import { EmptyState } from './EmptyState';

interface DailyPerformanceChartProps {
  loading: boolean;
  chartData: ChartData<'line', number[], string> | null;
  chartOptions: ChartOptions<'line'>;
  subtitle?: string;
}

export const DailyPerformanceChart = ({
  loading,
  chartData,
  chartOptions,
  subtitle,
}: DailyPerformanceChartProps): JSX.Element => {
  const description =
    subtitle ?? 'Comportamiento diario en el rango seleccionado.';
  return (
    <ChartCard>
      <SectionHeader>
        <SimpleTypography as="h3" size="large" weight="bold">
          Evolución de ventas y ganancias
        </SimpleTypography>
        <SimpleTypography size="small" color="secondary">
          {description}
        </SimpleTypography>
      </SectionHeader>
      <ChartBody>
        {loading ? (
          <EmptyState>Cargando datos...</EmptyState>
        ) : chartData ? (
          <LazyLine data={chartData} options={chartOptions} />
        ) : (
          <EmptyState>No hay datos disponibles para este rango.</EmptyState>
        )}
      </ChartBody>
    </ChartCard>
  );
};

const ChartCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 320px;
  padding: 1.5rem;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 35px rgb(15 23 42 / 10%);
`;

const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ChartBody = styled.div`
  position: relative;
  flex: 1;
  min-height: 260px;
`;

