import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
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
  DocumentCurrencyContext,
  SupportedDocumentCurrency,
} from './types';
import { useDocumentCurrencyConfig } from './useDocumentCurrencyConfig';
import { useClickOutSide } from '@/hooks/useClickOutSide';

const { Text } = Typography;

const resolveTimestampMillis = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) ? millis : null;
  }
  if (typeof value === 'object') {
    const record = value as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof record.toMillis === 'function') {
      const millis = Number(record.toMillis());
      return Number.isFinite(millis) ? millis : null;
    }
    if (typeof record.toDate === 'function') {
      const date = record.toDate();
      if (date instanceof Date) {
        const millis = date.getTime();
        return Number.isFinite(millis) ? millis : null;
      }
    }
    const seconds = Number(record.seconds ?? record._seconds);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
  }

  return null;
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
    middleware: [floatingOffset(10), flip({ padding: 8 }), shift({ padding: 8 })],
  });
  const { enabled, config, loading, error } =
    useDocumentCurrencyConfig(businessId);
  const cartData = useSelector(SelectCartData) as Pick<
    CartData,
    'documentCurrency' | 'products'
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
  const referenceWidth =
    refs.reference.current instanceof HTMLElement
      ? refs.reference.current.getBoundingClientRect().width
      : null;
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

  useEffect(() => {
    if (loading) return;

    dispatch(
      setAccountingContext({
        functionalCurrency: config.functionalCurrency,
        manualRatesByCurrency: config.manualRatesByCurrency,
      }),
    );
  }, [
    config.functionalCurrency,
    config.manualRatesByCurrency,
    dispatch,
    loading,
  ]);

  useEffect(() => {
    dispatch(setDocumentRateOverride(null));
    if (selectedCurrency === config.functionalCurrency) {
      dispatch(setDocumentExchangeRate(1));
      return;
    }

    dispatch(
      setDocumentExchangeRate(
        selectedRateFresh ? selectedRateConfig?.sale : null,
      ),
    );
  }, [
    config.functionalCurrency,
    dispatch,
    selectedRateConfig?.sale,
    selectedRateConfig?.effectiveAt,
    selectedCurrency,
    selectedRateFresh,
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
          style={{
            ...floatingStyles,
            width: referenceWidth ?? undefined,
          }}
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
