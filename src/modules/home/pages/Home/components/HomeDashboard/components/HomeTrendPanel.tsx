import styled from 'styled-components';

import type {
  HomeDashboardPreparedWidget,
  HomeDashboardProduct,
  HomeDashboardTrendPoint,
} from '../types';

import type { JSX } from 'react';

interface HomeTrendPanelProps {
  trend: HomeDashboardTrendPoint[];
  topProducts: HomeDashboardProduct[];
  preparedWidgets: HomeDashboardPreparedWidget[];
}

export const HomeTrendPanel = ({
  trend,
  topProducts,
  preparedWidgets,
}: HomeTrendPanelProps): JSX.Element => {
  const maxTrendValue = Math.max(...trend.map((point) => point.total), 0);

  return (
    <Panel>
      <PanelHeader>
        <div>
          <Eyebrow>Tendencia</Eyebrow>
          <PanelTitle>Ventas y productos</PanelTitle>
        </div>
      </PanelHeader>
      <TrendBars>
        {trend.map((point) => {
          const height =
            maxTrendValue > 0 ? Math.max((point.total / maxTrendValue) * 100, 8) : 8;
          return (
            <TrendItem key={point.key}>
              <TrendBarTrack aria-label={`${point.label}: ${point.valueLabel}`}>
                <TrendBar style={{ height: `${height}%` }} />
              </TrendBarTrack>
              <TrendLabel>{point.label}</TrendLabel>
            </TrendItem>
          );
        })}
      </TrendBars>
      <ProductsBlock>
        <BlockTitle>Productos más vendidos del mes</BlockTitle>
        {topProducts.length ? (
          <ProductList>
            {topProducts.map((product) => (
              <ProductRow key={product.id}>
                <ProductName>{product.name}</ProductName>
                <ProductMeta>
                  {product.quantity} uds · {product.revenueLabel}
                </ProductMeta>
              </ProductRow>
            ))}
          </ProductList>
        ) : (
          <EmptyState>Sin ventas de productos en el mes.</EmptyState>
        )}
      </ProductsBlock>
      <PreparedBlock>
        <BlockTitle>Widgets preparados</BlockTitle>
        <PreparedGrid>
          {preparedWidgets.map((widget) => (
            <PreparedItem key={widget.id}>
              <PreparedTitle>{widget.title}</PreparedTitle>
              <PreparedText>{widget.description}</PreparedText>
            </PreparedItem>
          ))}
        </PreparedGrid>
      </PreparedBlock>
    </Panel>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  min-width: 0;
  padding: var(--ds-space-5);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const Eyebrow = styled.span`
  display: block;
  margin-bottom: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-text-muted);
  text-transform: uppercase;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-primary);
`;

const TrendBars = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--ds-space-3);
  align-items: end;
  height: 140px;
  padding: var(--ds-space-4);
  background: var(--ds-color-bg-subtle);
  border-radius: var(--ds-radius-md);
`;

const TrendItem = styled.div`
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: var(--ds-space-2);
  height: 100%;
  min-width: 0;
`;

const TrendBarTrack = styled.div`
  display: flex;
  align-items: end;
  justify-content: center;
  min-height: 0;
  background: var(--ds-color-bg-surface);
  border-radius: var(--ds-radius-sm);
`;

const TrendBar = styled.div`
  width: 100%;
  min-height: 8px;
  background: var(--ds-color-action-primary);
  border-radius: var(--ds-radius-sm);
`;

const TrendLabel = styled.span`
  overflow: hidden;
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductsBlock = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const PreparedBlock = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const BlockTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  color: var(--ds-color-text-primary);
`;

const ProductList = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const ProductRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-3);
  align-items: center;
  padding: var(--ds-space-3) 0;
  border-bottom: 1px solid var(--ds-color-border-subtle);

  &:last-child {
    border-bottom: 0;
  }

  @media (width <= 560px) {
    grid-template-columns: 1fr;
  }
`;

const ProductName = styled.strong`
  overflow: hidden;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductMeta = styled.span`
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
  white-space: nowrap;
`;

const PreparedGrid = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const PreparedItem = styled.div`
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-subtle);
  border: 1px dashed var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
`;

const PreparedTitle = styled.strong`
  display: block;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-primary);
`;

const PreparedText = styled.span`
  display: block;
  margin-top: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-muted);
`;

const EmptyState = styled.div`
  padding: var(--ds-space-4);
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  text-align: center;
  background: var(--ds-color-bg-subtle);
  border-radius: var(--ds-radius-md);
`;
