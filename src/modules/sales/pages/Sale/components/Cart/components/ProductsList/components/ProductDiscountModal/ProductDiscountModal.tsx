import { PercentageOutlined, DollarOutlined } from '@ant-design/icons';
import {
  Modal,
  Radio,
  InputNumber,
  Button,
  Typography,
  type RadioChangeEvent,
} from 'antd';
import React, { useEffect, useMemo, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  selectCartTaxationEnabled,
  updateProductDiscount,
} from '@/features/cart/cartSlice';
import type { Product } from '@/features/cart/types';
import type { DiscountType } from '@/types/invoice';
import { formatPrice } from '@/utils/format';
import { getTotalPrice } from '@/utils/pricing';

const { Text } = Typography;

type CartDiscountType = 'percentage' | 'amount';

interface DiscountPreset {
  label: string;
  value: number;
  type: DiscountType;
}

interface ProductDiscountModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
}

const toCartDiscountType = (type: DiscountType): CartDiscountType =>
  type === 'fixed' ? 'amount' : 'percentage';

interface DiscountModalState {
  discountType: DiscountType;
  discountValue: number;
  presetDiscount: DiscountPreset | null;
}

type DiscountModalAction =
  | { type: 'reset'; product: Product | null }
  | { type: 'selectPreset'; preset: DiscountPreset }
  | { type: 'setCustomValue'; value: number }
  | { type: 'setDiscountType'; discountType: DiscountType };

const initialDiscountModalState: DiscountModalState = {
  discountType: 'percentage',
  discountValue: 0,
  presetDiscount: null,
};

const discountModalReducer = (
  state: DiscountModalState,
  action: DiscountModalAction,
): DiscountModalState => {
  switch (action.type) {
    case 'reset':
      if (action.product?.discount) {
        return {
          discountType:
            action.product.discount.type === 'amount'
              ? 'fixed'
              : action.product.discount.type,
          discountValue: action.product.discount.value,
          presetDiscount: null,
        };
      }
      return initialDiscountModalState;
    case 'selectPreset':
      return {
        ...state,
        presetDiscount: action.preset,
        discountValue: 0,
      };
    case 'setCustomValue':
      return {
        ...state,
        discountValue: action.value,
        presetDiscount: null,
      };
    case 'setDiscountType':
      return {
        discountType: action.discountType,
        discountValue: 0,
        presetDiscount:
          action.discountType === 'fixed' ? null : state.presetDiscount,
      };
    default:
      return state;
  }
};

