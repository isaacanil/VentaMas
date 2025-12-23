import React from 'react';
import { Line } from 'react-chartjs-2';
import styled from 'styled-components';

import { SimpleTypography } from '@/views/templates/system/Typografy/SimpleTypography';

import { EmptyState } from './EmptyState';

export const DailyPerformanceChart = ({
  loading,
  chartData,
  chartOptions,
  subtitle,
}) => {
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
          <Line data={chartData} options={chartOptions} />
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
