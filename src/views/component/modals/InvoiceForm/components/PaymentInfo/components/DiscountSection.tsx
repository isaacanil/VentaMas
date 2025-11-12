import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, InputNumber } from 'antd';
import { FC, useMemo } from 'react';
import styled from 'styled-components';

import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';

import type { DiscountType } from '../types';
import type { MenuProps } from 'antd';

interface DiscountSectionProps {
  discountType: DiscountType;
  discountValue: number;
  subtotal: number;
  readOnly: boolean;
  onDiscountTypeChange: (type: DiscountType) => void;
  onDiscountValueChange: (value: number | null) => void;
}

const DISCOUNT_OPTIONS: Array<{ key: DiscountType; label: string }> = [
  { key: 'percentage', label: '% Porcentaje' },
  { key: 'fixed', label: '$ Monto Fijo' },
];

export const DiscountSection: FC<DiscountSectionProps> = ({
  discountType,
  discountValue,
  subtotal,
  readOnly,
  onDiscountTypeChange,
  onDiscountValueChange,
}) => {
  const formattedSubtotal = useMemo(() => useFormatPrice(subtotal), [subtotal]);

  const addonBefore = discountType === 'percentage' ? '%' : '$';
  const maxValue = discountType === 'percentage' ? 100 : subtotal;
  const precision = discountType === 'percentage' ? 0 : 2;
  const step = discountType === 'percentage' ? 1 : 0.01;
  const placeholder = discountType === 'percentage' ? '0' : '0.00';

  const currentOption = useMemo(
    () => DISCOUNT_OPTIONS.find((option) => option.key === discountType),
    [discountType],
  );

  const dropdownMenu = useMemo<MenuProps>(
    () => ({
      items: DISCOUNT_OPTIONS.map((option) => ({
        key: option.key,
        label: option.label,
      })),
      selectable: true,
      selectedKeys: [discountType],
      onClick: ({ key }) => onDiscountTypeChange(key as DiscountType),
    }),
    [discountType, onDiscountTypeChange],
  );

  return (
    <DiscountContainer>
      <DiscountSectionWrapper>
        <SectionTitle>Descuento</SectionTitle>
        <DiscountControls>
          <Dropdown menu={dropdownMenu} disabled={readOnly} trigger={['click']}>
            <TypeButton disabled={readOnly}>
              <span>{currentOption?.label ?? 'Seleccionar descuento'}</span>
              <DownOutlined />
            </TypeButton>
          </Dropdown>
          <InputNumber
            value={discountValue}
            onChange={onDiscountValueChange}
            min={0}
            max={maxValue}
            precision={precision}
            step={step}
            placeholder={placeholder}
            addonBefore={addonBefore}
            style={{ flex: 1, maxWidth: 220 }}
            disabled={readOnly}
          />
        </DiscountControls>
        <DiscountHelp>
          {discountType === 'percentage'
            ? 'Ingrese el porcentaje de descuento (0-100)'
            : `Ingrese el monto fijo de descuento (máx: ${formattedSubtotal})`}
        </DiscountHelp>
      </DiscountSectionWrapper>
    </DiscountContainer>
  );
};

const DiscountContainer = styled.div`
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
`;

const DiscountSectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #434343;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const DiscountControls = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TypeButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 160px;
  padding: 0 0.75rem;

  span {
    font-weight: 500;
  }
`;

const DiscountHelp = styled.span`
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.4;
`;
