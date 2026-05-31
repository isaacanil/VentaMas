import { Checkbox, Typography } from 'antd';
import React from 'react';

import { formatPrice } from '@/utils/format';
import { getTotalPrice } from '@/utils/pricing';
import type { InvoiceProduct } from '@/types/invoice';
import {
  QuantityAvailabilityDisplay,
  QuantityAvailabilityHint,
} from './QuantityAvailabilityHint';
import {
  QuantityEditor,
  QuantityInput,
} from './QuantityAvailabilityHint.styles';
import {
  CardBody,
  CardHeader,
  CheckboxContainer,
  PriceLabel,
  PriceRow,
  PriceSection,
  PriceValue,
  ProductInfo,
  ProductMeta,
  ProductName,
  QuantityControls,
  QuantityLabel,
  QuantitySection,
  StyledCard,
} from './ProductCard.styles';

const { Text } = Typography;

type CreditNoteProduct = InvoiceProduct & {
  maxAvailableQty?: number;
};

interface ProductCardProps {
  product: CreditNoteProduct;
  isSelected: boolean;
  quantity: number;
  maxQuantity: number;
  originalQuantity: number;
  isView: boolean;
  onSelectionChange: (itemId: string | undefined, selected: boolean) => void;
  onQuantityChange: (value: number | null) => void;
  creditedByOthers?: number;
  existingQuantity?: number;
}

export const ProductCard = ({
  product,
  isSelected,
  quantity,
  maxQuantity,
  originalQuantity,
  isView,
  onSelectionChange,
  onQuantityChange,
  creditedByOthers = 0,
}: ProductCardProps) => {
  const unitPrice = getTotalPrice(product, true, false);
  const tempItem = { ...product, amountToBuy: quantity };
  const total = getTotalPrice(tempItem);
  const itbis = total - total / 1.18;

  return (
    <StyledCard size="small">
      <CardHeader>
        <CheckboxContainer>
          <Checkbox
            checked={isSelected}
            disabled={isView}
            onChange={(e) => onSelectionChange(product.id, e.target.checked)}
          />
        </CheckboxContainer>
        <ProductInfo>
          <ProductName>{product.name}</ProductName>
          <ProductMeta>
            <Text type="secondary">Precio: {formatPrice(unitPrice)}</Text>
          </ProductMeta>
        </ProductInfo>
      </CardHeader>

      <CardBody>
        <QuantitySection>
          <QuantityLabel>Cantidad:</QuantityLabel>
          <QuantityControls>
            {isView || !isSelected ? (
              <QuantityAvailabilityDisplay
                quantity={quantity}
                displayQuantity={originalQuantity}
              />
            ) : (
              <QuantityEditor>
                <QuantityInput
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(value) =>
                    onQuantityChange(typeof value === 'number' ? value : null)
                  }
                  size="small"
                />
                <QuantityAvailabilityHint
                  displayQuantity={originalQuantity}
                  originalQuantity={originalQuantity}
                  creditedByOthers={creditedByOthers}
                  maxQuantity={maxQuantity}
                  compact
                  formulaMode="label"
                />
              </QuantityEditor>
            )}
          </QuantityControls>
        </QuantitySection>

        <PriceSection>
          <PriceRow>
            <PriceLabel>ITBIS:</PriceLabel>
            <PriceValue>{formatPrice(itbis)}</PriceValue>
          </PriceRow>
          <PriceRow className="total">
            <PriceLabel>Total:</PriceLabel>
            <PriceValue>{formatPrice(total)}</PriceValue>
          </PriceRow>
        </PriceSection>
      </CardBody>
    </StyledCard>
  );
};

