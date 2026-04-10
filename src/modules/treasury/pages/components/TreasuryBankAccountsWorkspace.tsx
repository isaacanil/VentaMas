import { useMemo, useState } from 'react';
import { Alert, Button, Modal, Skeleton } from 'antd';
import { useSelector } from 'react-redux';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { AddBankAccountModal } from '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/AddBankAccountModal';
import { BankPaymentPolicySection } from '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/BankPaymentPolicySection';
import { AddCashAccountModal } from '@/modules/treasury/components/AddCashAccountModal';
import { BankReconciliationModal } from '@/modules/treasury/components/BankReconciliationModal';
import { InternalTransferModal } from '@/modules/treasury/components/InternalTransferModal';
import { TreasuryAccountGrid } from '@/modules/treasury/components/TreasuryAccountGrid';
import { TreasuryLedgerPanel } from '@/modules/treasury/components/TreasuryLedgerPanel';
import { useTreasuryWorkspace } from '@/modules/treasury/hooks/useTreasuryWorkspace';
import {
  getTransfersForLiquidityAccount,
  type TreasuryLiquidityAccount,
} from '@/modules/treasury/utils/liquidity';
import type { BankAccount, CashAccount } from '@/types/accounting';
import type { BankAccountDraft } from '@/utils/accounting/bankAccounts';
import type { CashAccountDraft } from '@/utils/accounting/cashAccounts';

