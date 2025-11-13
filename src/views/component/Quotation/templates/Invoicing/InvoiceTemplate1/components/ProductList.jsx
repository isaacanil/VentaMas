import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { SelectSettingCart } from '../../../../../../../features/cart/cartSlice';
import { separator } from '../../../../../../../hooks/separator';
import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';
import {
  getTax,
  getTotalPrice,
  resetAmountToBuyForProduct,
  getProductIndividualDiscount,
} from '../../../../../../../utils/pricing';
import { convertTimeToSpanish } from '../../../../../modals/ProductForm/components/sections/warranty.helpers';

import { Col } from './Table/Col';
import { Row } from './Table/Row';

export const ProductList = ({ data }) => {
  const { products, NCF } = data;
  const { taxReceipt } = useSelector(SelectSettingCart);
  const getFullProductName = ({ name, measurement, footer }) =>
    `${name}${measurement ? ` Medida: [${measurement}]` : ''}${footer ? ` Pie: [${footer}]` : ''}`;
  return (
    <Container>
      <Products>
        {products?.length > 0
          ? products?.map((product, index) => (
              <Product key={index}>
                <Row cols="3">
                  <Col>
                    {product?.weightDetail?.isSoldByWeight ? (
                      <div>
                        {product?.weightDetail?.weight}{' '}
                        {product?.weightDetail?.weightUnit} X{' '}
                        {useFormatPrice(
                          getTotalPrice(
                            resetAmountToBuyForProduct(product),
                            taxReceipt?.enabled,
                          ),
                        )}
                      </div>
                    ) : (
                      <div>
                        {product?.amountToBuy || 0} x{' '}
                        {separator(
                          getTotalPrice(
                            resetAmountToBuyForProduct(product),
                            taxReceipt?.enabled,
                          ),
                        )}
                      </div>
                    )}
                  </Col>
                  <Col textAlign="right">{separator(getTax(product, NCF))}</Col>
                  <Col textAlign="right">
                    {separator(getTotalPrice(product, NCF))}
                  </Col>
                </Row>
                <Row>
                  <ProductName>{getFullProductName(product)} </ProductName>
                </Row>{' '}
                {product?.warranty?.status && (
                  <Row>
                    {convertTimeToSpanish(
                      product?.warranty?.quantity,
                      product?.warranty?.unit,
                    )}{' '}
                    de Garantía
                  </Row>
                )}
                {product?.discount && product?.discount?.value > 0 && (
                  <Row>
                    <ProductDiscount>
                      Descuento: -
                      {useFormatPrice(getProductIndividualDiscount(product))}(
                      {product.discount.type === 'percentage'
                        ? `${product.discount.value}%`
                        : 'Monto fijo'}
                      )
                    </ProductDiscount>
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

const ProductDiscount = styled.div`
  padding-left: 8px;
  margin: 2px 0;
  font-size: 0.9em;
  font-weight: 600;
  color: #52c41a;
  border-left: 2px solid #52c41a;
`;
