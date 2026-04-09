import { Button, Empty } from 'antd';
import styled, { css } from 'styled-components';

import { getCurrencyLabel } from '@/utils/accounting/currencies';

import type {
  AccountingManualRatesByCurrency,
  SupportedDocumentCurrency,
} from '../utils/accountingConfig';
import type { ExchangeRateReferenceSnapshot } from '../utils/exchangeRateReference';

const EMPTY_CURRENCIES: SupportedDocumentCurrency[] = [];
const EMPTY_MANUAL_RATES: AccountingManualRatesByCurrency = {};

const dateTimeFormatter = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const rateFormatter = new Intl.NumberFormat('es-DO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('es-DO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type DeltaTone = 'neutral' | 'success' | 'warning' | 'danger';

interface ExchangeRatesWorkspaceProps {
  currencies?: SupportedDocumentCurrency[];
  functionalCurrency: SupportedDocumentCurrency;
  hasUnsavedChanges: boolean;
  manualRatesByCurrency?: AccountingManualRatesByCurrency;
  onAddRateClick: () => void;
  reference: ExchangeRateReferenceSnapshot | null;
  saving: boolean;
}

const toMillis = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const record = value as {
      toMillis?: () => number;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };

    if (typeof record.toMillis === 'function') {
      const parsed = record.toMillis();
      return Number.isFinite(parsed) ? parsed : null;
    }

    const seconds =
      typeof record.seconds === 'number'
        ? record.seconds
        : typeof record._seconds === 'number'
          ? record._seconds
          : null;
    const nanoseconds =
      typeof record.nanoseconds === 'number'
        ? record.nanoseconds
        : typeof record._nanoseconds === 'number'
          ? record._nanoseconds
          : 0;

    if (seconds != null) {
      return seconds * 1000 + Math.floor(nanoseconds / 1e6);
    }
  }

  return null;
};

const formatDateTime = (value: unknown): string | null => {
  const millis = toMillis(value);
  return millis == null ? null : dateTimeFormatter.format(new Date(millis));
};

const formatRate = (value: number | null | undefined): string =>
  value == null || Number.isNaN(value)
    ? 'Sin tasa'
    : rateFormatter.format(value);

const getDeltaValue = (
  manualRate: number | null | undefined,
  referenceRate: number | null | undefined,
): number | null => {
  if (
    manualRate == null ||
    referenceRate == null ||
    Number.isNaN(manualRate) ||
    Number.isNaN(referenceRate) ||
    referenceRate === 0
  ) {
    return null;
  }

  return ((manualRate - referenceRate) / referenceRate) * 100;
};

const formatDelta = (
  manualRate: number | null | undefined,
  referenceRate: number | null | undefined,
): string => {
  const delta = getDeltaValue(manualRate, referenceRate);
  if (delta == null) {
    return 'Sin comparar';
  }

  return `${delta >= 0 ? '+' : ''}${percentFormatter.format(delta)}%`;
};

const getDeltaTone = (
  manualRate: number | null | undefined,
  referenceRate: number | null | undefined,
): DeltaTone => {
  const delta = getDeltaValue(manualRate, referenceRate);
  if (delta == null) {
    return 'neutral';
  }

  const magnitude = Math.abs(delta);
  if (magnitude < 1) {
    return 'success';
  }
  if (magnitude < 3) {
    return 'warning';
  }

  return 'danger';
};

const getRowStatus = ({
  buyRate,
  sellRate,
  referenceRate,
}: {
  buyRate: number | null | undefined;
  sellRate: number | null | undefined;
  referenceRate: number | null | undefined;
}): { label: string; tone: DeltaTone } => {
  const buyDelta = getDeltaValue(buyRate, referenceRate);
  const sellDelta = getDeltaValue(sellRate, referenceRate);

  if (referenceRate == null || Number.isNaN(referenceRate)) {
    return { label: 'Sin referencia', tone: 'neutral' };
  }

  if (buyDelta == null && sellDelta == null) {
    return { label: 'Sin tasas', tone: 'neutral' };
  }

  const magnitude = Math.max(Math.abs(buyDelta ?? 0), Math.abs(sellDelta ?? 0));

  if (magnitude < 1) {
    return { label: 'Normal', tone: 'success' };
  }
  if (magnitude < 3) {
    return { label: 'Desviada', tone: 'warning' };
  }

  return { label: 'Crítica', tone: 'danger' };
};

const toneStyles = {
  neutral: css`
    color: var(--ds-color-text-secondary);
    background: var(--ds-color-bg-subtle);
    border-color: var(--ds-color-border-default);
  `,
  success: css`
    color: var(--ds-color-state-success-text);
    background: var(--ds-color-state-success-subtle);
    border-color: var(--ds-color-state-success);
  `,
  warning: css`
    color: var(--ds-color-state-warning-text);
    background: var(--ds-color-state-warning-subtle);
    border-color: var(--ds-color-state-warning);
  `,
  danger: css`
    color: var(--ds-color-state-danger-text);
    background: var(--ds-color-state-danger-subtle);
    border-color: var(--ds-color-state-danger);
  `,
};

