import { MessageOutlined, PercentageOutlined, MoreOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { faCircleCheck, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip, Badge, Button, Dropdown } from 'antd';
import { motion } from 'framer-motion';
import { useState, type KeyboardEvent } from 'react';
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

import type { MenuProps } from 'antd';

type PriceType = 'listPrice' | 'avgPrice' | 'minPrice' | 'cardPrice' | 'offerPrice';

interface PricingInfo {
  listPrice?: number | string;
  avgPrice?: number | string;
  minPrice?: number | string;
  cardPrice?: number | string;
  offerPrice?: number | string;
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

interface BatchInfo {
  productStockId?: string | null;
  batchId?: string | null;
  batchNumber?: string | number | null;
  quantity?: number | null;
  expirationDate?: number | string | null;
  locationId?: string | null;
  locationName?: string | null;
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
  batchId?: string | null;
  productStockId?: string | null;
  batchInfo?: BatchInfo | null;
  [key: string]: unknown;
}

interface ProductCardForCartProps {
  item: CartItem;
  onOpenCommentModal: (item: CartItem) => void;
  onOpenDeleteModal: (item: CartItem) => void;
  onOpenDiscountModal: (item: CartItem) => void;
  onOpenBatchInfoModal: (item: CartItem) => void;
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

const normalizeExpirationDate = (value: unknown): number | null => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const maybeTimestamp = value as { seconds?: number; toDate?: () => Date };
    if (typeof maybeTimestamp.seconds === 'number') {
      return maybeTimestamp.seconds * 1000;
    }
    if (typeof maybeTimestamp.toDate === 'function') {
      const dateValue = maybeTimestamp.toDate();
      return dateValue instanceof Date ? dateValue.getTime() : null;
    }
  }
  return null;
};

export const ProductCardForCart = ({
  item,
  onOpenCommentModal,
  onOpenDeleteModal,
  onOpenDiscountModal,
  onOpenBatchInfoModal,
}: ProductCardForCartProps) => {
  const dispatch = useDispatch();
  const insuranceEnabled = useInsuranceEnabled();
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled) as boolean;
  const [selectedUnit, setSelectedUnit] = useState<SaleUnit | null>(null);
  const [precios, setPrecios] = useState<PriceOption[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const hasBatchInfo = Boolean(item?.batchInfo || item?.batchId || item?.productStockId);
  const batchInfo = item.batchInfo ?? null;
  const expirationTimestamp = normalizeExpirationDate(batchInfo?.expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  const isExpired = expirationTimestamp !== null && expirationTimestamp < todayTimestamp;
  const formattedExpirationDate = expirationTimestamp
    ? new Date(expirationTimestamp).toLocaleDateString()
    : null;
  const showExpirationIndicator = Boolean(hasBatchInfo && expirationTimestamp !== null);
  const expirationTooltip = !showExpirationIndicator
    ? ''
    : `${isExpired ? 'Lote vencido' : 'Lote vigente'}${formattedExpirationDate ? ` · ${formattedExpirationDate}` : ''}`;

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
      case 'cardPrice':
        rawPrice = price.pricing.cardPrice;
        break;
      case 'offerPrice':
        rawPrice = price.pricing.offerPrice;
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
    ...(hasBatchInfo
      ? [
          {
            key: 'batch-info',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <InfoCircleOutlined style={{ color: '#4096ff' }} />
                Ver información del lote
              </span>
            ),
            onClick: () => onOpenBatchInfoModal(item),
          },
        ]
      : []),
  ];

  const hasActions = Boolean(item.comment || item.discount || hasBatchInfo);
  const finalPrice = getTotalPrice(item, taxReceiptEnabled);
  const originalPriceValue = item.pricing?.price ?? item.price ?? 0;
  const originalPrice = ensureNumber(originalPriceValue);
  const taxPercentage = ensureNumber(item.pricing?.tax);
  const quantity = item.amountToBuy ?? 1;
  const badgeColor = item.comment
    ? '#1890ff'
    : item.discount
    ? '#52c41a'
    : hasBatchInfo
    ? '#4096ff'
    : '#8c8c8c';
  const rawBatchNumber = batchInfo?.batchNumber
    ?? batchInfo?.batchNumberId
    ?? batchInfo?.batchId
    ?? item?.batchNumber
    ?? item?.batchId
    ?? null;
  const batchNumberLabel = rawBatchNumber != null && rawBatchNumber !== ''
    ? `Lote ${rawBatchNumber}`
    : null;
  const batchSummaryParts: string[] = [];
  if (batchNumberLabel) {
    batchSummaryParts.push(batchNumberLabel);
  }
  if (formattedExpirationDate) {
    batchSummaryParts.push(formattedExpirationDate);
  }
  const batchSummaryText = batchSummaryParts.join(' · ');
  const showBatchSummary = Boolean(hasBatchInfo && batchSummaryParts.length > 0);

  const handleBatchInfoKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenBatchInfoModal(item);
    }
  };

  const unitPriceWithTax = taxReceiptEnabled
    ? originalPrice * (1 + taxPercentage / 100)
    : originalPrice;
  const basePriceWithTax = unitPriceWithTax * quantity;

  const hasDiscount = (item.discount?.value ?? 0) > 0;

  return (
    <Container
      variants={variants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.6 }}
      $expired={isExpired}
    >
      <Row>
        <TopBar>
          <LeftSlot $hasBatch={hasBatchInfo}>
            {hasBatchInfo ? (
              showBatchSummary ? (
                <BatchSummaryInteractive
                  $expired={isExpired}
                  role="button"
                  tabIndex={0}
                  title={batchSummaryText}
                  onClick={() => onOpenBatchInfoModal(item)}
                  onKeyDown={handleBatchInfoKeyDown}
                >
                  <span className="summary-text">
                    {batchNumberLabel && (
                      <span className="batch-token">{batchNumberLabel}</span>
                    )}
                    {batchNumberLabel && formattedExpirationDate && (
                      <span className="separator"> · </span>
                    )}
                    {formattedExpirationDate && (
                      <span className="expiration-text">{formattedExpirationDate}</span>
                    )}
                  </span>
                  {showExpirationIndicator && (
                    <Tooltip title={expirationTooltip}>
                      <StatusIcon
                        icon={isExpired ? faCircleExclamation : faCircleCheck}
                        $expired={isExpired}
                        aria-label={isExpired ? 'Lote vencido' : 'Lote vigente'}
                      />
                    </Tooltip>
                  )}
                </BatchSummaryInteractive>
              ) : (
                <NameStack>
                  <TitleRow>
                    <TitleLabel>{item.name}</TitleLabel>
                    {showExpirationIndicator && (
                      <Tooltip title={expirationTooltip}>
                        <StatusIcon
                          icon={isExpired ? faCircleExclamation : faCircleCheck}
                          $expired={isExpired}
                          aria-label={isExpired ? 'Lote vencido' : 'Lote vigente'}
                        />
                      </Tooltip>
                    )}
                  </TitleRow>
                  {item.comment && (
                    <CommentPreview title={item.comment}>
                      {item.comment}
                    </CommentPreview>
                  )}
                </NameStack>
              )
            ) : (
              <NameStack>
                <TitleRow>
                  <TitleLabel>{item.name}</TitleLabel>
                  {showExpirationIndicator && (
                    <Tooltip title={expirationTooltip}>
                      <StatusIcon
                        icon={isExpired ? faCircleExclamation : faCircleCheck}
                        $expired={isExpired}
                        aria-label={isExpired ? 'Lote vencido' : 'Lote vigente'}
                      />
                    </Tooltip>
                  )}
                </TitleRow>
                {item.comment && (
                  <CommentPreview title={item.comment}>
                    {item.comment}
                  </CommentPreview>
                )}
              </NameStack>
            )}
          </LeftSlot>
          <RightCluster>
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
            <TopActions>
              <Tooltip title="Opciones del producto">
                <Badge dot={hasActions} color={badgeColor} offset={[-2, 2]}>
                  <Dropdown
                    menu={{ items: actionMenuItems }}
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<MoreOutlined style={{ fontSize: '16px', color: hasActions ? badgeColor : '#8c8c8c' }} />}
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
            </TopActions>
          </RightCluster>
        </TopBar>
      </Row>
      {hasBatchInfo && (
        <Row>
          <TitleContainer>
            <TitleRow>
              <TitleLabel>{item.name}</TitleLabel>
              {!showBatchSummary && showExpirationIndicator && (
                <Tooltip title={expirationTooltip}>
                  <StatusIcon
                    icon={isExpired ? faCircleExclamation : faCircleCheck}
                    $expired={isExpired}
                    aria-label={isExpired ? 'Lote vencido' : 'Lote vigente'}
                  />
                </Tooltip>
              )}
            </TitleRow>
            {item.comment && (
              <CommentPreview title={item.comment}>
                {item.comment}
              </CommentPreview>
            )}
          </TitleContainer>
        </Row>
      )}
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

