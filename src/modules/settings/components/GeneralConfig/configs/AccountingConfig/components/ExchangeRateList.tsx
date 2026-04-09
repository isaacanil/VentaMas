import { Button, Empty, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import type {
  AccountingCurrencyRateConfig,
  AccountingManualRatesByCurrency,
  SupportedDocumentCurrency,
} from '../utils/accountingConfig';

const { Text } = Typography;

const EMPTY_CURRENCIES: SupportedDocumentCurrency[] = [];
const EMPTY_MANUAL_RATES: AccountingManualRatesByCurrency = {};

interface ExchangeRateListProps {
  currencies?: SupportedDocumentCurrency[];
  functionalCurrency: SupportedDocumentCurrency;
  manualRatesByCurrency?: AccountingManualRatesByCurrency;
  onAddRateClick: () => void;
}

export const ExchangeRateList = ({
  currencies = EMPTY_CURRENCIES,
  functionalCurrency,
  manualRatesByCurrency = EMPTY_MANUAL_RATES,
  onAddRateClick,
}: ExchangeRateListProps) => {
  const configuredRatesCount = currencies.filter((currency) => {
    const rates = manualRatesByCurrency[currency];
    return (
      typeof rates?.buyRate === 'number' || typeof rates?.sellRate === 'number'
    );
  }).length;

  return (
    <Section>
      <Header>
        <HeaderCopy>
          <HeaderTitle>Monedas activas</HeaderTitle>
          <HeaderDescription>
            Edita tasas manuales y qué monedas siguen activas.
          </HeaderDescription>
        </HeaderCopy>

        <HeaderActions>
          <HeaderMetric>
            <strong>{currencies.length}</strong>
            <span>activas</span>
          </HeaderMetric>
          <HeaderMetric>
            <strong>{configuredRatesCount}</strong>
            <span>con tasa</span>
          </HeaderMetric>
          <Button
            type="default"
            icon={<PlusOutlined />}
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
            description="No hay monedas activas fuera de la moneda base."
          />
        </EmptyState>
      ) : (
        <RatesList>
          {currencies.map((currency) => {
            const rates: AccountingCurrencyRateConfig | undefined =
              manualRatesByCurrency[currency];

            return (
              <RateRow key={currency}>
                <CurrencyBlock>
                  <CurrencyCode>{currency}</CurrencyCode>
                  <CurrencyPair>
                    Conversión manual de {currency} hacia {functionalCurrency}
                  </CurrencyPair>
                </CurrencyBlock>

                <RateChips>
                  <RateChip>
                    <RateChipLabel>Compra</RateChipLabel>
                    <RateChipValue $empty={rates?.buyRate == null}>
                      {rates?.buyRate != null
                        ? rates.buyRate.toFixed(2)
                        : '—'}
                    </RateChipValue>
                  </RateChip>
                  <RateChip>
                    <RateChipLabel>Venta</RateChipLabel>
                    <RateChipValue $empty={rates?.sellRate == null}>
                      {rates?.sellRate != null
                        ? rates.sellRate.toFixed(2)
                        : '—'}
                    </RateChipValue>
                  </RateChip>
                </RateChips>
              </RateRow>
            );
          })}
        </RatesList>
      )}
    </Section>
  );
};

const Section = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-bg-surface);
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4) var(--ds-space-5) var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-default);

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-type-scale-heading-size);
  font-weight: var(--ds-type-scale-heading-weight);
  line-height: var(--ds-type-scale-heading-line-height);
  color: var(--ds-color-text-primary);
`;

const HeaderDescription = styled.p`
  margin: 0;
  max-width: 56ch;
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;

  @media (max-width: 720px) {
    justify-content: flex-start;
  }
`;

const HeaderMetric = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 74px;
  padding: var(--ds-space-2) var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);

  strong {
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-primary);
  }

  span {
    font-size: var(--ds-font-size-xs);
    color: var(--ds-color-text-muted);
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: 24px;
`;

const RatesList = styled.div`
  display: flex;
  flex-direction: column;
`;

const RateRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-default);

  &:last-child {
    border-bottom: 0;
  }
`;

const CurrencyBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const CurrencyCode = styled.span`
  font-size: var(--ds-type-scale-label-size);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const CurrencyPair = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const RateChips = styled.div`
  display: flex;
  gap: var(--ds-space-3);

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const RateChip = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-1) var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
`;

const RateChipLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-muted);
`;

const RateChipValue = styled.span<{ $empty: boolean }>`
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  font-variant-numeric: tabular-nums;
  color: ${({ $empty }) =>
    $empty ? 'var(--ds-color-text-muted)' : 'var(--ds-color-text-primary)'};
`;