const tableColumns =
  'minmax(184px, 1.8fr) repeat(3, minmax(108px, 0.9fr)) repeat(2, minmax(124px, 1fr)) minmax(104px, 0.9fr)';

export const ExchangeRatesWorkspace = ({
  currencies = EMPTY_CURRENCIES,
  functionalCurrency,
  hasUnsavedChanges,
  manualRatesByCurrency = EMPTY_MANUAL_RATES,
  onAddRateClick,
  reference,
  saving,
}: ExchangeRatesWorkspaceProps) => {
  const configuredRatesCount = currencies.filter((currency) => {
    const rates = manualRatesByCurrency[currency];
    return (
      typeof rates?.buyRate === 'number' || typeof rates?.sellRate === 'number'
    );
  }).length;

  const referenceTimestamp = formatDateTime(
    reference?.marketUpdatedAt ?? reference?.fetchedAt,
  );

  return (
    <Surface>
      <Header>
        <HeaderMain>
          <TitleBlock>
            <Title>Monedas configuradas</Title>
            <Description>
              Edita las tasas manuales y compáralas con la referencia del
              mercado desde una sola tabla.
            </Description>
          </TitleBlock>

          <MetaList>
            <MetaPill>
              <span>Base</span>
              <strong>{functionalCurrency}</strong>
            </MetaPill>
            <MetaPill>
              <span>Activas</span>
              <strong>{currencies.length}</strong>
            </MetaPill>
            <MetaPill>
              <span>Con tasa manual</span>
              <strong>{configuredRatesCount}</strong>
            </MetaPill>
            <MetaText>
              {referenceTimestamp
                ? `Referencia de mercado actualizada: ${referenceTimestamp}`
                : 'Sin referencia de mercado disponible'}
            </MetaText>
          </MetaList>
        </HeaderMain>

        <HeaderActions>
          <Button
            type="default"
            onClick={onAddRateClick}
          >
            Configurar monedas
          </Button>
        </HeaderActions>
      </Header>

      {currencies.length === 0 ? (
        <EmptyState>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No hay monedas configuradas fuera de la moneda base."
          />
          <Button type="primary" onClick={onAddRateClick}>
            Configurar monedas
          </Button>
        </EmptyState>
      ) : (
        <>
          <TableHeader>
            <HeaderCell>Moneda</HeaderCell>
            <HeaderCell $align="end">Compra manual</HeaderCell>
            <HeaderCell $align="end">Venta manual</HeaderCell>
            <HeaderCell $align="end">Tasa de referencia</HeaderCell>
            <HeaderCell $align="end">Dif. compra</HeaderCell>
            <HeaderCell $align="end">Dif. venta</HeaderCell>
            <HeaderCell $align="end">Estado</HeaderCell>
          </TableHeader>

          <Rows>
            {currencies.map((currency) => {
              const rates = manualRatesByCurrency[currency];
              const referenceRate =
                reference?.ratesByCurrency[currency]?.referenceRate ?? null;
              const rowStatus = getRowStatus({
                buyRate: rates?.buyRate,
                sellRate: rates?.sellRate,
                referenceRate,
              });

              return (
                <Row key={currency}>
                  <CurrencySummary>
                    <CurrencyCodeLine>
                      <CurrencyCode>{currency}</CurrencyCode>
                      <CurrencyName>({getCurrencyLabel(currency)})</CurrencyName>
                    </CurrencyCodeLine>
                    <CurrencyCaption>
                      Tasa manual {currency} a {functionalCurrency}
                    </CurrencyCaption>
                  </CurrencySummary>

                  <ValueCell $label="Compra manual" $align="end">
                    <Value>{formatRate(rates?.buyRate)}</Value>
                  </ValueCell>

                  <ValueCell $label="Venta manual" $align="end">
                    <Value>{formatRate(rates?.sellRate)}</Value>
                  </ValueCell>

                  <ValueCell $label="Tasa de referencia" $align="end">
                    <ReferenceValue $missing={referenceRate == null}>
                      {referenceRate == null
                        ? 'Sin referencia'
                        : rateFormatter.format(referenceRate)}
                    </ReferenceValue>
                  </ValueCell>

                  <ValueCell $label="Dif. compra" $align="end">
                    <DeltaBadge
                      $tone={getDeltaTone(rates?.buyRate, referenceRate)}
                    >
                      {formatDelta(rates?.buyRate, referenceRate)}
                    </DeltaBadge>
                  </ValueCell>

                  <ValueCell $label="Dif. venta" $align="end">
                    <DeltaBadge
                      $tone={getDeltaTone(rates?.sellRate, referenceRate)}
                    >
                      {formatDelta(rates?.sellRate, referenceRate)}
                    </DeltaBadge>
                  </ValueCell>

                  <StatusCell $label="Estado" $align="end">
                    <StatusBadge $tone={rowStatus.tone}>
                      {rowStatus.label}
                    </StatusBadge>
                  </StatusCell>
                </Row>
              );
            })}
          </Rows>
        </>
      )}
    </Surface>
  );
};

