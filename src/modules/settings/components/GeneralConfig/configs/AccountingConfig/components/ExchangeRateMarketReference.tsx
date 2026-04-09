import styled from 'styled-components';

import type {
  AccountingManualRatesByCurrency,
  SupportedDocumentCurrency,
} from '../utils/accountingConfig';
import type { ExchangeRateReferenceSnapshot } from '../utils/exchangeRateReference';

interface ExchangeRateMarketReferenceProps {
  currencies: SupportedDocumentCurrency[];
  functionalCurrency: SupportedDocumentCurrency;
  manualRatesByCurrency?: AccountingManualRatesByCurrency;
  reference: ExchangeRateReferenceSnapshot | null;
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const percentFormatter = new Intl.NumberFormat('es-DO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const rateFormatter = new Intl.NumberFormat('es-DO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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

const formatReferenceRate = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) {
    return 'Sin dato';
  }

  return rateFormatter.format(value);
};

const formatDelta = (
  manualRate: number | null | undefined,
  referenceRate: number | null | undefined,
): string => {
  if (
    manualRate == null ||
    referenceRate == null ||
    Number.isNaN(manualRate) ||
    Number.isNaN(referenceRate) ||
    referenceRate === 0
  ) {
    return 'Sin comparar';
  }

  const delta = ((manualRate - referenceRate) / referenceRate) * 100;
  return `${delta >= 0 ? '+' : ''}${percentFormatter.format(delta)}%`;
};

const getDeltaTone = (
  manualRate: number | null | undefined,
  referenceRate: number | null | undefined,
): 'neutral' | 'high' | 'low' => {
  if (
    manualRate == null ||
    referenceRate == null ||
    Number.isNaN(manualRate) ||
    Number.isNaN(referenceRate) ||
    referenceRate === 0
  ) {
    return 'neutral';
  }

  const delta = ((manualRate - referenceRate) / referenceRate) * 100;

  if (Math.abs(delta) < 1) {
    return 'neutral';
  }

  return delta > 0 ? 'high' : 'low';
};

export const ExchangeRateMarketReference = ({
  currencies,
  functionalCurrency,
  manualRatesByCurrency,
  reference,
}: ExchangeRateMarketReferenceProps) => {
  const referenceTimestamp = formatDateTime(
    reference?.marketUpdatedAt ?? reference?.fetchedAt,
  );

  return (
    <Panel>
      <Header>
        <HeaderCopy>
          <TitleRow>Referencia de mercado</TitleRow>
          <HeaderDescription>
            Compara tus tasas manuales de compra y venta con una referencia del
            mercado.
          </HeaderDescription>
        </HeaderCopy>
        {referenceTimestamp ? (
          <HeaderMeta>Actualizado {referenceTimestamp}</HeaderMeta>
        ) : null}
      </Header>

      <Content>
        {currencies.length === 0 ? (
          <HelpText>
            Activa monedas documentales para ver la referencia de mercado.
          </HelpText>
        ) : (
          currencies.map((currency) => {
            const rateData = reference?.ratesByCurrency[currency];
            const hasRate = rateData?.referenceRate != null;

            return (
              <CurrencyBlock key={currency}>
                <CurrencyHeader>
                  <CurrencyPair>{`${currency} → ${functionalCurrency}`}</CurrencyPair>

                  <CurrentValue $hasRate={hasRate}>
                    {hasRate
                      ? formatReferenceRate(rateData.referenceRate)
                      : 'Sin dato'}
                  </CurrentValue>
                </CurrencyHeader>

                <ComparisonGrid>
                  <ComparisonItem
                    $tone={getDeltaTone(
                      manualRatesByCurrency?.[currency]?.buyRate,
                      rateData?.referenceRate,
                    )}
                  >
                    <span>Compra</span>
                    <strong>
                      {formatDelta(
                        manualRatesByCurrency?.[currency]?.buyRate,
                        rateData?.referenceRate,
                      )}
                    </strong>
                  </ComparisonItem>

                  <ComparisonItem
                    $tone={getDeltaTone(
                      manualRatesByCurrency?.[currency]?.sellRate,
                      rateData?.referenceRate,
                    )}
                  >
                    <span>Venta</span>
                    <strong>
                      {formatDelta(
                        manualRatesByCurrency?.[currency]?.sellRate,
                        rateData?.referenceRate,
                      )}
                    </strong>
                  </ComparisonItem>
                </ComparisonGrid>
              </CurrencyBlock>
            );
          })
        )}
      </Content>
    </Panel>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-bg-surface);
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding: var(--ds-space-4) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-default);
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TitleRow = styled.div`
  font-size: var(--ds-type-scale-heading-size);
  font-weight: var(--ds-type-scale-heading-weight);
  line-height: var(--ds-type-scale-heading-line-height);
  color: var(--ds-color-text-primary);
`;

const HeaderDescription = styled.p`
  margin: 0;
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const HeaderMeta = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4) var(--ds-space-5);
`;

const CurrencyBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding-bottom: var(--ds-space-3);
  border-bottom: 1px solid var(--ds-color-border-default);

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
`;

const CurrencyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const CurrencyPair = styled.span`
  font-size: var(--ds-type-scale-label-size);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ComparisonItem = styled.div<{ $tone: 'neutral' | 'high' | 'low' }>`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-3);
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'high'
        ? 'var(--ds-color-state-warning)'
        : $tone === 'low'
          ? 'var(--ds-color-state-success)'
          : 'var(--ds-color-border-default)'};
  border-radius: var(--ds-radius-lg);
  background: ${({ $tone }) =>
    $tone === 'high'
      ? 'var(--ds-color-state-warning-subtle)'
      : $tone === 'low'
        ? 'var(--ds-color-state-success-subtle)'
        : 'var(--ds-color-bg-subtle)'};

  span {
    font-size: var(--ds-font-size-xs);
    color: var(--ds-color-text-muted);
  }

  strong {
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-semibold);
    color: ${({ $tone }) =>
      $tone === 'high'
        ? 'var(--ds-color-state-warning-text)'
        : $tone === 'low'
          ? 'var(--ds-color-state-success-text)'
          : 'var(--ds-color-text-primary)'};
  }
`;

const HelpText = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const CurrentValue = styled.div<{ $hasRate: boolean }>`
  min-width: 112px;
  padding: var(--ds-space-1) var(--ds-space-3);
  border-radius: var(--ds-radius-lg);
  border: 1px solid
    ${({ $hasRate }) =>
      $hasRate
        ? 'var(--ds-color-border-strong)'
        : 'var(--ds-color-border-default)'};
  background: ${({ $hasRate }) =>
    $hasRate
      ? 'var(--ds-color-action-primary-subtle)'
      : 'var(--ds-color-bg-subtle)'};
  color: ${({ $hasRate }) =>
    $hasRate
      ? 'var(--ds-color-action-primary)'
      : 'var(--ds-color-text-muted)'};
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  line-height: 1.2;
  text-align: center;
  font-variant-numeric: tabular-nums;
`;
