import styled from 'styled-components';

import { formatAccountingMoney } from '../../utils/accountingWorkspace';
import {
  formatDateInputValue,
  type VisibleLedgerMetrics,
} from './generalLedgerPanelUtils';
import {
  PanelCard,
  PanelCardHeader,
  PanelCardMeta,
  PanelCardTitle,
} from './GeneralLedgerPanelCard';

import type { GeneralLedgerMovement } from '../../utils/accountingWorkspace';

interface GeneralLedgerTAccountCardProps {
  creditRows: GeneralLedgerMovement[];
  debitRows: GeneralLedgerMovement[];
  metrics: VisibleLedgerMetrics;
}

export const GeneralLedgerTAccountCard = ({
  creditRows,
  debitRows,
  metrics,
}: GeneralLedgerTAccountCardProps) => (
  <PanelCard>
    <PanelCardHeader>
      <PanelCardTitle>
        Vista T <PanelCardMeta>Esquema del período</PanelCardMeta>
      </PanelCardTitle>
    </PanelCardHeader>
    <TAccount>
      <TAccountSide>
        <TAccountHeading>Debe</TAccountHeading>
        {debitRows.map((entry) => (
          <TAccountRow key={`debit:${entry.id}`}>
            <span>{formatDateInputValue(entry.entryDate).slice(5)}</span>
            <strong>{formatAccountingMoney(entry.debit)}</strong>
          </TAccountRow>
        ))}
        <TAccountTotal>
          <span>Σ Debe</span>
          <strong>{formatAccountingMoney(metrics.periodDebit)}</strong>
        </TAccountTotal>
      </TAccountSide>

      <TAccountSide $credit>
        <TAccountHeading>Haber</TAccountHeading>
        {creditRows.map((entry) => (
          <TAccountRow key={`credit:${entry.id}`}>
            <span>{formatDateInputValue(entry.entryDate).slice(5)}</span>
            <strong>{formatAccountingMoney(entry.credit)}</strong>
          </TAccountRow>
        ))}
        <TAccountTotal>
          <span>Σ Haber</span>
          <strong>{formatAccountingMoney(metrics.periodCredit)}</strong>
        </TAccountTotal>
      </TAccountSide>
    </TAccount>
  </PanelCard>
);

const TAccount = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const TAccountSide = styled.div<{ $credit?: boolean }>`
  padding: var(--ds-space-4);
  border-left: ${({ $credit }) =>
    $credit ? '1px solid var(--ds-color-border-default)' : 'none'};
`;

const TAccountHeading = styled.h4`
  margin: 0 0 var(--ds-space-3);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

const TAccountRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-2);
  padding: 4px 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);

  strong {
    color: var(--ds-color-text-primary);
    font-variant-numeric: tabular-nums;
    font-weight: var(--ds-font-weight-medium);
  }
`;

const TAccountTotal = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
  padding-top: var(--ds-space-3);
  border-top: 1px solid var(--ds-color-border-default);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);

  strong {
    font-variant-numeric: tabular-nums;
  }
`;
