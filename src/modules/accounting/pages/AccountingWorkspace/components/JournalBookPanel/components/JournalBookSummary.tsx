import styled from 'styled-components';

import { VmCard } from '@/components/heroui';

import { formatJournalAmount } from '../utils/formatters';

import type { JournalBookSummaryTotals } from '../types';

interface JournalBookSummaryProps {
  difference: number;
  summary: JournalBookSummaryTotals;
}

export const JournalBookSummary = ({
  difference,
  summary,
}: JournalBookSummaryProps) => (
  <SummaryStrip>
    <VmCard>
      <VmCard.Content>
        <SummaryLabel>Debitos periodo</SummaryLabel>
        <SummaryValue $tone="debit">
          {formatJournalAmount(summary.debit)}
        </SummaryValue>
        <SummaryMeta>{summary.debitMovements} movimientos</SummaryMeta>
      </VmCard.Content>
    </VmCard>
    <VmCard>
      <VmCard.Content>
        <SummaryLabel>Creditos periodo</SummaryLabel>
        <SummaryValue $tone="credit">
          {formatJournalAmount(summary.credit)}
        </SummaryValue>
        <SummaryMeta>{summary.creditMovements} movimientos</SummaryMeta>
      </VmCard.Content>
    </VmCard>
    <VmCard
      style={
        difference < 0.005
          ? {
              backgroundColor:
                'var(--ds-color-state-success-subtle, var(--ds-color-bg-surface))',
            }
          : {}
      }
    >
      <VmCard.Content>
        <SummaryLabel>Diferencia</SummaryLabel>
        <SummaryValue $balanced={difference < 0.005}>
          {formatJournalAmount(difference)}
        </SummaryValue>
        <SummaryMeta>
          {difference < 0.005 ? 'Cuadrado' : 'Revisar descuadre'}
        </SummaryMeta>
      </VmCard.Content>
    </VmCard>
    <VmCard>
      <VmCard.Content>
        <SummaryLabel>Estado</SummaryLabel>
        <StatusStack>
          <StatusMetric>
            <StatusDot $tone="success" />
            <span>{summary.posted} posteados</span>
          </StatusMetric>
          <StatusMetric>
            <StatusDot $tone="warning" />
            <span>{summary.projected} previos</span>
          </StatusMetric>
          {summary.warning > 0 && (
            <StatusMetric>
              <StatusDot $tone="warning" />
              <span>{summary.warning} con alerta</span>
            </StatusMetric>
          )}
          {summary.pending > 0 && (
            <StatusMetric>
              <StatusDot $tone="neutral" />
              <span>{summary.pending} pendientes</span>
            </StatusMetric>
          )}
          {summary.reversed > 0 && (
            <StatusMetric>
              <StatusDot $tone="neutral" />
              <span>{summary.reversed} revertidos</span>
            </StatusMetric>
          )}
        </StatusStack>
      </VmCard.Content>
    </VmCard>
  </SummaryStrip>
);

const SummaryStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

const SummaryValue = styled.strong<{
  $balanced?: boolean;
  $tone?: 'debit' | 'credit';
}>`
  color: ${({ $balanced, $tone }) =>
    $tone === 'debit'
      ? 'var(--ds-color-state-success-text, #166534)'
      : $tone === 'credit'
        ? 'var(--ds-color-state-danger-text, #b42318)'
        : $balanced
          ? 'var(--ds-color-state-success-text, var(--ds-color-text-primary))'
          : 'var(--ds-color-text-primary)'};
  font-size: var(--ds-font-size-lg);
  font-variant-numeric: tabular-nums;
  font-weight: var(--ds-font-weight-semibold);
`;

const SummaryMeta = styled.small`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const StatusStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin-top: var(--ds-space-1);
`;

const StatusMetric = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const StatusDot = styled.span<{ $tone: 'success' | 'warning' | 'neutral' }>`
  width: 7px;
  height: 7px;
  border-radius: 999px;
  flex-shrink: 0;
  background: ${({ $tone }) =>
    $tone === 'success'
      ? 'var(--ds-color-state-success)'
      : $tone === 'warning'
        ? 'var(--ds-color-state-warning)'
        : 'var(--ds-color-text-secondary)'};
`;

