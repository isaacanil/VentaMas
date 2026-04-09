import styled from 'styled-components';
import type { QuotationData } from '@/pdf/invoicesAndQuotation/types';
import type { InvoiceProduct } from '@/types/invoice';

import { formatInvoicePrice } from '@/utils/invoice/documentCurrency';
import {
  getTax,
  getTotalPrice,
  getProductIndividualDiscount,
  resetAmountToBuyForProduct,
} from '@/utils/pricing';
import { resolveInvoiceAmount } from '@/utils/invoice/amount';
import { convertTimeToSpanish } from '@/components/modals/ProductForm/components/sections/warranty.helpers';
import { PRODUCT_BRAND_DEFAULT } from '@/features/updateProduct/updateProductSlice';

import { Col } from './Table/Col';
import { Row } from './Table/Row';

type TaxReceiptLike = { enabled?: boolean } | null | undefined;

type ProductListProps = {
  data: QuotationData;
  taxReceipt?: TaxReceiptLike;
};

export const ProductList = ({ data, taxReceipt }: ProductListProps) => {
  const { products, NCF } = data;
  const insuranceEnabled = data?.insuranceEnabled;
  const taxReceiptEnabled = Boolean(taxReceipt?.enabled) || Boolean(NCF);
  const getFullProductName = ({
    name,
    measurement,
    footer,
  }: InvoiceProduct): string =>
    `${name}${measurement ? ` Medida: [${measurement}]` : ''}${footer ? ` Pie: [${footer}]` : ''}`;
  return (
    <Container>
      <Products>
        {(products?.length || 0) > 0
          ? products?.map((product, index) => (
              <Product key={index}>
                <Row cols="3">
                  <Col>
                    {product?.weightDetail?.isSoldByWeight ? (
                      <div>
                        {product?.weightDetail?.weight}{' '}
                        {product?.weightDetail?.weightUnit} X{' '}
                        {formatInvoicePrice(
                          getTotalPrice(
                            resetAmountToBuyForProduct(product),
                            taxReceipt?.enabled,
                          ),
                          data,
                        )}
                      </div>
                    ) : (
                      <div>
                        {resolveInvoiceAmount(product?.amountToBuy)} x{' '}
                        {formatInvoicePrice(
                          getTotalPrice(
                            resetAmountToBuyForProduct(product),
                            taxReceiptEnabled,
                          ),
                          data,
                        )}
                      </div>
                    )}
                  </Col>
                  <Col textAlign="right">
                    {formatInvoicePrice(getTax(product, taxReceiptEnabled), data)}
                  </Col>
                  <Col textAlign="right">
                    {formatInvoicePrice(getTotalPrice(product, taxReceiptEnabled), data)}
                  </Col>
                </Row>
                <Row>
                  <ProductName>{getFullProductName(product)} </ProductName>
                </Row>
                {(() => {
                  const rawBrand =
                    typeof product?.brand === 'string'
                      ? product.brand.trim()
                      : '';
                  const hasBrand =
                    rawBrand &&
                    rawBrand.toLowerCase() !==
                      PRODUCT_BRAND_DEFAULT.toLowerCase();
                  if (!hasBrand) return null;
                  return (
                    <Row>
                      <ProductBrand>Marca: {rawBrand}</ProductBrand>
                    </Row>
                  );
                })()}
                {product?.warranty?.status && (
                  <Row>
                    {convertTimeToSpanish(
                      product?.warranty?.quantity,
                      product?.warranty?.unit,
                    )}{' '}
                    de Garantía
                  </Row>
                )}
                {insuranceEnabled && product?.insurance?.mode && (
                  <Row>
                    <InsuranceCoverage>
                      Cobertura de seguro: {product.insurance.mode} -{' '}
                      {formatInvoicePrice(product.insurance.value || 0, data)}
                    </InsuranceCoverage>
                  </Row>
                )}
                {product?.discount && (product?.discount?.value || 0) > 0 && (
                  <Row>
                    <ProductDiscount>
                      Descuento: -
                      {formatInvoicePrice(getProductIndividualDiscount(product), data)}(
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

const ProductBrand = styled.div`
  font-size: 0.95em;
  font-weight: 500;
  color: #333;
`;

const InsuranceCoverage = styled.div`
  font-size: 1em;
  font-style: italic;
`;
