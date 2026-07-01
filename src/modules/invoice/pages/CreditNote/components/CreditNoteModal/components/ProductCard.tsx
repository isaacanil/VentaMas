import { Checkbox, Typography } from 'antd';

import { formatPrice } from '@/utils/format';
import { getTotalPrice } from '@/utils/pricing';
import type { InvoiceProduct } from '@/types/invoice';
import { CreditNoteQuantityControl } from './CreditNoteQuantityControl';
import {
  applyCreditNoteLineQuantity,
  getCreditNoteQuantityInputConfig,
} from '../utils/quantity';
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
  const tempItem = applyCreditNoteLineQuantity(product, quantity);
  const total = getTotalPrice(tempItem);
  const itbis = total - total / 1.18;
  const quantityInputConfig = getCreditNoteQuantityInputConfig(product);

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
            <CreditNoteQuantityControl
              quantity={quantity}
              displayQuantity={originalQuantity}
              originalQuantity={originalQuantity}
              creditedByOthers={creditedByOthers}
              maxQuantity={maxQuantity}
              minQuantity={quantityInputConfig.min}
              step={quantityInputConfig.step}
              isEditable={!isView && isSelected}
              onQuantityChange={onQuantityChange}
              compact
              formulaMode="label"
            />
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

