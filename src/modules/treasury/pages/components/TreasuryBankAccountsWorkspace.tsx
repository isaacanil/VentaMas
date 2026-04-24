import { useMemo, useState } from 'react';
import { Alert, Button, Modal, Skeleton } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import ROUTES_NAME from '@/router/routes/routesName';
import { AddBankAccountModal } from '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/AddBankAccountModal';
import { BankPaymentPolicySection } from '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/BankPaymentPolicySection';
import { AddCashAccountModal } from '@/modules/treasury/components/AddCashAccountModal';
import { BankReconciliationModal } from '@/modules/treasury/components/BankReconciliationModal';
import { BankStatementImportModal } from '@/modules/treasury/components/BankStatementImportModal';
import { BankStatementLineModal } from '@/modules/treasury/components/BankStatementLineModal';
import { InternalTransferModal } from '@/modules/treasury/components/InternalTransferModal';
import { ResolveBankStatementLineModal } from '@/modules/treasury/components/ResolveBankStatementLineModal';
import { TreasuryAccountGrid } from '@/modules/treasury/components/TreasuryAccountGrid';
import { TreasuryLedgerPanel } from '@/modules/treasury/components/TreasuryLedgerPanel';
import { useTreasuryWorkspace } from '@/modules/treasury/hooks/useTreasuryWorkspace';
import {
  buildLiquidityAccountKey,
  getTransfersForLiquidityAccount,
  type TreasuryLiquidityAccount,
} from '@/modules/treasury/utils/liquidity';
import {
  buildBankStatementLinesCsv,
  buildLiquidityLedgerCsv,
  buildTreasuryCockpitCsv,
  buildTreasuryExportFileName,
  downloadCsvFile,
} from '@/modules/treasury/utils/treasuryExports';
import type { BankAccount, CashAccount } from '@/types/accounting';
import type { BankAccountDraft } from '@/utils/accounting/bankAccounts';
import type { CashAccountDraft } from '@/utils/accounting/cashAccounts';

const runSubmission = async <TResult,>({
  onDone,
  onSettled,
  onStart,
  task,
}: {
  onDone?: (result: TResult) => void;
  onSettled?: () => void;
  onStart?: () => void;
  task: () => Promise<TResult>;
}) => {
  onStart?.();

  try {
    const result = await task();
    onDone?.(result);
    return result;
  } finally {
    onSettled?.();
  }
};

