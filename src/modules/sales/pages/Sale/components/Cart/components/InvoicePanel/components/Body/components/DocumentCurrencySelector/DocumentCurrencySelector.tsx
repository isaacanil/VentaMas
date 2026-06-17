import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Select, Tag, Tooltip, Typography } from 'antd';
import {
  DollarOutlined,
  DownOutlined,
  InfoCircleOutlined,
  LockOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import {
  DEFAULT_FUNCTIONAL_CURRENCY,
  getCurrencyOptionLabel,
  normalizeSupportedDocumentCurrency,
} from '@/utils/accounting/currencies';

import {
  SelectCartData,
  setAccountingContext,
  setDocumentCurrency,
  setDocumentExchangeRate,
  setDocumentRateOverride,
} from '@/features/cart/cartSlice';
import type { CartData } from '@/features/cart/types';

import type {
  DocumentCurrencyConfig,
  DocumentCurrencyContext,
  SupportedDocumentCurrency,
} from './types';
import { resolveTimestampMillis } from './documentCurrencyDates';
import { useDocumentCurrencyConfig } from './useDocumentCurrencyConfig';
import { useClickOutSide } from '@/hooks/useClickOutSide';

const { Text } = Typography;

type CartManualRatesByCurrency = NonNullable<CartData['manualRatesByCurrency']>;
type CartManualRateConfig = NonNullable<
  CartManualRatesByCurrency[SupportedDocumentCurrency]
>;

const normalizeCartRateValue = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeCartEffectiveAt = (
  value: unknown,
): CartManualRateConfig['effectiveAt'] => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length) return value.trim();
  if (value instanceof Date) return value;
  return null;
};

const toComparableEffectiveAt = (value: unknown): number | string | null => {
  const normalized = normalizeCartEffectiveAt(value);
  return normalized instanceof Date ? normalized.getTime() : normalized;
};

const buildCartManualRatesByCurrency = (
  manualRatesByCurrency: DocumentCurrencyConfig['manualRatesByCurrency'],
): CartManualRatesByCurrency =>
  Object.entries(manualRatesByCurrency).reduce<CartManualRatesByCurrency>(
    (accumulator, [currency, rateConfig]) => {
      const nextRateConfig: CartManualRateConfig = {
        buyRate: normalizeCartRateValue(rateConfig?.purchase),
        sellRate: normalizeCartRateValue(rateConfig?.sale),
      };
      const effectiveAt = normalizeCartEffectiveAt(rateConfig?.effectiveAt);
      if (effectiveAt != null) {
        nextRateConfig.effectiveAt = effectiveAt;
      }
      accumulator[currency as SupportedDocumentCurrency] = nextRateConfig;
      return accumulator;
    },
    {},
  );

const areCartManualRateConfigsEqual = (
  current: CartManualRateConfig | null | undefined,
  next: CartManualRateConfig | null | undefined,
): boolean => {
  if (current == null || next == null) return current == null && next == null;

  return (
    normalizeCartRateValue(current.buyRate) ===
      normalizeCartRateValue(next.buyRate) &&
    normalizeCartRateValue(current.sellRate) ===
      normalizeCartRateValue(next.sellRate) &&
    Object.is(
      toComparableEffectiveAt(current.effectiveAt),
      toComparableEffectiveAt(next.effectiveAt),
    )
  );
};

const areCartManualRatesByCurrencyEqual = (
  current: CartManualRatesByCurrency | null | undefined,
  next: CartManualRatesByCurrency,
): boolean => {
  const currencies = new Set([
    ...Object.keys(current ?? {}),
    ...Object.keys(next),
  ]);

  for (const currency of currencies) {
    const normalizedCurrency = currency as SupportedDocumentCurrency;
    if (
      !areCartManualRateConfigsEqual(
        current?.[normalizedCurrency],
        next[normalizedCurrency],
      )
    ) {
      return false;
    }
  }

  return true;
};

const isSameLocalDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const isFreshDocumentCurrencyRate = (
  effectiveAt: unknown,
  now: Date = new Date(),
): boolean => {
  const millis = resolveTimestampMillis(effectiveAt);
  if (millis == null) return false;
  return isSameLocalDay(new Date(millis), now);
};

interface DocumentCurrencySelectorProps {
  businessId: string | null;
  onChange?: (context: DocumentCurrencyContext) => void;
}

export const DocumentCurrencySelector = ({
  businessId,
  onChange,
}: DocumentCurrencySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      floatingOffset(10),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });
  const { enabled, config, loading, error } =
    useDocumentCurrencyConfig(businessId);
  const cartData = useSelector(SelectCartData) as Pick<
    CartData,
    | 'documentCurrency'
    | 'exchangeRate'
    | 'functionalCurrency'
    | 'manualRatesByCurrency'
    | 'products'
    | 'rateOverride'
  >;
  const selectedCurrency: SupportedDocumentCurrency =
    normalizeSupportedDocumentCurrency(
      cartData?.documentCurrency,
      DEFAULT_FUNCTIONAL_CURRENCY,
    );
  const hasCartProducts = Array.isArray(cartData?.products)
    ? cartData.products.length > 0
    : false;
  const isBaseCurrencySelected = selectedCurrency === config.functionalCurrency;
  const foreignCurrencySelected = !isBaseCurrencySelected;
  const selectedRateConfig = config.manualRatesByCurrency[selectedCurrency];
  const displayedRate = foreignCurrencySelected ? selectedRateConfig?.sale : 1;
  const selectedRateFresh = foreignCurrencySelected
    ? isFreshDocumentCurrencyRate(selectedRateConfig?.effectiveAt)
    : true;
  const blockedReason =
    foreignCurrencySelected
      ? displayedRate == null || displayedRate <= 0
        ? `No hay tasa de venta ${selectedCurrency} -> ${config.functionalCurrency} configurada. Ajustala en Ajustes > Contabilidad antes de facturar en ${selectedCurrency}.`
        : !selectedRateFresh
          ? `La tasa de venta ${selectedCurrency} -> ${config.functionalCurrency} no esta vigente para hoy. Actualizala en Ajustes > Contabilidad antes de facturar en ${selectedCurrency}.`
          : undefined
      : undefined;
  const summaryTone = blockedReason
    ? 'error'
    : foreignCurrencySelected
      ? 'active'
      : 'idle';
  const summaryLabel = isBaseCurrencySelected
    ? `${selectedCurrency} base`
    : `${selectedCurrency} documento`;
  const summaryHelperText = error
    ? 'No se pudo cargar la configuración monetaria.'
    : blockedReason
      ? blockedReason
      : hasCartProducts
        ? 'La moneda queda fijada por los productos del carrito.'
        : isBaseCurrencySelected
          ? `Documento emitido en ${config.functionalCurrency}.`
          : `Documento emitido en ${selectedCurrency}.`;
  const currencyTooltip = hasCartProducts
    ? 'Vacía el carrito para cambiar la moneda del documento.'
    : 'Selecciona la moneda en que se emitirá la factura.';
  const infoTooltip = isBaseCurrencySelected
    ? `La contabilidad funcional sigue registrándose en ${config.functionalCurrency}.`
    : `La contabilidad funcional se resolverá en ${config.functionalCurrency} usando la tasa de venta activa.`;
  const setReference = useCallback(
    (node: HTMLElement | null) => refs.setReference(node),
    [refs],
  );
  const setFloating = useCallback(
    (node: HTMLElement | null) => refs.setFloating(node),
    [refs],
  );

  useClickOutSide(widgetRef, isOpen, () => setIsOpen(false));

  const context = useMemo<DocumentCurrencyContext>(() => {
    const base: DocumentCurrencyContext = {
      documentCurrency: selectedCurrency,
    };

    if (blockedReason) {
      base.blockedReason = blockedReason;
    }

    if (
      foreignCurrencySelected &&
      selectedRateFresh &&
      displayedRate != null &&
      displayedRate > 0
    ) {
      base.exchangeRate = displayedRate;
      base.rateType = 'sell';
    }

    return base;
  }, [
    blockedReason,
    displayedRate,
    foreignCurrencySelected,
    selectedCurrency,
    selectedRateFresh,
  ]);

  const nextAccountingContext = useMemo(
    () => ({
      functionalCurrency: config.functionalCurrency,
      manualRatesByCurrency: buildCartManualRatesByCurrency(
        config.manualRatesByCurrency,
      ),
    }),
    [config.functionalCurrency, config.manualRatesByCurrency],
  );

  const nextExchangeRate =
    selectedCurrency === config.functionalCurrency
      ? 1
      : selectedRateFresh
        ? normalizeCartRateValue(selectedRateConfig?.sale)
        : null;

  useEffect(() => {
    if (loading) return;

    if (
      cartData?.functionalCurrency === nextAccountingContext.functionalCurrency &&
      areCartManualRatesByCurrencyEqual(
        cartData?.manualRatesByCurrency,
        nextAccountingContext.manualRatesByCurrency,
      )
    ) {
      return;
    }

    dispatch(setAccountingContext(nextAccountingContext));
  }, [
    cartData?.functionalCurrency,
    cartData?.manualRatesByCurrency,
    dispatch,
    loading,
    nextAccountingContext,
  ]);

  useEffect(() => {
    if (cartData?.rateOverride != null) {
      dispatch(setDocumentRateOverride(null));
    }

    if (cartData?.exchangeRate === nextExchangeRate) return;

    dispatch(setDocumentExchangeRate(nextExchangeRate));
  }, [
    cartData?.exchangeRate,
    cartData?.rateOverride,
    dispatch,
    nextExchangeRate,
  ]);

  useEffect(() => {
    onChange?.(context);
  }, [context, onChange]);

  const handleCurrencyChange = (value: SupportedDocumentCurrency) => {
    if (hasCartProducts) return;
    dispatch(setDocumentCurrency(value));
    dispatch(setDocumentRateOverride(null));
    if (value === config.functionalCurrency) {
      dispatch(setDocumentExchangeRate(1));
      return;
    }
    const nextRate = config.manualRatesByCurrency[value];
    dispatch(
      setDocumentExchangeRate(
        isFreshDocumentCurrencyRate(nextRate?.effectiveAt) ? nextRate?.sale : null,
      ),
    );
  };

  if (!enabled || loading) return null;

  if (error) {
    return (
      <ErrorWidget>
        <SummaryContent>
          <SummaryHeading>
            <DollarOutlined />
            <Text strong>Moneda del documento</Text>
          </SummaryHeading>
          <SummaryMeta>
            <WarningTag color="warning">Configuración no disponible</WarningTag>
          </SummaryMeta>
        </SummaryContent>
        <Text type="secondary">
          La factura se emitirá en {config.functionalCurrency} hasta recuperar
          la configuración monetaria.
        </Text>
      </ErrorWidget>
    );
  }

  const currencyOptions = config.documentCurrencies.map((code) => ({
    value: code,
    label: getCurrencyOptionLabel(code),
  }));

  return (
    <Wrapper ref={widgetRef}>
      <SummaryButton
        ref={setReference}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        $tone={summaryTone}
      >
        <SummaryContent>
          <SummaryHeading>
            <DollarOutlined />
            <Text strong>Moneda del documento</Text>
          </SummaryHeading>
          <SummaryMeta>
            <Tag color={foreignCurrencySelected ? 'green' : 'default'}>
              {summaryLabel}
            </Tag>
            {foreignCurrencySelected && (
              <Tag
                color={
                  displayedRate != null && displayedRate > 0 && selectedRateFresh
                    ? 'green'
                    : 'red'
                }
              >
                {displayedRate != null && displayedRate > 0
                  ? selectedRateFresh
                    ? `Venta ${displayedRate}`
                    : 'Tasa vencida'
                  : 'Sin tasa'}
              </Tag>
            )}
            {hasCartProducts && (
              <Tooltip title={currencyTooltip}>
                <StatusIcon>
                  <LockOutlined />
                </StatusIcon>
              </Tooltip>
            )}
            <Tooltip title={infoTooltip}>
              <StatusIcon>
                <InfoCircleOutlined />
              </StatusIcon>
            </Tooltip>
            <Chevron $expanded={isOpen} />
          </SummaryMeta>
        </SummaryContent>
        <SummaryFooter>
          <Text type={blockedReason ? 'danger' : 'secondary'}>
            {summaryHelperText}
          </Text>
        </SummaryFooter>
      </SummaryButton>

      {isOpen && (
        <FloatingPanel
          ref={setFloating}
          style={floatingStyles}
        >
          <PanelRow>
            <FieldLabel>
              Moneda de la factura
              <Tooltip title={currencyTooltip}>
                <InfoCircleOutlined />
              </Tooltip>
            </FieldLabel>
            <Select
              value={selectedCurrency}
              onChange={handleCurrencyChange}
              options={currencyOptions}
              style={{ width: '100%' }}
              size="middle"
              disabled={hasCartProducts}
            />
          </PanelRow>

          <InfoRow>
            <Text type="secondary">Moneda funcional</Text>
            <Tag>{config.functionalCurrency}</Tag>
          </InfoRow>

          <InfoRow>
            <Text type="secondary">Política de tasa</Text>
            <Tag color="blue">Solo desde ajustes</Tag>
          </InfoRow>

          {foreignCurrencySelected && (
            <>
              <InfoRow>
                <Text type="secondary">
                  Tasa venta {selectedCurrency} -&gt; {config.functionalCurrency}
                </Text>
                {displayedRate != null && displayedRate > 0 && selectedRateFresh ? (
                  <Tag color="green">{displayedRate}</Tag>
                ) : displayedRate != null && displayedRate > 0 ? (
                  <Tag color="red">Tasa vencida</Tag>
                ) : (
                  <Tag color="red">Sin configurar</Tag>
                )}
              </InfoRow>

              {blockedReason && (
                <InlineState $tone="error">
                  <WarningOutlined />
                  <Text type="danger">{blockedReason}</Text>
                </InlineState>
              )}
            </>
          )}
        </FloatingPanel>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
`;

const SummaryButton = styled.button<{ $tone: 'idle' | 'active' | 'error' }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'error' ? '#ffccc7' : $tone === 'active' ? '#b7eb8f' : '#d9d9d9'};
  border-radius: 10px;
  background: ${({ $tone }) =>
    $tone === 'error' ? '#fff2f0' : $tone === 'active' ? '#f6ffed' : '#fafafa'};
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;

  &:hover {
    border-color: ${({ $tone }) =>
      $tone === 'error' ? '#ff7875' : $tone === 'active' ? '#95de64' : '#bfbfbf'};
  }
`;

const SummaryContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
`;

const SummaryHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const SummaryMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const SummaryFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const Chevron = styled(DownOutlined)<{ $expanded: boolean }>`
  color: rgba(0, 0, 0, 0.45);
  transition: transform 0.16s ease;
  transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
`;

const StatusIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.45);
`;

const FloatingPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(0 0 0 / 12%);
  z-index: 1200;
`;

const PanelRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const InlineState = styled.div<{ $tone: 'error' }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #ffccc7;
  background: #fff2f0;
`;

const WarningTag = styled(Tag)`
  margin-inline-end: 0;
`;

const ErrorWidget = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #ffccc7;
  border-radius: 10px;
  background: #fff2f0;
`;
