import { MessageOutlined, PercentageOutlined, MoreOutlined } from '@ant-design/icons';
import { Tooltip, Badge, Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '../../../../../../../constants/icons/icons';
import { changeProductPrice } from '../../../../../../../features/cart/cartSlice';
import { selectTaxReceiptEnabled } from '../../../../../../../features/taxReceipt/taxReceiptSlice';
import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';
import useInsuranceEnabled from '../../../../../../../hooks/useInsuranceEnabled';
import { getTotalPrice } from '../../../../../../../utils/pricing';
import { Counter } from '../../../../../../templates/system/Counter/Counter';
import PriceAndSaleUnitsModal from '../PriceAndSaleUnitsModal';

import { InsuranceCoverage } from './components/InsuranceCoverage/InsuranceCoverage';
import { PriceEditor } from './components/PriceEditor/PriceEditor';
import { WeightInput } from './components/WeightInput/WeightInput';
import { extraerPreciosConImpuesto } from './utils/priceUtils';

type PriceType = 'listPrice' | 'avgPrice' | 'minPrice';

interface PricingInfo {
  listPrice?: number | string;
  avgPrice?: number | string;
  minPrice?: number | string;
  price?: number | string;
  tax?: number | string;
  listPriceEnabled?: boolean;
  avgPriceEnabled?: boolean;
  minPriceEnabled?: boolean;
  [key: string]: unknown;
}

interface PriceOption {
  label: string;
  value: number | string;
  valueWithTax: number;
  pricing: PricingInfo;
  type: PriceType;
  enabled: boolean;
}

interface SaleUnit {
  id?: string;
  pricing?: PricingInfo;
  [key: string]: unknown;
}

interface DiscountInfo {
  value?: number;
  type?: string;
  [key: string]: unknown;
}

interface WeightDetail {
  isSoldByWeight?: boolean;
  [key: string]: unknown;
}

interface CartItem {
  id: string;
  name: string;
  comment?: string;
  discount?: DiscountInfo | null;
  pricing?: PricingInfo;
  price?: number | string;
  amountToBuy?: number;
  stock?: number;
  weightDetail?: WeightDetail;
  [key: string]: unknown;
}

interface ProductCardForCartProps {
  item: CartItem;
  onOpenCommentModal: (item: CartItem) => void;
  onOpenDeleteModal: (item: CartItem) => void;
  onOpenDiscountModal: (item: CartItem) => void;
}

const variants = {
  initial: { opacity: 0, y: -90 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 150, transition: { duration: 0.5 } },
} as const;

const ensureNumber = (value: number | string | undefined | null): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const ProductCardForCart = ({
  item,
  onOpenCommentModal,
  onOpenDeleteModal,
  onOpenDiscountModal,
}: ProductCardForCartProps) => {
  const dispatch = useDispatch();
  const insuranceEnabled = useInsuranceEnabled();
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled) as boolean;
  const [selectedUnit, setSelectedUnit] = useState<SaleUnit | null>(null);
  const [precios, setPrecios] = useState<PriceOption[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);

  const updatePricing = (pricing?: PricingInfo) => {
    const pricesWithTax = extraerPreciosConImpuesto(pricing, taxReceiptEnabled) as PriceOption[];
    setPrecios(pricesWithTax);
  };

  const handleSelectUnit = (unit: SaleUnit | null) => {
    if (!unit) {
      setSelectedUnit(null);
      updatePricing(undefined);
      return;
    }

    setSelectedUnit(unit);
    updatePricing(unit.pricing);
  };

  const handleSelectDefaultUnit = (unit: SaleUnit | null) => {
    setSelectedUnit(null);
    updatePricing(unit?.pricing);
  };

  const handleSelectPrice = (price: PriceOption) => {
    updatePricing(price.pricing);

    let rawPrice: number | string | undefined;

    switch (price.type) {
      case 'listPrice':
        rawPrice = price.pricing.listPrice;
        break;
      case 'avgPrice':
        rawPrice = price.pricing.avgPrice;
        break;
      case 'minPrice':
        rawPrice = price.pricing.minPrice;
        break;
      default:
        rawPrice = price.pricing.listPrice;
    }

    let numericPrice: number | null = null;

    if (typeof rawPrice === 'number') {
      numericPrice = rawPrice;
    } else if (typeof rawPrice === 'string' && rawPrice !== 'N/A') {
      const parsed = Number.parseFloat(rawPrice);
      numericPrice = Number.isNaN(parsed) ? null : parsed;
    }

    if (numericPrice !== null) {
      dispatch(changeProductPrice({
        id: item.id,
        price: numericPrice,
      }));
    }

    setModalVisible(false);
  };

  const actionMenuItems: MenuProps['items'] = [
    {
      key: 'discount',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PercentageOutlined style={{ color: item.discount ? '#52c41a' : '#8c8c8c' }} />
          {item.discount ? 'Editar descuento' : 'Aplicar descuento'}
        </span>
      ),
      onClick: () => onOpenDiscountModal(item),
    },
    {
      key: 'comment',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageOutlined style={{ color: item.comment ? '#1890ff' : '#8c8c8c' }} />
          {item.comment ? 'Editar comentario' : 'Agregar comentario'}
        </span>
      ),
      onClick: () => onOpenCommentModal(item),
    },
  ];

  const hasActions = Boolean(item.comment || item.discount);
  const finalPrice = getTotalPrice(item, taxReceiptEnabled) as number;
  const originalPriceValue = item.pricing?.price ?? item.price ?? 0;
  const originalPrice = ensureNumber(originalPriceValue);
  const taxPercentage = ensureNumber(item.pricing?.tax);
  const quantity = item.amountToBuy ?? 1;

  const unitPriceWithTax = taxReceiptEnabled
    ? originalPrice * (1 + taxPercentage / 100)
    : originalPrice;
  const basePriceWithTax = unitPriceWithTax * quantity;

  const hasDiscount = (item.discount?.value ?? 0) > 0;

  return (
    <Container variants={variants} initial="initial" animate="animate" transition={{ duration: 0.6 }}>
      <Row>
        <HeaderContainer>
          <TitleContainer>
            <Title>{item.name}</Title>
            {item.comment && (
              <CommentPreview title={item.comment}>
                {item.comment}
              </CommentPreview>
            )}
          </TitleContainer>
          <PriceContainer>
            {hasDiscount && (
              <OriginalPrice>
                {useFormatPrice(basePriceWithTax)}
              </OriginalPrice>
            )}
            <Price hasDiscount={hasDiscount}>
              {useFormatPrice(finalPrice)}
            </Price>
          </PriceContainer>
          <ButtonGroup>
            <Tooltip title="Opciones del producto">
              <Badge dot={hasActions} color={item.comment ? '#1890ff' : item.discount ? '#52c41a' : '#8c8c8c'} offset={[-2, 2]}>
                <Dropdown
                  menu={{ items: actionMenuItems }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreOutlined style={{ fontSize: '16px', color: hasActions ? (item.comment ? '#1890ff' : '#52c41a') : '#8c8c8c' }} />}
                  />
                </Dropdown>
              </Badge>
            </Tooltip>
            <Button
              type="text"
              size="small"
              icon={icons.operationModes.discard}
              onClick={() => onOpenDeleteModal(item)}
              danger
            />
          </ButtonGroup>
        </HeaderContainer>
      </Row>
      <Row>
        <Group>
          <PriceEditor
            item={item}
            onModalOpen={() => setModalVisible(true)}
          />
          {item?.weightDetail?.isSoldByWeight ? (
            <WeightInput item={item} />
          ) : (
            <Counter
              item={item}
              amountToBuy={item.amountToBuy}
              stock={item?.stock}
              id={item.id}
            />
          )}
        </Group>
      </Row>

      {insuranceEnabled && <InsuranceCoverage item={item} />}

      <PriceAndSaleUnitsModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        prices={precios}
        selectedUnit={selectedUnit}
        onSelectDefaultUnit={handleSelectDefaultUnit}
        item={item}
        onSelectPrice={handleSelectPrice}
        onSelectUnit={handleSelectUnit}
      />
    </Container>
  );
};

