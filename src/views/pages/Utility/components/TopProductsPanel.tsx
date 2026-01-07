// @ts-nocheck
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { SimpleTypography } from '@/views/templates/system/Typografy/SimpleTypography';

import { EmptyState } from './EmptyState';

const MAX_PRODUCTS = 6;

export const TopProductsPanel = ({ products = [], formatCurrency }) => {
  const topProducts = useMemo(
    () =>
      products
        .filter((item) => {
          const name = (item?.name ?? '').trim();
          if ((item?.sales ?? 0) <= 0) return false;
          if (!name) return false;
          return name.toLowerCase() !== 'producto sin nombre';
        })
        .slice(0, MAX_PRODUCTS),
    [products],
  );

  if (!topProducts.length) {
    return (
      <EmptyState>
        No se encontraron productos vendidos en este rango.
      </EmptyState>
    );
  }

  return (
    <ProductsContainer>
      <MetricsHeader>
        <HeaderCell>Producto</HeaderCell>
        <HeaderCell align="right">Precio promedio</HeaderCell>
        <HeaderCell align="right">Ventas</HeaderCell>
        <HeaderCell align="right">Ganancia</HeaderCell>
        <HeaderCell align="right">Margen</HeaderCell>
      </MetricsHeader>
      <ProductsList>
        {topProducts.map((product, index) => {
          const quantity = product.quantity ?? product.units ?? 0;
          const netMargin =
            product.sales > 0
              ? Math.round(((product.profit ?? 0) / product.sales) * 1000) / 10
              : 0;
          const averagePrice =
            product.averageUnitPrice && product.averageUnitPrice > 0
              ? product.averageUnitPrice
              : quantity > 0
                ? product.sales / quantity
                : product.sales;
          const displayMargin = Number.isFinite(netMargin) ? netMargin : 0;

          return (
            <ProductRow key={product.name + index}>
              <ProductInfo>
                <Badge>{index + 1}</Badge>
                <div>
                  <SimpleTypography as="span" size="medium" weight="medium">
                    {product.name}
                  </SimpleTypography>
                  <ProductMeta>
                    <SimpleTypography as="span" size="small" color="secondary">
                      {quantity} {quantity === 1 ? 'unidad' : 'unidades'}
                    </SimpleTypography>
                  </ProductMeta>
                </div>
              </ProductInfo>
              <MetricCell>
                <MetricLabel>Precio promedio</MetricLabel>
                <MetricValueNeutral>
                  {formatCurrency(averagePrice)}
                </MetricValueNeutral>
              </MetricCell>
              <MetricCell>
                <MetricLabel>Ventas</MetricLabel>
                <MetricValue>{formatCurrency(product.sales)}</MetricValue>
              </MetricCell>
              <MetricCell>
                <MetricLabel>Ganancia</MetricLabel>
                <MetricValue $positive={product.profit >= 0}>
                  {formatCurrency(product.profit)}
                </MetricValue>
              </MetricCell>
              <MetricCell>
                <MetricLabel>Margen</MetricLabel>
                <MetricValue $positive={netMargin >= 0}>
                  {displayMargin.toFixed(1)}%
                </MetricValue>
              </MetricCell>
            </ProductRow>
          );
        })}
      </ProductsList>
    </ProductsContainer>
  );
};

const ProductsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const MetricsHeader = styled.div`
  display: none;

  @media (width >= 720px) {
    display: grid;
    grid-template-columns: minmax(0, 2.2fr) repeat(4, minmax(110px, 1fr));
    align-items: center;
    padding: 0 1rem;
    font-size: 0.7rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

const HeaderCell = styled.span`
  font-weight: 600;
  text-align: ${({ align }) => align || 'left'};
`;

const ProductsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const ProductRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) repeat(4, minmax(110px, 1fr));
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: #f8fafc;
  border-radius: 18px;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 60%);

  @media (width <= 719px) {
    grid-template-columns: 1fr;
    padding: 0.85rem;
  }
`;

const ProductInfo = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  min-width: 0;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4f46e5;
  background: rgb(79 70 229 / 16%);
  border-radius: 10px;
`;

const ProductMeta = styled.div`
  margin-top: 0.2rem;
`;

const MetricCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;

  @media (width <= 719px) {
    align-items: flex-start;
  }
`;

const MetricLabel = styled.span`
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  @media (width >= 720px) {
    display: none;
  }
`;

const MetricValue = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
`;

const MetricValueNeutral = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
`;
