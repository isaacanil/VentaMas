import {
  MessageOutlined,
  PercentageOutlined,
  MoreOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
} from '@/constants/icons/antd';
import {
  faCircleCheck,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip, Badge, Button } from 'antd';
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { VmDropdown } from '@/components/heroui';
import { icons } from '@/constants/icons/icons';
import {
  changeProductPrice,
  SelectSettingCart,
  selectCartDocumentCurrency,
} from '@/features/cart/cartSlice';
import { openProductStockSimple } from '@/features/productStock/productStockSimpleSlice';
import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { useInsuranceEnabled } from '@/modules/insurance/public';
import {
  getFunctionalProductTotal,
  resolveProductLineCurrency,
} from '@/utils/accounting/lineMonetary';
import {
  normalizeSaleUnitForCart,
  resolveProductBaseQuantity,
  resolveSaleUnitConversionFactor,
  resolveSaleUnitLabel,
} from '@/domain/products/saleUnits';
import { getWeightedUnitPriceForDisplay } from '@/domain/products/weightPriceDisplay';
import { resolveAvailableBaseStockForLine } from '@/modules/sales/pages/Sale/utils/cartPhysicalStockUsage';
import { formatPriceByCurrency } from '@/utils/format';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import { getTotalPrice } from '@/utils/pricing';
import PriceAndSaleUnitsModal from './components/PriceAndSaleUnitsModal/PriceAndSaleUnitsModal';

import {
  CartQuantityCounter,
  type CartQuantityCounterItem,
} from './components/CartQuantityCounter/CartQuantityCounter';
import { InsuranceCoverage } from './components/InsuranceCoverage/InsuranceCoverage';
import { PriceEditor } from './components/PriceEditor/PriceEditor';
import { WeightInput } from './components/WeightInput/WeightInput';
import { extraerPreciosConImpuesto } from './utils/priceUtils';
import { ServiceCommissionControl } from './components/ServiceCommissionControl/ServiceCommissionControl';
import {
  BatchSummaryInteractive,
  CommentPreview,
  Container,
  Group,
  LeftSlot,
  NameStack,
  OriginalPrice,
  Price,
  PriceContainer,
  PriceMetaRow,
  ProductActionMenuButton,
  ProductActionMenuItemIcon,
  ProductActionMenuItemLabel,
  ProductActionMenuPopover,
  RightCluster,
  Row,
  SelectionWarning,
  SourcePriceNote,
  StatusIcon,
  TitleContainer,
  TitleLabel,
  TitleRow,
  TopActions,
  TopBar,
  type ProductActionMenuTone,
} from './ProductCardForCart.styles';
import {
  isServiceCommissionEligible,
  normalizeServiceCommissionSettings,
} from '@/utils/commissions/serviceCommissions';

import type {
  PricingTax,
  ProductBatchInfo,
  ProductRecord,
  ProductPricing,
  ProductSaleUnit,
  SupportedDocumentCurrency,
} from '@/types/products';
import type { InvoiceProduct } from '@/types/invoice';
import type { PriceOption } from './utils/priceUtils';
import type {
  CartSettings,
  Product as CartProduct,
} from '@/features/cart/types';

interface DiscountInfo {
  value?: number;
  type?: string;
  [key: string]: unknown;
}

type PricingCarrier = {
  pricing?: ProductPricing | null;
};

type PriceEditorItem = Parameters<typeof PriceEditor>[0]['item'];
type InsuranceItem = Parameters<typeof InsuranceCoverage>[0]['item'];
type SaleUnitItem = Parameters<typeof PriceAndSaleUnitsModal>[0]['item'];

type TimestampLike = {
  seconds?: number;
  toDate?: () => Date;
};

type BatchInfo = Omit<ProductBatchInfo, 'expirationDate'> & {
  expirationDate?: number | string | TimestampLike | null;
  batchNumberId?: string | number | null;
};

export type CartItem = CartProduct & {
  batchNumber?: string | number | null;
  batchInfo?: BatchInfo | null;
  pricing?: ProductPricing & { price?: number | string };
  discount?: DiscountInfo | null;
};

