import { Typography } from 'antd';
import { forwardRef } from 'react';
import Barcode from 'react-barcode';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

interface BarcodeProductPricing {
  price?: number;
}

interface BarcodeProductWeightDetail {
  weightUnit?: string;
  isSoldByWeight?: boolean;
}

export interface BarcodeProduct {
  name?: string;
  barcode?: string;
  pricing?: BarcodeProductPricing;
  weightDetail?: BarcodeProductWeightDetail;
}

interface BarCodeProps {
  product?: BarcodeProduct | null;
}

export const BarCode = forwardRef<HTMLDivElement, BarCodeProps>(
  ({ product }, ref) => {
    const priceWithUnit = `${formatPrice(product?.pricing?.price)} / ${product?.weightDetail?.weightUnit}`;
    const priceWithoutUnit = formatPrice(product?.pricing?.price);
    const price = product?.weightDetail?.isSoldByWeight
      ? priceWithUnit
      : priceWithoutUnit;

    return (
      <Container>
        {' '}
        {/* Asigna la ref al contenedor */}
        <Wrapper ref={ref}>
          <ProductRef>
            {product?.name} ({price || ''})
          </ProductRef>
          <Barcode
            marginTop={3}
            width={1.6}
            height={50}
            value={product?.barcode || '-'}
          />
        </Wrapper>
      </Container>
    );
  },
);

BarCode.displayName = 'BarCode';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
`;
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: min-content;
  padding: 0 0.8em;
`;
const ProductRef = styled(Typography.Text)`
  margin-bottom: 0;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
`;