export const TreasuryBankAccountsWorkspace = () => {
  const user = useSelector(selectUser);
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const userId = user?.uid ?? user?.id ?? null;
  const {
    addBankAccount,
    addCashAccount,
    bankAccounts,
    config,
    currentBalancesByAccountKey,
    error,
    latestReconciliationsByBankAccountId,
    ledgerEntriesByAccountKey,
    liquidityAccounts,
    overallLoading,
    recentLedgerEntries,
    recentTransfers,
    reconciliations,
    recordBankReconciliation,
    recordInternalTransfer,
    updateBankAccount,
    updateBankAccountStatus,
    updateBankPaymentPolicy,
    updateCashAccount,
    updateCashAccountStatus,
  } = useTreasuryWorkspace({
    businessId,
    userId,
  });
  const [selectedAccountKey, setSelectedAccountKey] = useState<string | null>(
    null,
  );
  const [editingBankAccount, setEditingBankAccount] =
    useState<BankAccount | null>(null);
  const [editingCashAccount, setEditingCashAccount] =
    useState<CashAccount | null>(null);
  const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
  const [isCashAccountModalOpen, setIsCashAccountModalOpen] = useState(false);
  const [isBankingConfigModalOpen, setIsBankingConfigModalOpen] =
    useState(false);
  const [isAccountDetailModalOpen, setIsAccountDetailModalOpen] =
    useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceAccountKey, setTransferSourceAccountKey] = useState<
    string | null
  >(null);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] =
    useState(false);
  const [reconciliationBankAccountId, setReconciliationBankAccountId] =
    useState<string | null>(null);

  const selectedAccount = useMemo(() => {
    const explicitlySelected =
      liquidityAccounts.find((account) => account.key === selectedAccountKey) ??
      null;
    if (explicitlySelected) {
      return explicitlySelected;
    }

    return (
      liquidityAccounts.find((account) => account.status === 'active') ??
      liquidityAccounts[0] ??
      null
    );
  }, [liquidityAccounts, selectedAccountKey]);

  const selectedLedgerEntries = selectedAccount
    ? ledgerEntriesByAccountKey[selectedAccount.key] ?? []
    : recentLedgerEntries;
  const selectedTransfers = getTransfersForLiquidityAccount(
    recentTransfers,
    selectedAccount,
  );
  const selectedReconciliations =
    selectedAccount?.kind === 'bank'
      ? reconciliations.filter(
          (reconciliation) => reconciliation.bankAccountId === selectedAccount.id,
        )
      : [];

  const currentBalancesByBankAccountId = useMemo(
    () =>
      Object.fromEntries(
        bankAccounts.map((account) => [
          account.id,
          currentBalancesByAccountKey[`bank:${account.id}`] ??
            Number(account.openingBalance ?? 0),
        ]),
      ),
    [bankAccounts, currentBalancesByAccountKey],
  );

  const handleOpenAddBankAccount = () => {
    setEditingBankAccount(null);
    setIsBankAccountModalOpen(true);
  };

  const handleOpenAddCashAccount = () => {
    setEditingCashAccount(null);
    setIsCashAccountModalOpen(true);
  };

  const handleOpenAccountDetail = (account: TreasuryLiquidityAccount) => {
    setSelectedAccountKey(account.key);
    setIsAccountDetailModalOpen(true);
  };

  const handleConfigureAccount = (account: TreasuryLiquidityAccount) => {
    if (account.kind === 'bank') {
      setEditingBankAccount(account.source as BankAccount);
      setIsBankAccountModalOpen(true);
      return;
    }

    setEditingCashAccount(account.source as CashAccount);
    setIsCashAccountModalOpen(true);
  };

  const handleSubmitBankAccount = async (
    draft: Partial<BankAccountDraft>,
    bankAccountId?: string,
  ) => {
    if (bankAccountId) {
      await updateBankAccount(bankAccountId, draft);
    } else {
      await addBankAccount(draft);
    }

    setEditingBankAccount(null);
    setIsBankAccountModalOpen(false);
  };

  const handleSubmitCashAccount = async (
    draft: Partial<CashAccountDraft>,
    cashAccountId?: string,
  ) => {
    if (cashAccountId) {
      await updateCashAccount(cashAccountId, draft);
    } else {
      await addCashAccount(draft);
    }

    setEditingCashAccount(null);
    setIsCashAccountModalOpen(false);
  };

  const handleOpenTransfer = (account?: TreasuryLiquidityAccount | null) => {
    setTransferSourceAccountKey(account?.key ?? selectedAccount?.key ?? null);
    setIsTransferModalOpen(true);
  };

  const handleOpenReconciliation = (account?: TreasuryLiquidityAccount | null) => {
    if (!account || account.kind !== 'bank') {
      return;
    }

    setReconciliationBankAccountId(account.id);
    setIsReconciliationModalOpen(true);
  };

  const activeBankAccountsCount = bankAccounts.filter(
    (account) => account.status === 'active',
  ).length;
  const activeCashAccountsCount = liquidityAccounts.filter(
    (account) => account.kind === 'cash' && account.status === 'active',
  ).length;
  const outstandingBankReconciliationsCount = Object.values(
    latestReconciliationsByBankAccountId,
  ).filter((reconciliation) => reconciliation.status === 'variance').length;

  if (overallLoading) {
    return (
      <LoadingShell>
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 12 }} />
      </LoadingShell>
    );
  }

  return (
    <WorkspaceShell>
      {error ? <Alert type="error" showIcon message={error} /> : null}

      <Toolbar>
        <MetricsStrip>
          <MetricCard>
            <MetricLabel>Bancos activos</MetricLabel>
            <MetricValue>{activeBankAccountsCount}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Cajas activas</MetricLabel>
            <MetricValue>{activeCashAccountsCount}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Conciliaciones con variación</MetricLabel>
            <MetricValue>{outstandingBankReconciliationsCount}</MetricValue>
          </MetricCard>
        </MetricsStrip>

        <ToolbarActions>
          <Button onClick={() => setIsBankingConfigModalOpen(true)}>
            Métodos bancarios
          </Button>
          <Button
            type="primary"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={handleOpenAddCashAccount}
          >
            Cuenta de caja
          </Button>
          <Button
            type="primary"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={handleOpenAddBankAccount}
          >
            Cuenta bancaria
          </Button>
        </ToolbarActions>
      </Toolbar>

      <ContentGrid>
        <ColumnSection>
          <SectionTitle>Liquidez operativa</SectionTitle>
          <TreasuryAccountGrid
            accounts={liquidityAccounts}
            currentBalancesByAccountKey={currentBalancesByAccountKey}
            latestReconciliationsByBankAccountId={
              latestReconciliationsByBankAccountId
            }
            selectedAccountKey={
              isAccountDetailModalOpen ? selectedAccount?.key ?? null : null
            }
            onConfigureAccount={handleConfigureAccount}
            onOpenReconciliation={handleOpenReconciliation}
            onOpenTransfer={handleOpenTransfer}
            onToggleAccountStatus={(account) => {
              if (account.kind === 'bank') {
                void updateBankAccountStatus(
                  account.id,
                  account.status === 'active' ? 'inactive' : 'active',
                );
                return;
              }

              void updateCashAccountStatus(
                account.id,
                account.status === 'active' ? 'inactive' : 'active',
              );
            }}
            onSelectAccount={handleOpenAccountDetail}
          />
        </ColumnSection>
      </ContentGrid>

      <AddBankAccountModal
        currencies={Array.from(
          new Set([config.functionalCurrency, ...config.documentCurrencies]),
        )}
        editingAccount={editingBankAccount}
        open={isBankAccountModalOpen}
        onCancel={() => {
          setEditingBankAccount(null);
          setIsBankAccountModalOpen(false);
        }}
        onSubmit={handleSubmitBankAccount}
      />

      <AddCashAccountModal
        currencies={Array.from(
          new Set([config.functionalCurrency, ...config.documentCurrencies]),
        )}
        editingAccount={editingCashAccount}
        open={isCashAccountModalOpen}
        onCancel={() => {
          setEditingCashAccount(null);
          setIsCashAccountModalOpen(false);
        }}
        onSubmit={handleSubmitCashAccount}
      />

      <InternalTransferModal
        accounts={liquidityAccounts}
        defaultSourceAccountKey={transferSourceAccountKey}
        open={isTransferModalOpen}
        onCancel={() => {
          setTransferSourceAccountKey(null);
          setIsTransferModalOpen(false);
        }}
        onSubmit={async (draft) => {
          await recordInternalTransfer(draft);
          setTransferSourceAccountKey(null);
          setIsTransferModalOpen(false);
        }}
      />

      <BankReconciliationModal
        bankAccounts={bankAccounts}
        currentBalancesByAccountId={currentBalancesByBankAccountId}
        defaultBankAccountId={reconciliationBankAccountId}
        open={isReconciliationModalOpen}
        onCancel={() => {
          setReconciliationBankAccountId(null);
          setIsReconciliationModalOpen(false);
        }}
        onSubmit={async (draft) => {
          await recordBankReconciliation(draft);
          setReconciliationBankAccountId(null);
          setIsReconciliationModalOpen(false);
        }}
      />

      <Modal
        destroyOnHidden
        footer={null}
        open={isBankingConfigModalOpen}
        title="Métodos bancarios"
        width={760}
        onCancel={() => setIsBankingConfigModalOpen(false)}
      >
        <ModalBody>
          <BankPaymentPolicySection
            bankAccounts={bankAccounts}
            policy={config.bankPaymentPolicy}
            onChange={updateBankPaymentPolicy}
          />
        </ModalBody>
      </Modal>

      <Modal
        destroyOnHidden
        footer={null}
        open={isAccountDetailModalOpen}
        title={selectedAccount?.label ?? 'Detalle de cuenta'}
        width={1100}
        onCancel={() => setIsAccountDetailModalOpen(false)}
      >
        <DetailModalBody>
          <TreasuryLedgerPanel
            account={selectedAccount}
            currentBalance={
              selectedAccount
                ? currentBalancesByAccountKey[selectedAccount.key] ??
                  Number(selectedAccount.openingBalance ?? 0)
                : 0
            }
            ledgerEntries={selectedLedgerEntries}
            reconciliations={selectedReconciliations}
            transfers={selectedTransfers}
          />
        </DetailModalBody>
      </Modal>
    </WorkspaceShell>
  );
};

const LoadingShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5);
`;

const WorkspaceShell = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: var(--ds-space-4);
  padding: var(--ds-space-3) var(--ds-space-5) var(--ds-space-5);
  background: var(--ds-color-bg-page);
  overflow-y: auto;
  overflow-x: hidden;
`;

const Toolbar = styled.section`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);

  @media (max-width: 1100px) {
    flex-direction: column;
  }
`;

const MetricsStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: var(--ds-space-3);
  flex: 1;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
    width: 100%;
  }
`;

const MetricCard = styled.div`
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
  padding: var(--ds-space-3) var(--ds-space-4);
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 92px;
  justify-content: center;
`;

const MetricLabel = styled.span`
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-secondary);
`;

const MetricValue = styled.span`
  font-size: clamp(1.5rem, 2vw, 2.1rem);
  line-height: 1.05;
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
  font-variant-numeric: tabular-nums;
`;

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ds-space-2);
  flex-wrap: wrap;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--ds-space-4);
  align-items: start;
`;

const ColumnSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  min-height: 0;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const ModalBody = styled.div`
  padding-top: var(--ds-space-2);
`;

const DetailModalBody = styled.div`
  max-height: min(78vh, 920px);
  overflow-y: auto;
  padding-top: var(--ds-space-2);
`;

export default TreasuryBankAccountsWorkspace;