type SaleUnitRecord = Partial<ProductSaleUnit> & { id: string };

type ProductActionMenuItem = {
  key: string;
  label: string;
  icon: ReactNode;
  tone: ProductActionMenuTone;
  onClick: () => void;
};

interface ProductCardForCartProps {
  cartProducts?: CartProduct[];
  item: CartItem;
  onOpenCommentModal: (item: CartItem) => void;
  onOpenDeleteModal: (item: CartItem) => void;
  onOpenDiscountModal: (item: CartItem) => void;
  onOpenBatchInfoModal: (item: CartItem) => void;
  onOpenServiceCommissionModal: (item: CartProduct) => void;
}

const ensureNumber = (
  value: PricingTax | number | string | undefined | null,
): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value && typeof value === 'object' && 'tax' in value) {
    const taxValue = value.tax;
    if (typeof taxValue === 'number') return taxValue;
    if (typeof taxValue === 'string') {
      const parsed = Number.parseFloat(taxValue);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
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

const getBatchIdentifier = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  return null;
};

export const ProductCardForCart = ({
  cartProducts,
  item,
  onOpenCommentModal,
  onOpenDeleteModal,
  onOpenDiscountModal,
  onOpenBatchInfoModal,
  onOpenServiceCommissionModal,
}: ProductCardForCartProps) => {
  const dispatch = useDispatch();
  const insuranceEnabled = Boolean(useInsuranceEnabled());
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled) as boolean;
  const cartSettings = useSelector(SelectSettingCart) as CartSettings;
  const documentCurrency = useSelector(
    selectCartDocumentCurrency,
  ) as SupportedDocumentCurrency;
  const serviceCommissionSettings = normalizeServiceCommissionSettings(
    cartSettings?.billing?.serviceCommissions,
  );
  const [selectedUnit, setSelectedUnit] = useState<SaleUnitRecord | null>(null);
  const [precios, setPrecios] = useState<PriceOption[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const hasBatchInfo = Boolean(
    item?.batchInfo || item?.batchId || item?.productStockId,
  );
  const batchInfo = item.batchInfo ?? null;
  const expirationTimestamp = normalizeExpirationDate(
    batchInfo?.expirationDate,
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  const isExpired =
    expirationTimestamp !== null && expirationTimestamp < todayTimestamp;
  const formattedExpirationDate = expirationTimestamp
    ? formatLocaleDate(expirationTimestamp)
    : null;
  const showExpirationIndicator = Boolean(
    hasBatchInfo && expirationTimestamp !== null,
  );
  const lineId = item.cid || item.id;
  const requiresPhysicalSelection = Boolean(
    item?.restrictSaleWithoutStock && (!item?.productStockId || !item?.batchId),
  );
  const editableBaseStock = resolveAvailableBaseStockForLine({
    cartProducts,
    line: item,
  });
  const weightInputItem =
    editableBaseStock === null
      ? item
      : {
          ...item,
          stock: editableBaseStock,
        };
  const expirationTooltip = !showExpirationIndicator
    ? ''
    : `${isExpired ? 'Lote vencido' : 'Lote vigente'}${formattedExpirationDate ? ` · ${formattedExpirationDate}` : ''}`;

  const updatePricing = (pricing?: ProductPricing | null) => {
    const pricesWithTax = extraerPreciosConImpuesto(pricing, taxReceiptEnabled);
    setPrecios(pricesWithTax);
  };

  const handleSelectUnit = (unit: SaleUnitRecord | null) => {
    if (!unit) {
      setSelectedUnit(null);
      updatePricing(undefined);
      return;
    }

    setSelectedUnit(unit);
    updatePricing(unit.pricing);
  };

  const handleSelectDefaultUnit = (unit: PricingCarrier) => {
    setSelectedUnit(null);
    updatePricing(unit?.pricing);
  };

  const handleSelectPrice = (
    price: PriceOption,
    saleUnit?: SaleUnitRecord | null,
  ) => {
    const nextPricing = price.pricing ?? item.pricing ?? null;
    updatePricing(nextPricing);

    let rawPrice: number | string | undefined;

    switch (price.type) {
      case 'listPrice':
        rawPrice = nextPricing?.listPrice;
        break;
      case 'avgPrice':
        rawPrice = nextPricing?.avgPrice;
        break;
      case 'minPrice':
        rawPrice = nextPricing?.minPrice;
        break;
      case 'cardPrice':
        rawPrice = nextPricing?.cardPrice;
        break;
      case 'offerPrice':
        rawPrice = nextPricing?.offerPrice;
        break;
      default:
        rawPrice = nextPricing?.listPrice;
    }

    let numericPrice: number | null = null;

    if (typeof rawPrice === 'number') {
      numericPrice = rawPrice;
    } else if (typeof rawPrice === 'string' && rawPrice !== 'N/A') {
      const parsed = Number.parseFloat(rawPrice);
      numericPrice = Number.isNaN(parsed) ? null : parsed;
    }

    if (numericPrice !== null) {
      const selectedSaleUnit = saleUnit
        ? normalizeSaleUnitForCart(saleUnit as ProductSaleUnit, numericPrice)
        : null;
      dispatch(
        changeProductPrice({
          id: lineId,
          pricing: selectedSaleUnit ? undefined : nextPricing || undefined,
          saleUnit: selectedSaleUnit,
          price: numericPrice,
        }),
      );
    }

    setModalVisible(false);
  };

  const actionMenuItems: ProductActionMenuItem[] = [
    ...(requiresPhysicalSelection
      ? [
          {
            key: 'select-physical-stock',
            label: 'Seleccionar ubicación',
            icon: <EnvironmentOutlined />,
            tone: 'warning' as const,
            onClick: () =>
              dispatch(
                openProductStockSimple(item as unknown as ProductRecord),
              ),
          },
        ]
      : []),
    {
      key: 'discount',
      label: item.discount ? 'Editar descuento' : 'Aplicar descuento',
      icon: <PercentageOutlined />,
      tone: item.discount ? 'success' : 'neutral',
      onClick: () => onOpenDiscountModal(item),
    },
    {
      key: 'comment',
      label: item.comment ? 'Editar comentario' : 'Agregar comentario',
      icon: <MessageOutlined />,
      tone: item.comment ? 'info' : 'neutral',
      onClick: () => onOpenCommentModal(item),
    },
    ...(hasBatchInfo
      ? [
          {
            key: 'batch-info',
            label: 'Ver información del lote',
            icon: <InfoCircleOutlined />,
            tone: 'info' as const,
            onClick: () => onOpenBatchInfoModal(item),
          },
        ]
      : []),
  ];

  const hasActions = Boolean(
    requiresPhysicalSelection || item.comment || item.discount || hasBatchInfo,
  );
  const activePricing =
    (item.selectedSaleUnit?.pricing as typeof item.pricing | undefined) ??
    item.pricing;
  const finalPrice = getTotalPrice(item as InvoiceProduct, taxReceiptEnabled);
  const originalPriceValue = activePricing?.price ?? 0;
  const originalPrice = ensureNumber(originalPriceValue);
  const taxPercentage = ensureNumber(activePricing?.tax);
  const quantity = item.amountToBuy ?? 1;
  const badgeColor = item.comment
    ? '#1890ff'
    : item.discount
      ? '#52c41a'
      : requiresPhysicalSelection
        ? '#d97706'
        : hasBatchInfo
          ? '#4096ff'
          : '#8c8c8c';
  const rawBatchNumber =
    getBatchIdentifier(batchInfo?.batchNumber) ??
    getBatchIdentifier(batchInfo?.batchNumberId) ??
    getBatchIdentifier(batchInfo?.batchId) ??
    getBatchIdentifier(item?.batchNumber) ??
    getBatchIdentifier(item?.batchId);
  const batchNumberLabel =
    rawBatchNumber != null && rawBatchNumber !== ''
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
  const showBatchSummary = Boolean(
    hasBatchInfo && batchSummaryParts.length > 0,
  );
  const showServiceCommissionControl = Boolean(
    serviceCommissionSettings.enabled && isServiceCommissionEligible(item),
  );
  const saleUnitLabel = resolveSaleUnitLabel(item.selectedSaleUnit);
  const baseQuantity = resolveProductBaseQuantity(item);
  const effectiveSelectedUnit =
    selectedUnit ??
    (item.selectedSaleUnit?.id
      ? (item.selectedSaleUnit as SaleUnitRecord)
      : null);

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
  const sourceCurrency = resolveProductLineCurrency(item, documentCurrency);
  const usesConvertedDocumentPrice = sourceCurrency !== documentCurrency;
  const exchangeRate = Number(item?.monetary?.exchangeRate ?? 1) || 1;
  const displayedFinalPrice = usesConvertedDocumentPrice
    ? getFunctionalProductTotal(item as InvoiceProduct, taxReceiptEnabled)
    : finalPrice;
  const displayedOriginalPrice = usesConvertedDocumentPrice
    ? Number((basePriceWithTax * exchangeRate).toFixed(2))
    : basePriceWithTax;
  const weightedUnitPrice =
    item.weightDetail?.isSoldByWeight === true
      ? getWeightedUnitPriceForDisplay(item as ProductRecord, taxReceiptEnabled)
      : null;
  const displayedWeightedUnitPrice =
    weightedUnitPrice !== null
      ? usesConvertedDocumentPrice
        ? Number((weightedUnitPrice * exchangeRate).toFixed(2))
        : weightedUnitPrice
      : null;
  const weightedUnitPriceLabel =
    displayedWeightedUnitPrice !== null
      ? `Precio unitario ${formatPriceByCurrency(
          displayedWeightedUnitPrice,
          documentCurrency,
        )} / ${item.weightDetail?.weightUnit ?? 'unidad'}`
      : null;

  const priceEditableItem: PriceEditorItem = {
    id: lineId,
    pricing: activePricing,
    price: originalPriceValue,
    weightDetail: item.weightDetail,
  };

  const counterItem: CartQuantityCounterItem = {
    restrictSaleWithoutStock: item.restrictSaleWithoutStock,
    saleUnitConversionFactor: resolveSaleUnitConversionFactor(
      item.selectedSaleUnit,
    ),
    allowFractional: item.selectedSaleUnit?.allowFractional === true,
  };

  const insuranceItem: InsuranceItem = {
    id: lineId,
    cid: item.cid,
    insurance: item.insurance,
    pricing: activePricing,
  };

  const saleUnitItem: SaleUnitItem = {
    ...item,
    pricing: item.pricing,
  } as any;

  return (
    <Container $expired={isExpired}>
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
                      <span className="expiration-text">
                        {formattedExpirationDate}
                      </span>
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
                          aria-label={
                            isExpired ? 'Lote vencido' : 'Lote vigente'
                          }
                        />
                      </Tooltip>
                    )}
                  </TitleRow>
                  {item.comment && (
                    <CommentPreview title={item.comment}>
                      {item.comment}
                    </CommentPreview>
                  )}
                  {weightedUnitPriceLabel && (
                    <CommentPreview title={weightedUnitPriceLabel}>
                      {weightedUnitPriceLabel}
                    </CommentPreview>
                  )}
                  {requiresPhysicalSelection && (
                    <SelectionWarning>
                      Selecciona ubicación o lote antes de facturar
                    </SelectionWarning>
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
                {saleUnitLabel && (
                  <CommentPreview
                    title={`${saleUnitLabel} · descuenta ${baseQuantity}`}
                  >
                    {saleUnitLabel} · descuenta {baseQuantity}
                  </CommentPreview>
                )}
                {weightedUnitPriceLabel && (
                  <CommentPreview title={weightedUnitPriceLabel}>
                    {weightedUnitPriceLabel}
                  </CommentPreview>
                )}
                {requiresPhysicalSelection && (
                  <SelectionWarning>
                    Selecciona ubicación o lote antes de facturar
                  </SelectionWarning>
                )}
              </NameStack>
            )}
          </LeftSlot>
          <RightCluster>
            <PriceContainer>
              {usesConvertedDocumentPrice && (
                <PriceMetaRow>
                  <SourcePriceNote>
                    Orig. {formatPriceByCurrency(finalPrice, sourceCurrency)}
                  </SourcePriceNote>
                </PriceMetaRow>
              )}
              {hasDiscount && (
                <OriginalPrice>
                  {formatPriceByCurrency(
                    displayedOriginalPrice,
                    documentCurrency,
                  )}
                </OriginalPrice>
              )}
              <Price $hasDiscount={hasDiscount}>
                {formatPriceByCurrency(displayedFinalPrice, documentCurrency)}
              </Price>
            </PriceContainer>
            <TopActions>
              <Tooltip title="Opciones del producto">
                <Badge dot={hasActions} color={badgeColor} offset={[-2, 2]}>
                  <VmDropdown>
                    <ProductActionMenuButton
                      isIconOnly
                      size="sm"
                      aria-label="Opciones del producto"
                    >
                      <MoreOutlined
                        style={{
                          fontSize: '16px',
                          color: hasActions ? badgeColor : '#8c8c8c',
                        }}
                      />
                    </ProductActionMenuButton>
                    <ProductActionMenuPopover placement="bottom end">
                      <VmDropdown.Menu
                        aria-label="Opciones del producto"
                        onAction={(key) => {
                          const selectedItem = actionMenuItems.find(
                            (menuItem) => menuItem.key === String(key),
                          );
                          selectedItem?.onClick();
                        }}
                      >
                        {actionMenuItems.map((menuItem) => (
                          <VmDropdown.Item
                            key={menuItem.key}
                            id={menuItem.key}
                            textValue={menuItem.label}
                          >
                            <ProductActionMenuItemLabel>
                              <ProductActionMenuItemIcon $tone={menuItem.tone}>
                                {menuItem.icon}
                              </ProductActionMenuItemIcon>
                              <span>{menuItem.label}</span>
                            </ProductActionMenuItemLabel>
                          </VmDropdown.Item>
                        ))}
                      </VmDropdown.Menu>
                    </ProductActionMenuPopover>
                  </VmDropdown>
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
            {saleUnitLabel && (
              <CommentPreview
                title={`${saleUnitLabel} · descuenta ${baseQuantity}`}
              >
                {saleUnitLabel} · descuenta {baseQuantity}
              </CommentPreview>
            )}
            {weightedUnitPriceLabel && (
              <CommentPreview title={weightedUnitPriceLabel}>
                {weightedUnitPriceLabel}
              </CommentPreview>
            )}
            {requiresPhysicalSelection && (
              <SelectionWarning>
                Selecciona ubicación o lote antes de facturar
              </SelectionWarning>
            )}
          </TitleContainer>
        </Row>
      )}
      <Row>
        <Group>
          <PriceEditor
            item={priceEditableItem}
            onModalOpen={() => setModalVisible(true)}
          />
          {item?.weightDetail?.isSoldByWeight ? (
            <WeightInput item={weightInputItem} />
          ) : (
            <CartQuantityCounter
              item={counterItem}
              amountToBuy={item.amountToBuy}
              stock={item?.stock}
              id={lineId}
            />
          )}
        </Group>
      </Row>

      {insuranceEnabled && <InsuranceCoverage item={insuranceItem} />}

      {showServiceCommissionControl && (
        <ServiceCommissionControl
          documentCurrency={documentCurrency}
          item={item}
          onOpen={onOpenServiceCommissionModal}
          settings={serviceCommissionSettings}
        />
      )}

      <PriceAndSaleUnitsModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        prices={precios}
        selectedUnit={effectiveSelectedUnit}
        onSelectDefaultUnit={handleSelectDefaultUnit}
        item={saleUnitItem}
        onSelectPrice={handleSelectPrice}
        onSelectUnit={handleSelectUnit}
      />
    </Container>
  );
};