export const TreasuryBankAccountsWorkspace = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const routeParams = useParams<{ accountId?: string; kind?: string }>();
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const userId = user?.uid ?? user?.id ?? null;
  const {
    addBankAccount,
    addCashAccount,
    bankAccounts,
    bankInstitutionCatalog,
    bankInstitutionCatalogError,
    bankInstitutionCatalogLoading,
    config,
    currentBalancesByAccountKey,
    error,
    importBankStatementLines,
    latestReconciliationsByBankAccountId,
    ledgerEntriesByAccountKey,
    liquidityAccounts,
    overallLoading,
    recentLedgerEntries,
    recentTransfers,
    reconciliations,
    recordBankReconciliation,
    recordBankStatementLine,
    recordInternalTransfer,
    resolveBankStatementLine,
    updateBankAccount,
    updateBankAccountStatus,
    updateBankPaymentPolicy,
    updateCashAccount,
    updateCashAccountStatus,
    statementLinesByBankAccountId,
  } = useTreasuryWorkspace({
    businessId,
    userId,
  });
  const [editingBankAccount, setEditingBankAccount] =
    useState<BankAccount | null>(null);
  const [isBankAccountSubmitting, setIsBankAccountSubmitting] = useState(false);
  const [editingCashAccount, setEditingCashAccount] =
    useState<CashAccount | null>(null);
  const [isCashAccountSubmitting, setIsCashAccountSubmitting] = useState(false);
  const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
  const [isCashAccountModalOpen, setIsCashAccountModalOpen] = useState(false);
  const [isBankingConfigModalOpen, setIsBankingConfigModalOpen] =
    useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);
  const [transferSourceAccountKey, setTransferSourceAccountKey] = useState<
    string | null
  >(null);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] =
    useState(false);
  const [isReconciliationSubmitting, setIsReconciliationSubmitting] =
    useState(false);
  const [reconciliationBankAccountId, setReconciliationBankAccountId] =
    useState<string | null>(null);
  const [isStatementLineModalOpen, setIsStatementLineModalOpen] = useState(false);
  const [isStatementLineSubmitting, setIsStatementLineSubmitting] =
    useState(false);
  const [statementLineBankAccountId, setStatementLineBankAccountId] =
    useState<string | null>(null);
  const [isResolveStatementLineModalOpen, setIsResolveStatementLineModalOpen] =
    useState(false);
  const [isResolveStatementLineSubmitting, setIsResolveStatementLineSubmitting] =
    useState(false);
  const [resolveStatementLineBankAccountId, setResolveStatementLineBankAccountId] =
    useState<string | null>(null);
  const [importStatementBankAccountId, setImportStatementBankAccountId] =
    useState<string | null>(null);
  const [isImportStatementModalOpen, setIsImportStatementModalOpen] =
    useState(false);
  const [isImportStatementSubmitting, setIsImportStatementSubmitting] =
    useState(false);

  const routeAccountKey =
    routeParams.kind === 'bank' || routeParams.kind === 'cash'
      ? buildLiquidityAccountKey(routeParams.kind, routeParams.accountId ?? '')
      : null;

  const selectedAccount = useMemo(() => {
    if (routeAccountKey) {
      return (
        liquidityAccounts.find((account) => account.key === routeAccountKey) ??
        null
      );
    }

    return (
      liquidityAccounts.find((account) => account.status === 'active') ??
      liquidityAccounts[0] ??
      null
    );
  }, [liquidityAccounts, routeAccountKey]);
  const isDetailRoute = Boolean(routeAccountKey);

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
  const selectedStatementLines =
    selectedAccount?.kind === 'bank'
      ? statementLinesByBankAccountId[selectedAccount.id] ?? []
      : [];
  const selectedPendingStatementLineCount = selectedStatementLines.filter(
    (statementLine) => statementLine.status === 'pending',
  ).length;
  const selectedWrittenOffStatementLineCount = selectedStatementLines.filter(
    (statementLine) => statementLine.status === 'written_off',
  ).length;
  const totalStatementLines = useMemo(
    () => Object.values(statementLinesByBankAccountId).flat().length,
    [statementLinesByBankAccountId],
  );
  const totalPendingStatementLines = useMemo(
    () =>
      Object.values(statementLinesByBankAccountId).reduce(
        (sum, statementLines) =>
          sum +
          statementLines.filter((statementLine) => statementLine.status === 'pending')
            .length,
        0,
      ),
    [statementLinesByBankAccountId],
  );
  const totalWrittenOffStatementLines = useMemo(
    () =>
      Object.values(statementLinesByBankAccountId).reduce(
        (sum, statementLines) =>
          sum +
          statementLines.filter(
            (statementLine) => statementLine.status === 'written_off',
          ).length,
        0,
      ),
    [statementLinesByBankAccountId],
  );
  const bankAccountsWithPendingExceptions = useMemo(
    () =>
      Object.values(statementLinesByBankAccountId).filter((statementLines) =>
        statementLines.some((statementLine) => statementLine.status === 'pending'),
      ).length,
    [statementLinesByBankAccountId],
  );

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
    navigate(
      generatePath(ROUTES_NAME.TREASURY_TERM.TREASURY_ACCOUNT_DETAIL, {
        accountId: account.id,
        kind: account.kind,
      }),
    );
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
  ) =>
    runSubmission({
      onDone: () => {
        setEditingBankAccount(null);
        setIsBankAccountModalOpen(false);
      },
      onSettled: () => setIsBankAccountSubmitting(false),
      onStart: () => setIsBankAccountSubmitting(true),
      task: () =>
        bankAccountId
          ? updateBankAccount(bankAccountId, draft)
          : addBankAccount(draft),
    });

  const handleSubmitCashAccount = async (
    draft: Partial<CashAccountDraft>,
    cashAccountId?: string,
  ) =>
    runSubmission({
      onDone: () => {
        setEditingCashAccount(null);
        setIsCashAccountModalOpen(false);
      },
      onSettled: () => setIsCashAccountSubmitting(false),
      onStart: () => setIsCashAccountSubmitting(true),
      task: () =>
        cashAccountId
          ? updateCashAccount(cashAccountId, draft)
          : addCashAccount(draft),
    });

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

  const handleOpenStatementLine = (account?: TreasuryLiquidityAccount | null) => {
    if (!account || account.kind !== 'bank') {
      return;
    }

    setStatementLineBankAccountId(account.id);
    setIsStatementLineModalOpen(true);
  };

  const handleOpenResolveStatementLine = (
    account?: TreasuryLiquidityAccount | null,
  ) => {
    if (!account || account.kind !== 'bank') {
      return;
    }

    setResolveStatementLineBankAccountId(account.id);
    setIsResolveStatementLineModalOpen(true);
  };

  const handleOpenStatementImport = (account?: TreasuryLiquidityAccount | null) => {
    if (!account || account.kind !== 'bank') {
      return;
    }

    setImportStatementBankAccountId(account.id);
    setIsImportStatementModalOpen(true);
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

  const handleExportCockpit = () => {
    const csv = buildTreasuryCockpitCsv({
      accounts: liquidityAccounts,
      currentBalancesByAccountKey,
      latestReconciliationsByBankAccountId,
      statementLinesByBankAccountId,
    });

    if (!csv) return;

    downloadCsvFile({
      csv,
      fileName: buildTreasuryExportFileName({
        prefix: 'treasury-cockpit',
      }),
    });
  };

  const handleExportSelectedLedger = () => {
    if (!selectedAccount) return;

    const csv = buildLiquidityLedgerCsv({
      account: selectedAccount,
      entries: selectedLedgerEntries,
    });

    if (!csv) return;

    downloadCsvFile({
      csv,
      fileName: buildTreasuryExportFileName({
        prefix: 'treasury-ledger',
        suffix: selectedAccount.label,
      }),
    });
  };

  const handleExportSelectedStatementLines = () => {
    if (!selectedAccount || selectedAccount.kind !== 'bank') return;

    const csv = buildBankStatementLinesCsv({
      account: selectedAccount,
      statementLines: selectedStatementLines,
    });

    if (!csv) return;

    downloadCsvFile({
      csv,
      fileName: buildTreasuryExportFileName({
        prefix: 'bank-statement-lines',
        suffix: selectedAccount.label,
      }),
    });
  };

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

      {!isDetailRoute ? (
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
            <MetricCard>
              <MetricLabel>Excepciones pendientes</MetricLabel>
              <MetricValue>{totalPendingStatementLines}</MetricValue>
              <MetricHint>{bankAccountsWithPendingExceptions} cuenta(s)</MetricHint>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Write-off registrados</MetricLabel>
              <MetricValue>{totalWrittenOffStatementLines}</MetricValue>
              <MetricHint>{totalStatementLines} línea(s) extracto</MetricHint>
            </MetricCard>
          </MetricsStrip>

          <ToolbarActions>
            <Button icon={<DownloadOutlined />} onClick={handleExportCockpit}>
              Exportar cockpit
            </Button>
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
      ) : null}

      <ContentGrid>
        <ColumnSection>
          {isDetailRoute ? (
            <>
              <DetailHeader>
                <DetailHeaderTop>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() =>
                      navigate(ROUTES_NAME.TREASURY_TERM.TREASURY_BANK_ACCOUNTS)
                    }
                  >
                    Volver a cuentas
                  </Button>
                </DetailHeaderTop>

                <div>
                  <SectionTitle>Detalle de cuenta</SectionTitle>
                  <SectionDescription>
                    Vista operativa dedicada para revisar balance, movimientos y
                    control de conciliación.
                  </SectionDescription>
                </div>
              </DetailHeader>

              {selectedAccount ? (
                <TreasuryLedgerPanel
                  account={selectedAccount}
                  currentBalance={
                    currentBalancesByAccountKey[selectedAccount.key] ??
                    Number(selectedAccount.openingBalance ?? 0)
                  }
                  ledgerEntries={selectedLedgerEntries}
                  onExportLedger={handleExportSelectedLedger}
                  onExportStatementLines={
                    selectedAccount.kind === 'bank'
                      ? handleExportSelectedStatementLines
                      : undefined
                  }
                  onOpenReconciliation={
                    selectedAccount.kind === 'bank'
                      ? () => handleOpenReconciliation(selectedAccount)
                      : undefined
                  }
                  onOpenStatementImport={
                    selectedAccount.kind === 'bank'
                      ? () => handleOpenStatementImport(selectedAccount)
                      : undefined
                  }
                  onOpenResolveStatementLine={
                    selectedAccount.kind === 'bank'
                      ? () => handleOpenResolveStatementLine(selectedAccount)
                      : undefined
                  }
                  onOpenStatementLine={
                    selectedAccount.kind === 'bank'
                      ? () => handleOpenStatementLine(selectedAccount)
                      : undefined
                  }
                  onOpenTransfer={() => handleOpenTransfer(selectedAccount)}
                  pendingStatementLineCount={selectedPendingStatementLineCount}
                  reconciliations={selectedReconciliations}
                  statementLineCount={selectedStatementLines.length}
                  transfers={selectedTransfers}
                  writtenOffStatementLineCount={selectedWrittenOffStatementLineCount}
                />
              ) : (
                <Alert
                  type="warning"
                  showIcon
                  message="La cuenta solicitada no existe o ya no está disponible."
                />
              )}
            </>
          ) : (
            <>
              <SectionTitle>Liquidez operativa</SectionTitle>
              <TreasuryAccountGrid
                accounts={liquidityAccounts}
                currentBalancesByAccountKey={currentBalancesByAccountKey}
                latestReconciliationsByBankAccountId={
                  latestReconciliationsByBankAccountId
                }
                selectedAccountKey={null}
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
            </>
          )}
        </ColumnSection>
      </ContentGrid>

      <AddBankAccountModal
        bankInstitutionCatalog={bankInstitutionCatalog}
        bankInstitutionCatalogError={bankInstitutionCatalogError}
        bankInstitutionCatalogLoading={bankInstitutionCatalogLoading}
        currencies={Array.from(
          new Set([config.functionalCurrency, ...config.documentCurrencies]),
        )}
        editingAccount={editingBankAccount}
        open={isBankAccountModalOpen}
        onCancel={() => {
          if (isBankAccountSubmitting) return;
          setEditingBankAccount(null);
          setIsBankAccountModalOpen(false);
        }}
        onSubmit={handleSubmitBankAccount}
        submitting={isBankAccountSubmitting}
      />

      <AddCashAccountModal
        currencies={Array.from(
          new Set([config.functionalCurrency, ...config.documentCurrencies]),
        )}
        editingAccount={editingCashAccount}
        open={isCashAccountModalOpen}
        onCancel={() => {
          if (isCashAccountSubmitting) return;
          setEditingCashAccount(null);
          setIsCashAccountModalOpen(false);
        }}
        onSubmit={handleSubmitCashAccount}
        submitting={isCashAccountSubmitting}
      />

      <InternalTransferModal
        accounts={liquidityAccounts}
        currentBalancesByAccountKey={currentBalancesByAccountKey}
        defaultSourceAccountKey={transferSourceAccountKey}
        open={isTransferModalOpen}
        submitting={isTransferSubmitting}
        onCancel={() => {
          if (isTransferSubmitting) return;
          setTransferSourceAccountKey(null);
          setIsTransferModalOpen(false);
        }}
        onSubmit={async (draft) => {
          await runSubmission({
            onDone: () => {
              setTransferSourceAccountKey(null);
              setIsTransferModalOpen(false);
            },
            onSettled: () => setIsTransferSubmitting(false),
            onStart: () => setIsTransferSubmitting(true),
            task: () => recordInternalTransfer(draft),
          });
        }}
      />

      <BankReconciliationModal
        bankAccounts={bankAccounts}
        currentBalancesByAccountId={currentBalancesByBankAccountId}
        defaultBankAccountId={reconciliationBankAccountId}
        open={isReconciliationModalOpen}
        submitting={isReconciliationSubmitting}
        onCancel={() => {
          if (isReconciliationSubmitting) return;
          setReconciliationBankAccountId(null);
          setIsReconciliationModalOpen(false);
        }}
        onSubmit={async (draft) => {
          await runSubmission({
            onDone: () => {
              setReconciliationBankAccountId(null);
              setIsReconciliationModalOpen(false);
            },
            onSettled: () => setIsReconciliationSubmitting(false),
            onStart: () => setIsReconciliationSubmitting(true),
            task: () => recordBankReconciliation(draft),
          });
        }}
      />

      <BankStatementLineModal
        bankAccount={
          bankAccounts.find((account) => account.id === statementLineBankAccountId) ??
          null
        }
        ledgerEntries={selectedLedgerEntries}
        open={isStatementLineModalOpen}
        submitting={isStatementLineSubmitting}
        onCancel={() => {
          if (isStatementLineSubmitting) return;
          setStatementLineBankAccountId(null);
          setIsStatementLineModalOpen(false);
        }}
        onSubmit={async (draft) => {
          await runSubmission({
            onDone: () => {
              setStatementLineBankAccountId(null);
              setIsStatementLineModalOpen(false);
            },
            onSettled: () => setIsStatementLineSubmitting(false),
            onStart: () => setIsStatementLineSubmitting(true),
            task: () => recordBankStatementLine(draft),
          });
        }}
      />

      {isImportStatementModalOpen ? (
        <BankStatementImportModal
          bankAccount={
            bankAccounts.find((account) => account.id === importStatementBankAccountId) ??
            null
          }
          ledgerEntries={selectedLedgerEntries}
          open={isImportStatementModalOpen}
          submitting={isImportStatementSubmitting}
          onCancel={() => {
            if (isImportStatementSubmitting) return;
            setImportStatementBankAccountId(null);
            setIsImportStatementModalOpen(false);
          }}
          onSubmit={async (drafts) => {
            return runSubmission({
              onDone: (summary) => {
                if (!summary.failures.length) {
                  setImportStatementBankAccountId(null);
                  setIsImportStatementModalOpen(false);
                }
              },
              onSettled: () => setIsImportStatementSubmitting(false),
              onStart: () => setIsImportStatementSubmitting(true),
              task: () => importBankStatementLines(drafts),
            });
          }}
        />
      ) : null}

      <ResolveBankStatementLineModal
        bankAccount={
          bankAccounts.find(
            (account) => account.id === resolveStatementLineBankAccountId,
          ) ?? null
        }
        ledgerEntries={selectedLedgerEntries}
        open={isResolveStatementLineModalOpen}
        pendingStatementLines={selectedStatementLines.filter(
          (statementLine) => statementLine.status === 'pending',
        )}
        submitting={isResolveStatementLineSubmitting}
        onCancel={() => {
          if (isResolveStatementLineSubmitting) return;
          setResolveStatementLineBankAccountId(null);
          setIsResolveStatementLineModalOpen(false);
        }}
        onSubmit={async (draft) => {
          await runSubmission({
            onDone: () => {
              setResolveStatementLineBankAccountId(null);
              setIsResolveStatementLineModalOpen(false);
            },
            onSettled: () => setIsResolveStatementLineSubmitting(false),
            onStart: () => setIsResolveStatementLineSubmitting(true),
            task: () => resolveBankStatementLine(draft),
          });
        }}
      />

      <Modal
        destroyOnHidden
        footer={null}
        open={isBankingConfigModalOpen}
        title="Métodos de pago y liquidación"
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
  grid-template-columns: repeat(5, minmax(160px, 1fr));
  gap: var(--ds-space-3);
  flex: 1;

  @media (max-width: 1120px) {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
    width: 100%;
  }

  @media (max-width: 720px) {
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

const MetricHint = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
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

const SectionDescription = styled.p`
  margin: 6px 0 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const DetailHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
`;

const DetailHeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const ModalBody = styled.div`
  padding-top: var(--ds-space-2);
`;

export default TreasuryBankAccountsWorkspace;
