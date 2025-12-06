import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import styled from 'styled-components';

import { SimpleTypography } from '../../../templates/system/Typografy/SimpleTypography';

import { EmptyState } from './EmptyState';

const getPercentageColor = (value) => {
  if (value > 0) return 'success';
  if (value < 0) return 'danger';
  return 'secondary';
};

export const RevenueDistributionChart = ({
  loading,
  chartData,
  chartOptions,
  distributionDetails = [],
  formatCurrency,
  formatPercentage,
  totalSales,
}) => {
  const visibleDistributionDetails = distributionDetails.filter(
    (item) => item.value !== 0,
  );

  return (
    <ChartCard>
      <SectionHeader>
        <SimpleTypography as="h3" size="large" weight="bold">
          Distribución de ingresos
        </SimpleTypography>
        <SimpleTypography size="small" color="secondary">
          Costos, gastos, ganancia neta e ITBIS.
        </SimpleTypography>
      </SectionHeader>
      <ChartBody>
        {loading ? (
          <EmptyState>Cargando datos...</EmptyState>
        ) : chartData ? (
          <PieWrapper>
            <DoughnutContainer>
              <Doughnut data={chartData} options={chartOptions} />
            </DoughnutContainer>
            <DistributionLegend>
              {visibleDistributionDetails.map((item) => (
                <LegendItem key={item.label}>
                  <LegendLabel>
                    <LegendDot color={item.color} />
                    <SimpleTypography as="span" size="small" weight="medium">
                      {item.label}
                    </SimpleTypography>
                    <LegendPercentage>
                      <SimpleTypography
                        as="span"
                        size="small"
                        color={getPercentageColor(item.value)}
                        weight="medium"
                      >
                        {formatPercentage(item.percentage)}
                      </SimpleTypography>
                    </LegendPercentage>
                  </LegendLabel>
                  <LegendValue>
                    <SimpleTypography as="span" size="small" weight="regular">
                      {formatCurrency(item.value)}
                    </SimpleTypography>
                    {item.chartValue === 0 && item.value !== 0 && (
                      <LegendNote>No se muestra en el gráfico</LegendNote>
                    )}
                  </LegendValue>
                </LegendItem>
              ))}
              {visibleDistributionDetails.length > 0 && <LegendDivider />}
              <LegendItem>
                <LegendLabel>
                  <SimpleTypography as="span" size="small" weight="medium">
                    Total
                  </SimpleTypography>
                </LegendLabel>
                <LegendValue>
                  <SimpleTypography as="span" size="medium" weight="bold">
                    {formatCurrency(totalSales)}
                  </SimpleTypography>
                </LegendValue>
              </LegendItem>
            </DistributionLegend>
          </PieWrapper>
        ) : (
          <EmptyState>
            No hay información para mostrar la distribución.
          </EmptyState>
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

const PieWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;

  @media (width >= 768px) {
    flex-direction: row;
    align-items: stretch;
    justify-content: center;
  }
`;

const DoughnutContainer = styled.div`
  flex: 0 0 220px;
  max-width: 240px;
  height: 220px;
`;

const DistributionLegend = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0;
  margin: 0;
  list-style: none;
`;

const LegendItem = styled.li`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  color: #1f2937;
`;

const LegendLabel = styled.span`
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  font-weight: 600;
`;

const LegendDot = styled.span`
  width: 0.75rem;
  height: 0.75rem;
  background: ${({ color }) => color};
  border-radius: 50%;
`;

const LegendPercentage = styled.span`
  font-size: 0.85rem;
  color: #64748b;
`;

const LegendValue = styled.span`
  display: inline-flex;
  flex-direction: column;
  gap: 0.15rem;
  align-items: flex-end;
  font-weight: 600;
  text-align: right;
`;

const LegendNote = styled.span`
  font-size: 0.75rem;
  font-weight: 400;
  color: #64748b;
`;

const LegendDivider = styled.li`
  margin: 0.25rem 0;
  border-top: 1px solid #e2e8f0;
`;
