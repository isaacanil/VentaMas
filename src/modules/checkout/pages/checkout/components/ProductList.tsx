import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCartTaxationEnabled } from '@/features/cart/cartSlice';
import { formatPrice } from '@/utils/format';
import { separator } from '@/utils/number/number';
import {
  getTax,
  getTotalPrice,
  resetAmountToBuyForProduct,
} from '@/utils/pricing';
import { convertTimeToSpanish } from '@/components/modals/ProductForm/components/sections/warranty.helpers';
import type { InvoiceData, InvoiceProduct } from '@/types/invoice';

import { Col } from './Table/Col';
import { Row } from './Table/Row';

type ProductListProps = {
  data?: InvoiceData | null;
};

export const ProductList = ({ data }: ProductListProps) => {
  const products = Array.isArray(data?.products) ? data?.products : [];
  const taxationEnabled = useSelector(selectCartTaxationEnabled);

  const getFullProductName = ({ name, measurement, footer }: InvoiceProduct) =>
    `${name ?? ''}${measurement ? ` Medida: [${measurement}]` : ''}${footer ? ` Pie: [[${footer}]` : ''}`;

  const resolveAmountToBuy = (
    amount: InvoiceProduct['amountToBuy'],
  ): number => {
    if (typeof amount === 'number') return amount;
    if (amount && typeof amount === 'object') {
      const total = Number((amount as { total?: number }).total);
      if (!Number.isNaN(total) && total > 0) return total;
      const unit = Number((amount as { unit?: number }).unit);
      if (!Number.isNaN(unit) && unit > 0) return unit;
    }
    return 0;
  };

  return (
    <Container>
      <Products>
        {products.length > 0
          ? products.map((product, index) => (
              <Product key={product?.id ?? index}>
                <Row cols="3">
                  <Col>
                    {product?.weightDetail?.isSoldByWeight ? (
                      <div>
                        {product?.weightDetail?.weight}{' '}
                        {product?.weightDetail?.weightUnit} X{' '}
                        {formatPrice(
                          getTotalPrice(
                            resetAmountToBuyForProduct(product),
                            taxationEnabled,
                          ),
                        )}
                      </div>
                    ) : (
                      <div>
                        {resolveAmountToBuy(product?.amountToBuy) || 0} x{' '}
                        {separator(
                          getTotalPrice(
                            resetAmountToBuyForProduct(product),
                            taxationEnabled,
                          ),
                        )}
                      </div>
                    )}
                  </Col>
                  <Col textAlign="right">
                    {separator(getTax(product, taxationEnabled))}
                  </Col>
                  <Col textAlign="right">
                    {separator(getTotalPrice(product, taxationEnabled))}
                  </Col>
                </Row>
                <Row>
                  <ProductName>{getFullProductName(product)} </ProductName>
                </Row>
                {product?.warranty?.status && (
                  <Row>
                    {convertTimeToSpanish(
                      product?.warranty?.quantity,
                      product?.warranty?.unit,
                    )}{' '}
                    de Garantía
                  </Row>
                )}
              </Product>
            ))
          : null}
      </Products>
    </Container>
  );
};

const Container = styled.div``;

const Products = styled.div`
  display: block;
  padding: 0;
  line-height: 22px;
  list-style: none;
  border: none;
`;

const Product = styled.div`
  width: 100%;

  &:nth-child(1n) {
    border-bottom: 1px dashed black;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ProductName = styled.div`
  display: -webkit-box;
  grid-column: 1 / 4;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
  line-height: 1.4pc;
  text-transform: capitalize;

  /* white-space: nowrap; */
  -webkit-box-orient: vertical;
`;