const ProductDiscountModal = ({
  visible,
  onClose,
  product,
}: ProductDiscountModalProps) => {
  const dispatch = useDispatch();
  const taxationEnabled = useSelector(selectCartTaxationEnabled);
  const [state, dispatchState] = useReducer(
    discountModalReducer,
    initialDiscountModalState,
  );
  const { discountType, discountValue, presetDiscount } = state;
  const productLineId = product?.cid || product?.id || null;

  const presetDiscounts: DiscountPreset[] = [
    { label: '5%', value: 5, type: 'percentage' },
    { label: '10%', value: 10, type: 'percentage' },
    { label: '15%', value: 15, type: 'percentage' },
    { label: '20%', value: 20, type: 'percentage' },
    { label: '25%', value: 25, type: 'percentage' },
    { label: '50%', value: 50, type: 'percentage' },
  ];

  useEffect(() => {
    if (!visible) return;
    dispatchState({ type: 'reset', product });
  }, [visible, product]);

  const displayPrices = useMemo(() => {
    if (!product) {
      return { unitPrice: 0, totalPrice: 0 };
    }

    const productWithoutDiscount = { ...product, discount: null };
    const unitPriceWithTax = getTotalPrice(
      productWithoutDiscount,
      taxationEnabled,
      false,
    );
    const quantity = product.amountToBuy || 1;

    return {
      unitPrice: unitPriceWithTax,
      totalPrice: unitPriceWithTax * quantity,
    };
  }, [product, taxationEnabled]);

  const discountedPrice = useMemo(() => {
    if (!product) {
      return 0;
    }

    const value = presetDiscount?.value ?? discountValue;
    const type = presetDiscount?.type ?? discountType;

    if (value <= 0) {
      return displayPrices.totalPrice;
    }

    if (type === 'percentage') {
      return displayPrices.totalPrice * (1 - value / 100);
    }

    return Math.max(0, displayPrices.totalPrice - value);
  }, [product, presetDiscount, discountValue, discountType, displayPrices]);

  const discountAmount = useMemo(
    () => Math.max(0, displayPrices.totalPrice - discountedPrice),
    [displayPrices, discountedPrice],
  );

  const formattedUnitPrice = formatPrice(displayPrices.unitPrice);
  const formattedTotalPrice = formatPrice(displayPrices.totalPrice);
  const formattedDiscountAmount = formatPrice(discountAmount);
  const formattedDiscountedPrice = formatPrice(discountedPrice);

  const handleApply = () => {
    if (!product || !productLineId) {
      return;
    }

    const value = presetDiscount?.value ?? discountValue;
    const discount = presetDiscount ?? { type: discountType, value };

    dispatch(
      updateProductDiscount({
        id: productLineId,
        discount:
          value > 0 ? { type: toCartDiscountType(discount.type), value } : null,
      }),
    );

    onClose();
  };

  const handleRemove = () => {
    if (!product || !productLineId) {
      return;
    }

    dispatch(
      updateProductDiscount({
        id: productLineId,
        discount: null,
      }),
    );

    onClose();
  };

  const handlePresetSelect = (preset: DiscountPreset) => {
    dispatchState({ type: 'selectPreset', preset });
  };

  const handleCustomValueChange = (value: number | null) => {
    dispatchState({ type: 'setCustomValue', value: value || 0 });
  };

  const handleDiscountTypeChange = (event: RadioChangeEvent) => {
    dispatchState({
      type: 'setDiscountType',
      discountType: event.target.value as DiscountType,
    });
  };

  const maxFixedDiscount = displayPrices.totalPrice;
  const currentDiscountValue = presetDiscount?.value ?? discountValue;
  const hasDiscount = currentDiscountValue > 0;

  return (
    <Modal
      title="Aplicar Descuento al Producto"
      open={visible}
      onCancel={onClose}
      style={{ top: '10px' }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        product?.discount ? (
          <Button key="remove" onClick={handleRemove} danger>
            Quitar Descuento
          </Button>
        ) : null,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          disabled={!hasDiscount}
        >
          Aplicar Descuento
        </Button>,
      ]}
      width={500}
    >
      <ModalContent>
        <ProductInfo>
          <ProductHeader>
            <ProductName>{product?.name || product?.productName}</ProductName>
            <QuantityBadge>Cant: {product?.amountToBuy || 1}</QuantityBadge>
          </ProductHeader>

          <PriceDetails>
            <PriceRow>
              <PriceLabel>Precio unitario:</PriceLabel>
              <PriceValue>{formattedUnitPrice}</PriceValue>
            </PriceRow>
            <PriceRow>
              <PriceLabel>Total actual:</PriceLabel>
              <PriceValue $isTotal>{formattedTotalPrice}</PriceValue>
            </PriceRow>
          </PriceDetails>
        </ProductInfo>

        <DiscountSection>
          {discountType === 'percentage' && (
            <div>
              <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                Descuentos rápidos:
              </Text>
              <PresetGrid>
                {presetDiscounts.map((preset) => (
                  <PresetPill
                    key={`${preset.type}-${preset.value}`}
                    $isSelected={
                      presetDiscount?.value === preset.value &&
                      presetDiscount?.type === preset.type
                    }
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </PresetPill>
                ))}
              </PresetGrid>
            </div>
          )}

          <CustomDiscountSection>
            <Radio.Group
              value={discountType}
              onChange={handleDiscountTypeChange}
            >
              <CustomRadio value="percentage">
                <RadioContent>
                  <PercentageOutlined />
                  Porcentaje
                </RadioContent>
              </CustomRadio>
              <CustomRadio value="fixed">
                <RadioContent>
                  <DollarOutlined />
                  Monto fijo
                </RadioContent>
              </CustomRadio>
            </Radio.Group>

            <InputNumber
              style={{ width: '100%' }}
              placeholder={
                discountType === 'percentage'
                  ? 'Ej: 15'
                  : `Máx: ${maxFixedDiscount}`
              }
              value={discountValue}
              onChange={handleCustomValueChange}
              min={0}
              max={discountType === 'percentage' ? 100 : maxFixedDiscount}
              suffix={discountType === 'percentage' ? '%' : '$'}
              size="large"
            />

            {hasDiscount && (
              <DiscountResultsSection>
                <PriceRow $isDiscount>
                  <PriceLabel>Descuento:</PriceLabel>
                  <PriceValue $isDiscount>
                    -{formattedDiscountAmount}
                  </PriceValue>
                </PriceRow>
                <PriceRow $isFinal>
                  <PriceLabel>Precio final:</PriceLabel>
                  <PriceValue $isFinal>{formattedDiscountedPrice}</PriceValue>
                </PriceRow>
              </DiscountResultsSection>
            )}
          </CustomDiscountSection>
        </DiscountSection>
      </ModalContent>
    </Modal>
  );
};