const Container = styled(motion.div)<{ $expired: boolean }>`
    width: 100%;
    height: min-content;
    background-color: #ffffff;
    padding: 0.4em;
    border: 1px solid ${props => props.$expired ? '#dc2626' : 'rgba(0, 0, 0, 0.1)'};
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
  min-width: 0;
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

const TopBar = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
`;

const LeftSlot = styled.div<{ $hasBatch: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${props => (props.$hasBatch ? '0' : '2px')};
  min-width: 0;
  flex: 1;
`;

const RightCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BatchSummaryInteractive = styled.span<{ $expired: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13.2px;
  color: #1677ff;
  cursor: pointer;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover,
  &:focus {
    outline: none;
  }

  .summary-text {
    display: inline-block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .batch-token {
    text-decoration: underline;
    font-weight: 600;
  }

  .separator {
    color: #64748b;
  }

  .expiration-text {
    color: ${props => (props.$expired ? '#dc2626' : '#16a34a')};
    font-weight: 600;
  }
`;

const NameStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TitleLabel = styled.span`
    font-weight: 500;
    line-height: 16px;
    font-size: 14px;
    color: rgb(71, 71, 71);
    text-transform: capitalize;
    word-break: break-word;
`;

const TitleInteractive = styled.span`
    font-weight: 500;
    line-height: 16px;
    font-size: 14px;
    color: rgb(71, 71, 71);
    text-transform: capitalize;
    cursor: pointer;
    display: inline;
    word-break: break-word;

    &:hover,
    &:focus {
        text-decoration: underline;
        outline: none;
    }
`;

const Price = styled.span<{ hasDiscount: boolean }>`
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    padding: 0 10px;
    background-color: var(--White1);
    color: ${props => props.hasDiscount ? '#52c41a' : 'var(--Gray6)'};
`;

const StatusIcon = styled(FontAwesomeIcon)<{ $expired: boolean }>`
  font-size: 12px;
  color: ${props => (props.$expired ? '#dc2626' : '#16a34a')};
  flex-shrink: 0;
`;