const Surface = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-bg-surface);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-5);
  padding: var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-subtle);

  @media (max-width: 920px) {
    flex-direction: column;
  }
`;

const HeaderMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  min-width: 0;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
`;

const Title = styled.h3`
  margin: 0;
  font-size: var(--ds-type-scale-section-title-size);
  font-weight: var(--ds-type-scale-section-title-weight);
  line-height: var(--ds-type-scale-section-title-line-height);
  color: var(--ds-color-text-primary);
`;

const Description = styled.p`
  margin: 0;
  max-width: 64ch;
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const MetaList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
`;

const MetaPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: 6px var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-pill);
  background: var(--ds-color-bg-surface);

  span {
    font-size: var(--ds-font-size-xs);
    color: var(--ds-color-text-secondary);
  }

  strong {
    font-size: var(--ds-type-scale-label-size);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-primary);
    font-variant-numeric: tabular-nums;
  }
`;

const MetaText = styled.span`
  font-size: var(--ds-type-scale-caption-size);
  line-height: var(--ds-type-scale-caption-line-height);
  color: var(--ds-color-text-secondary);
`;

const HeaderActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--ds-space-2);

  @media (max-width: 920px) {
    align-items: stretch;
    width: 100%;
  }
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: ${tableColumns};
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-5);
  background: var(--ds-color-bg-subtle);
  border-bottom: 1px solid var(--ds-color-border-default);

  @media (max-width: 980px) {
    display: none;
  }
`;

const HeaderCell = styled.span<{ $align?: 'start' | 'end' }>`
  font-size: var(--ds-type-scale-table-header-size);
  font-weight: var(--ds-type-scale-table-header-weight);
  line-height: var(--ds-type-scale-table-header-line-height);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
  color: var(--ds-color-text-secondary);
  text-align: ${({ $align = 'start' }) => $align};
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.article`
  display: grid;
  grid-template-columns: ${tableColumns};
  gap: var(--ds-space-3);
  align-items: center;
  padding: var(--ds-space-3) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-subtle);

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: 980px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: stretch;
    gap: var(--ds-space-2) var(--ds-space-3);
    padding: var(--ds-space-3) var(--ds-space-4);
  }
`;

const CurrencySummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  @media (max-width: 980px) {
    grid-column: 1 / -1;
    padding-bottom: var(--ds-space-2);
    border-bottom: 1px solid var(--ds-color-border-subtle);
  }
`;

const CurrencyCodeLine = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const CurrencyCode = styled.span`
  font-size: var(--ds-type-scale-heading-size);
  font-weight: var(--ds-type-scale-heading-weight);
  line-height: var(--ds-type-scale-heading-line-height);
  color: var(--ds-color-text-primary);
`;

const CurrencyName = styled.span`
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const CurrencyCaption = styled.span`
  font-size: var(--ds-type-scale-caption-size);
  line-height: var(--ds-type-scale-caption-line-height);
  color: var(--ds-color-text-muted);

  @media (max-width: 980px) {
    display: none;
  }
`;

const ValueCell = styled.div<{
  $label: string;
  $align?: 'start' | 'end';
}>`
  display: flex;
  justify-content: ${({ $align = 'start' }) =>
    $align === 'end' ? 'flex-end' : 'flex-start'};

  @media (max-width: 980px) {
    flex-direction: column;
    align-items: ${({ $align = 'start' }) =>
      $align === 'end' ? 'flex-end' : 'flex-start'};
    gap: 6px;

    &::before {
      content: '${({ $label }) => $label}';
      font-size: var(--ds-type-scale-caption-size);
      line-height: var(--ds-type-scale-caption-line-height);
      color: var(--ds-color-text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--ds-letter-spacing-wide);
    }
  }
`;

const StatusCell = styled(ValueCell)`
  @media (max-width: 980px) {
    align-items: flex-end;
  }
`;

const Value = styled.span`
  font-family: var(--ds-font-family-mono);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
  font-variant-numeric: tabular-nums;
  color: var(--ds-color-text-primary);
`;

const ReferenceValue = styled(Value)<{ $missing: boolean }>`
  color: ${({ $missing }) =>
    $missing ? 'var(--ds-color-text-muted)' : 'var(--ds-color-action-primary)'};
`;

const DeltaBadge = styled.span<{ $tone: DeltaTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px var(--ds-space-3);
  border: 1px solid transparent;
  border-radius: var(--ds-radius-pill);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  ${({ $tone }) => toneStyles[$tone]}
`;

const StatusBadge = styled(DeltaBadge)`
  min-width: 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-4);
  min-height: 280px;
  padding: var(--ds-space-6);
`;