export default ProductDiscountModal;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
`;

const ProductHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
`;

const ProductName = styled.div`
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  color: #2c3e50;
`;

const QuantityBadge = styled.div`
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  background-color: #1890ff;
  border-radius: 12px;
`;

const PriceDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

interface PriceRowProps {
  $isFinal?: boolean;
  $isDiscount?: boolean;
}

interface PriceLabelProps {
  $isFinal?: boolean;
  $isDiscount?: boolean;
}

interface PriceValueProps {
  $isFinal?: boolean;
  $isDiscount?: boolean;
  $isTotal?: boolean;
}

interface PresetPillProps {
  $isSelected?: boolean;
}

const PriceRow = styled.div<PriceRowProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ $isFinal }: PriceRowProps) =>
    $isFinal ? '8px 0 4px 0' : '4px 0'};
  padding-right: ${({ $isFinal, $isDiscount }: PriceRowProps) =>
    $isFinal || $isDiscount ? '8px' : '0'};
  padding-left: ${({ $isFinal, $isDiscount }: PriceRowProps) =>
    $isFinal || $isDiscount ? '8px' : '0'};
  margin: ${({ $isFinal, $isDiscount }: PriceRowProps) =>
    $isFinal || $isDiscount ? '0 -8px' : '0'};
  background-color: ${({ $isFinal, $isDiscount }: PriceRowProps) =>
    $isFinal
      ? 'rgba(82, 196, 26, 0.1)'
      : $isDiscount
        ? 'rgba(255, 77, 79, 0.05)'
        : 'transparent'};
  border-radius: ${({ $isFinal, $isDiscount }: PriceRowProps) =>
    $isFinal || $isDiscount ? '6px' : '0'};
`;

const PriceLabel = styled.span<PriceLabelProps>`
  font-size: 14px;
  font-weight: ${({ $isFinal }: PriceLabelProps) => ($isFinal ? '600' : '500')};
  color: ${({ $isFinal, $isDiscount }: PriceLabelProps) =>
    $isFinal ? '#52c41a' : $isDiscount ? '#ff4d4f' : '#6c757d'};
`;

const PriceValue = styled.span<PriceValueProps>`
  font-size: ${({ $isFinal, $isTotal }: PriceValueProps) =>
    $isFinal ? '18px' : $isTotal ? '16px' : '14px'};
  font-weight: 700;
  color: ${({ $isFinal, $isDiscount, $isTotal }: PriceValueProps) =>
    $isFinal
      ? '#52c41a'
      : $isDiscount
        ? '#ff4d4f'
        : $isTotal
          ? '#2c3e50'
          : '#495057'};
`;

const _DiscountDivider = styled.div`
  height: 1px;
  margin: 4px 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    #e0e6ed 50%,
    transparent 100%
  );
`;

const _ProductDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DiscountSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

const CustomDiscountSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const CustomRadio = styled(Radio)`
  .ant-radio-wrapper {
    display: flex;
    align-items: center;
  }
`;

const RadioContent = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
`;

const PresetPill = styled.div<PresetPillProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: auto;
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ $isSelected }: PresetPillProps) =>
    $isSelected ? 'white' : '#595959'};
  cursor: pointer;
  background-color: ${({ $isSelected }: PresetPillProps) =>
    $isSelected ? '#1890ff' : 'white'};
  border: 1px solid
    ${({ $isSelected }: PresetPillProps) =>
      $isSelected ? '#1890ff' : '#d9d9d9'};
  border-radius: 16px;
  transition: all 0.2s ease;

  &:hover {
    color: ${({ $isSelected }: PresetPillProps) =>
      $isSelected ? 'white' : '#1890ff'};
    border-color: #1890ff;
    box-shadow: 0 2px 4px rgb(24 144 255 / 20%);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const _PresetButton = styled(Button)`
  min-width: auto;
  height: 32px;
  padding: 0 8px;
  font-size: 12px;
`;

const DiscountResultsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  margin-top: 8px;
  border: 1px solid rgb(24 144 255 / 20%);
  border-radius: 8px;
`;
