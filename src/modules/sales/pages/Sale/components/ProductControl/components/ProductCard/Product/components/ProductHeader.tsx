import React, { memo } from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { resolveSaleUnitLabel } from '@/domain/products/saleUnits';
import { truncateString } from '@/utils/text/truncateString';
import { Button } from '@/components/ui/Button';
import type { ProductRecord } from '@/types/products';

const Header = styled.div`
  display: flex;
  gap: 0.35rem;
  justify-content: space-between;
  padding: 0.1em 0.4em 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-6);
  letter-spacing: 0.4px;
`;

const TitleStack = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

const Title = styled.div`
  display: -webkit-box;
  width: 100%;
  padding: 0.4em 0.2em 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.1;
  color: #2c3e50;
  letter-spacing: 0.2px;
  hyphens: auto;
`;

const SaleUnitBadge = styled.span`
  align-self: flex-start;
  max-width: 100%;
  padding: 0.05rem 0.35rem;
  margin: 0.1rem 0.2rem 0;
  overflow: hidden;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.25;
  color: #1f5f7a;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #e8f4f9;
  border: 1px solid #c8e7f1;
  border-radius: 4px;
`;

const BaseUnitBadge = styled(SaleUnitBadge)`
  color: #5c636a;
  background: #f8f9fa;
  border-color: #cdd3d8;
`;

type ProductHeaderProps = {
  product: ProductRecord;
  isProductInCart: boolean;
  deleteProductFromCart?: (event?: React.MouseEvent) => void;
};

/**
 * ProductHeader – muestra título y botón de descartar
 * @param {{ product: { name: string }, isProductInCart: boolean, deleteProductFromCart: ()=>void }} props
 */
function ProductHeader({
  product,
  isProductInCart,
  deleteProductFromCart,
}: ProductHeaderProps) {
  const productName = product?.name ?? product?.productName ?? '';
  const saleUnitLabel = resolveSaleUnitLabel(product?.selectedSaleUnit);
  const isBaseProduct = !product?.selectedSaleUnit && Array.isArray(product?.saleUnits) && product.saleUnits.length > 0;

  return (
    <Header>
      <TitleStack>
        <Title>{truncateString(productName, saleUnitLabel ? 32 : 40)}</Title>
        {saleUnitLabel ? (
          <SaleUnitBadge>{saleUnitLabel}</SaleUnitBadge>
        ) : isBaseProduct ? (
          <BaseUnitBadge>Base</BaseUnitBadge>
        ) : null}
      </TitleStack>
      {isProductInCart && (
        <Button
          startIcon={icons.operationModes.discard}
          width="icon24"
          color="on-error"
          borderRadius="normal"
          onClick={deleteProductFromCart}
        />
      )}
    </Header>
  );
}

ProductHeader.displayName = 'ProductHeader';

export default memo(ProductHeader);