const Container = styled(motion.div)`
    width: 100%;
    height: min-content;
    background-color: #ffffff;
    padding: 0.4em;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    display: grid;
    gap: 0.2em;
    position: relative;
`;

const Row = styled.div`
    display: grid;
    align-items: center;
`;

const Group = styled.div`
    display: grid;
    align-items: center;
    gap: 0.4em;
    grid-template-columns: 1fr 120px;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0; // Importante para que el texto se corte correctamente
  flex: 1;
`;

const PriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: fit-content;
`;

const OriginalPrice = styled.span`
  font-size: 11px;
  color: #8c8c8c;
  text-decoration: line-through;
  line-height: 1;
  font-weight: 400;
`;

const CommentPreview = styled.div`
  color: #8c8c8c;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 2px;
  max-width: calc(100% - 8px); // Dejamos un pequeño margen
  line-height: 1;
`;

const HeaderContainer = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 8px;
    align-items: start;
    width: 100%;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }
`;

const Title = styled.span`
    font-weight: 500;
    line-height: 16px;
    font-size: 14px;
    color: rgb(71, 71, 71);
    text-transform: capitalize;
`;

const Price = styled.span<{ hasDiscount: boolean }>`
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    padding: 0 10px;
    background-color: var(--White1);
    color: ${props => props.hasDiscount ? '#52c41a' : 'var(--Gray6)'};
`;
