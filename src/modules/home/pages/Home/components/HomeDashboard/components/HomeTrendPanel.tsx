import ROUTES_NAME from '@/router/routes/routesName';

import {
  BlockTitle,
  EmptyAction,
  EmptyState,
  EmptyText,
  EmptyTitle,
  Eyebrow,
  Panel,
  PanelHeader,
  PanelTitle,
  ProductList,
  ProductMeta,
  ProductName,
  ProductRow,
  ProductsBlock,
  RangeLabel,
  TrendBar,
  TrendBarTrack,
  TrendBars,
  TrendItem,
  TrendLabel,
} from './HomeTrendPanel.styles';
import type {
  HomeDashboardProduct,
  HomeDashboardTrendPoint,
} from '../types';

import type { JSX } from 'react';

interface HomeTrendPanelProps {
  trend: HomeDashboardTrendPoint[];
  topProducts: HomeDashboardProduct[];
}

export const HomeTrendPanel = ({
  trend,
  topProducts,
}: HomeTrendPanelProps): JSX.Element => {
  const maxTrendValue = Math.max(...trend.map((point) => point.total), 0);
  const hasTrendData = trend.some((point) => point.total > 0);

  return (
    <Panel>
      <PanelHeader>
        <div>
          <Eyebrow>Tendencia</Eyebrow>
          <PanelTitle>Ventas y productos</PanelTitle>
        </div>
        <RangeLabel>7 días</RangeLabel>
      </PanelHeader>
      {hasTrendData ? (
        <TrendBars>
          {trend.map((point) => {
            const height = Math.max((point.total / maxTrendValue) * 100, 8);
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
      ) : (
        <EmptyState>
          <EmptyTitle>Sin ventas en el período</EmptyTitle>
          <EmptyText>Registra una venta para activar la tendencia.</EmptyText>
          <EmptyAction to={ROUTES_NAME.SALES_TERM.SALES}>
            Nueva venta
          </EmptyAction>
        </EmptyState>
      )}
      {topProducts.length ? (
        <ProductsBlock>
          <BlockTitle>Productos más vendidos del mes</BlockTitle>
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
        </ProductsBlock>
      ) : null}
    </Panel>
  );
};
