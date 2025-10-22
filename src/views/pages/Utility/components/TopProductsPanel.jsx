import React, { useMemo } from 'react';
import styled from 'styled-components';

import { SimpleTypography } from '../../../templates/system/Typografy/SimpleTypography';
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
        [products]
    );

    if (!topProducts.length) {
        return <EmptyState>No se encontraron productos vendidos en este rango.</EmptyState>;
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

    @media (min-width: 720px) {
        display: grid;
        grid-template-columns: minmax(0, 2.2fr) repeat(4, minmax(110px, 1fr));
        align-items: center;
        padding: 0 1rem;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #94a3b8;
    }
`;

const HeaderCell = styled.span`
    text-align: ${({ align }) => align || 'left'};
    font-weight: 600;
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
    border-radius: 18px;
    background: #f8fafc;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);

    @media (max-width: 719px) {
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
    width: 28px;
    height: 28px;
    border-radius: 10px;
    background: rgba(79, 70, 229, 0.16);
    color: #4f46e5;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
`;

const ProductMeta = styled.div`
    margin-top: 0.2rem;
`;

const MetricCell = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-end;

    @media (max-width: 719px) {
        align-items: flex-start;
    }
`;

const MetricLabel = styled.span`
    font-size: 0.7rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;

    @media (min-width: 720px) {
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
