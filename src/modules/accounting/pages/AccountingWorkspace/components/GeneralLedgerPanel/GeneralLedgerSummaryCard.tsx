import styled from 'styled-components';

import { formatCompactMoney, type VisibleLedgerMetrics } from './generalLedgerPanelUtils';
import {
  PanelBody,
  PanelCard,
  PanelCardHeader,
  PanelCardTitle,
} from './GeneralLedgerPanelCard';

import type { GeneralLedgerSnapshot } from '../../utils/accountingWorkspace';

interface GeneralLedgerSummaryCardProps {
  account: GeneralLedgerSnapshot['account'] | null;
  metrics: VisibleLedgerMetrics;
}

export const GeneralLedgerSummaryCard = ({
  account,
  metrics,
}: GeneralLedgerSummaryCardProps) => (
  <PanelCard>
    <PanelCardHeader>
      <PanelCardTitle>
        {account ? `${account.code} — ${account.name}` : 'Cuenta'}
      </PanelCardTitle>
    </PanelCardHeader>
    <PanelBody>
      <StatLine>
        <span>Tipo de cuenta</span>
        <strong>Activo</strong>
      </StatLine>
      <StatLine>
        <span>Saldo inicial</span>
        <strong>{formatCompactMoney(metrics.openingBalance)}</strong>
      </StatLine>
      <StatLine>
        <span>Débitos del período</span>
        <strong className="debit">{formatCompactMoney(metrics.periodDebit)}</strong>
      </StatLine>
      <StatLine>
        <span>Créditos del período</span>
        <strong className="credit">{formatCompactMoney(metrics.periodCredit)}</strong>
      </StatLine>
      <StatLine $total>
        <span>Saldo final</span>
        <strong>{formatCompactMoney(metrics.closingBalance)}</strong>
      </StatLine>
    </PanelBody>
  </PanelCard>
);

const StatLine = styled.div<{ $total?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) 0;
  border-bottom: ${({ $total }) =>
    $total ? 'none' : '1px dotted var(--ds-color-border-subtle)'};

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }

  strong {
    color: var(--ds-color-text-primary);
    font-size: ${({ $total }) =>
      $total ? 'var(--ds-font-size-base)' : 'var(--ds-font-size-sm)'};
    font-variant-numeric: tabular-nums;
    font-weight: ${({ $total }) =>
      $total
        ? 'var(--ds-font-weight-semibold)'
        : 'var(--ds-font-weight-medium)'};
  }

  strong.debit {
    color: var(--ds-color-state-danger-text);
  }

  strong.credit {
    color: var(--ds-color-state-success-text);
  }
`;
