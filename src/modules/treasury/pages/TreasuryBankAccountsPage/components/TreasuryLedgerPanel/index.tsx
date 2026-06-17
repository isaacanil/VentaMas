import styled from 'styled-components';

import type {
  BankReconciliationRecord,
  InternalTransfer,
  LiquidityLedgerEntry,
} from '@/types/accounting';
import type { TreasuryLiquidityAccount } from '@/modules/treasury/utils/liquidity';
import { AccountInspectorRail } from './components/AccountInspectorRail';
import { AccountOverview } from './components/AccountOverview';
import { LedgerEntriesTable } from './components/LedgerEntriesTable';
import { getLedgerTotals } from './utils/insights';

interface TreasuryLedgerPanelProps {
  account: TreasuryLiquidityAccount | null;
  currentBalance: number;
  ledgerEntries: LiquidityLedgerEntry[];
  onExportLedger?: () => void;
  onExportStatementLines?: () => void;
  onOpenReconciliation?: () => void;
  onOpenStatementImport?: () => void;
  onOpenResolveStatementLine?: () => void;
  onOpenStatementLine?: () => void;
  onOpenTransfer?: () => void;
  pendingStatementLineCount?: number;
  reconciliations: BankReconciliationRecord[];
  statementLineCount?: number;
  transfers: InternalTransfer[];
  writtenOffStatementLineCount?: number;
}

export const TreasuryLedgerPanel = ({
  account,
  currentBalance,
  ledgerEntries,
  onExportLedger,
  onExportStatementLines,
  onOpenReconciliation,
  onOpenStatementImport,
  onOpenResolveStatementLine,
  onOpenStatementLine,
  onOpenTransfer,
  pendingStatementLineCount = 0,
  reconciliations,
  statementLineCount = 0,
  transfers,
  writtenOffStatementLineCount = 0,
}: TreasuryLedgerPanelProps) => {
  const { inflow, outflow } = getLedgerTotals(ledgerEntries);
  const latestReconciliation = reconciliations[0] ?? null;
  const lastMovementAt = ledgerEntries[0]?.occurredAt ?? null;

  if (!account) {
    return (
      <PanelShell>
        <AccountOverview
          account={null}
          currentBalance={0}
          inflow={0}
          lastMovementAt={null}
          outflow={0}
        />
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <AccountOverview
        account={account}
        currentBalance={currentBalance}
        inflow={inflow}
        lastMovementAt={lastMovementAt}
        latestReconciliationDate={latestReconciliation?.statementDate}
        onExportLedger={onExportLedger}
        onExportStatementLines={onExportStatementLines}
        onOpenReconciliation={onOpenReconciliation}
        onOpenStatementImport={onOpenStatementImport}
        onOpenResolveStatementLine={onOpenResolveStatementLine}
        onOpenStatementLine={onOpenStatementLine}
        onOpenTransfer={onOpenTransfer}
        pendingStatementLineCount={pendingStatementLineCount}
        outflow={outflow}
      />

      <ContentGrid>
        <LedgerColumn>
          <LedgerEntriesTable currency={account.currency} entries={ledgerEntries} />
        </LedgerColumn>

        <AccountInspectorRail
          account={account}
          currentBalance={currentBalance}
          latestReconciliation={latestReconciliation}
          pendingStatementLineCount={pendingStatementLineCount}
          statementLineCount={statementLineCount}
          transfers={transfers}
          writtenOffStatementLineCount={writtenOffStatementLineCount}
        />
      </ContentGrid>
    </PanelShell>
  );
};

const PanelShell = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-2) 0 0;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: var(--ds-space-4);
  align-items: stretch;

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

const LedgerColumn = styled.div`
  display: flex;
  min-width: 0;
  min-height: 100%;
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;
