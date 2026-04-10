import { useState, type ReactNode } from 'react';
import { Alert, Button, Card, Drawer } from 'antd';
import styled from 'styled-components';
import { ACCOUNTING_CURRENCY_CODES } from '@/utils/accounting/currencies';

import { AccountingHistoryList } from './AccountingHistoryList';
import { AddChartOfAccountModal } from './AddChartOfAccountModal';
import { AddExchangeRateModal } from './AddExchangeRateModal';
import { AddBankAccountModal } from './AddBankAccountModal';
import { BankPaymentPolicySection } from './BankPaymentPolicySection';
import { BankAccountsList } from './BankAccountsList';
import { ChartOfAccountsList } from './ChartOfAccountsList';
import { ExchangeRatesWorkspace } from './ExchangeRatesWorkspace';
import { PostingProfilesList } from './PostingProfilesList';
import type {
  AccountingPostingProfile,
  BankAccount,
  ChartOfAccount,
} from '@/types/accounting';
import type { BankAccountDraft } from '@/utils/accounting/bankAccounts';
import type { ChartOfAccountDraft } from '@/utils/accounting/chartOfAccounts';
import type { AccountingPostingProfileDraft } from '@/utils/accounting/postingProfiles';
import type { BankPaymentPolicy } from '@/utils/payments/bankPaymentPolicy';
import type {
  AccountingSettingsConfig,
  SupportedDocumentCurrency,
} from '../utils/accountingConfig';
import type { ExchangeRateReferenceSnapshot } from '../utils/exchangeRateReference';
import type { AccountingAuditEntry } from '../utils/accountingAudit';
import type {
  AccountingPanelItem,
  AccountingPanelKey,
} from '../utils/accountingPanels';

const getAvailableCurrencies = (
  functionalCurrency: SupportedDocumentCurrency,
  enabledForeignCurrencies: SupportedDocumentCurrency[],
) =>
  ACCOUNTING_CURRENCY_CODES.filter(
    (currency): currency is SupportedDocumentCurrency =>
      currency !== functionalCurrency &&
      !enabledForeignCurrencies.includes(currency),
  );

const PanelStack = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: var(--ds-space-4) var(--ds-space-5);
`;

const FlushPanelStack = styled(PanelStack)`
  padding: 0;
`;

const HistoryLinkRow = styled.div`
  display: flex;
  padding: var(--ds-space-2) var(--ds-space-1);
`;

interface AccountingSettingsFormProps {
  activePanelItem: AccountingPanelItem;
  accountingPanel: AccountingPanelKey;
  chartOfAccounts: ChartOfAccount[];
  chartOfAccountsError: string | null;
  chartOfAccountsLoading: boolean;
  bankAccounts: BankAccount[];
  bankAccountsLoading: boolean;
  config: AccountingSettingsConfig;
  enabledForeignCurrencies: SupportedDocumentCurrency[];
  error: string | null;
  exchangeRateReference: ExchangeRateReferenceSnapshot | null;
  hasUnsavedExchangeChanges: boolean;
  history: AccountingAuditEntry[];
  historyLoading: boolean;
  loading: boolean;
  savingChartOfAccounts: boolean;
  savingExchange: boolean;
  savingPostingProfiles: boolean;
  onAddBankAccount: (draft: Partial<BankAccountDraft>) => Promise<void>;
  onUpdateBankAccount: (
    bankAccountId: string,
    draft: Partial<BankAccountDraft>,
  ) => Promise<void>;
  onAddChartOfAccount: (
    draft: Partial<ChartOfAccountDraft>,
  ) => Promise<boolean>;
  onAddPostingProfile: (
    draft: Partial<AccountingPostingProfileDraft>,
  ) => Promise<boolean>;
  onCurrencyConfigurationChange: (params: {
    functionalCurrency: SupportedDocumentCurrency;
    documentCurrencies: SupportedDocumentCurrency[];
  }) => void;
  onFunctionalCurrencyChange: (
    currency: SupportedDocumentCurrency,
  ) => void | Promise<void>;
  onBuyRateChange: (
    currency: SupportedDocumentCurrency,
    value: number | null,
  ) => void;
  onBankPaymentPolicyChange: (policy: BankPaymentPolicy) => void;
  onSaveExchange: () => void;
  onSellRateChange: (
    currency: SupportedDocumentCurrency,
    value: number | null,
  ) => void;
  onSeedDefaultChartOfAccounts: () => Promise<void>;
  onUpdateBankAccountStatus: (
    bankAccountId: string,
    status: BankAccount['status'],
  ) => void;
  onUpdateChartOfAccountStatus: (
    chartOfAccountId: string,
    status: ChartOfAccount['status'],
  ) => void;
  onUpdateChartOfAccount: (
    chartOfAccountId: string,
    draft: Partial<ChartOfAccountDraft>,
  ) => Promise<boolean>;
  onUpdatePostingProfile: (
    postingProfileId: string,
    draft: Partial<AccountingPostingProfileDraft>,
  ) => Promise<boolean>;
  onUpdatePostingProfileStatus: (
    postingProfileId: string,
    status: AccountingPostingProfile['status'],
  ) => Promise<boolean>;
  onSeedDefaultPostingProfiles: () => Promise<boolean>;
  postingProfiles: AccountingPostingProfile[];
  postingProfilesError: string | null;
  postingProfilesLoading: boolean;
  seedingChartOfAccounts: boolean;
  seedingPostingProfiles: boolean;
}

export const AccountingSettingsForm = ({
  activePanelItem,
  accountingPanel,
  chartOfAccounts,
  chartOfAccountsError,
  chartOfAccountsLoading,
  bankAccounts,
  bankAccountsLoading,
  config,
  enabledForeignCurrencies,
  error,
  exchangeRateReference,
  hasUnsavedExchangeChanges,
  history,
  historyLoading,
  loading,
  savingChartOfAccounts,
  savingExchange,
  savingPostingProfiles,
  onAddBankAccount,
  onUpdateBankAccount,
  onAddChartOfAccount,
  onAddPostingProfile,
  onBankPaymentPolicyChange,
  onCurrencyConfigurationChange,
  onFunctionalCurrencyChange,
  onBuyRateChange,
  onSaveExchange,
  onSellRateChange,
  onSeedDefaultChartOfAccounts,
  onUpdateBankAccountStatus,
  onUpdateChartOfAccount,
  onUpdateChartOfAccountStatus,
  onUpdatePostingProfile,
  onUpdatePostingProfileStatus,
  onSeedDefaultPostingProfiles,
  postingProfiles,
  postingProfilesError,
  postingProfilesLoading,
  seedingChartOfAccounts,
  seedingPostingProfiles,
}: AccountingSettingsFormProps) => {
  const [isAddRateModalOpen, setIsAddRateModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isAddBankAccountModalOpen, setIsAddBankAccountModalOpen] =
    useState(false);
  const [isAddChartOfAccountModalOpen, setIsAddChartOfAccountModalOpen] =
    useState(false);
  const [editingBankAccount, setEditingBankAccount] =
    useState<BankAccount | null>(null);
  const [editingChartOfAccount, setEditingChartOfAccount] =
    useState<ChartOfAccount | null>(null);
  const [chartOfAccountCreateDefaults, setChartOfAccountCreateDefaults] =
    useState<Partial<ChartOfAccountDraft> | null>(null);
  const [selectedCurrenciesToAdd, setSelectedCurrenciesToAdd] = useState<
    SupportedDocumentCurrency[]
  >([]);
  const availableCurrencies = getAvailableCurrencies(
    config.functionalCurrency,
    enabledForeignCurrencies,
  );

  const handleOpenAddRateModal = () => {
    setSelectedCurrenciesToAdd([]);
    setIsAddRateModalOpen(true);
  };

  const handleCloseAddRateModal = () => {
    setSelectedCurrenciesToAdd([]);
    setIsAddRateModalOpen(false);
  };

  const handleCloseAddBankAccountModal = () => {
    setEditingBankAccount(null);
    setIsAddBankAccountModalOpen(false);
  };

  const handleOpenAddBankAccountModal = () => {
    setEditingBankAccount(null);
    setIsAddBankAccountModalOpen(true);
  };

  const handleOpenEditBankAccountModal = (account: BankAccount) => {
    setEditingBankAccount(account);
    setIsAddBankAccountModalOpen(true);
  };

  const handleSetDefaultBankAccount = (bankAccountId: string) => {
    onBankPaymentPolicyChange({
      ...config.bankPaymentPolicy,
      defaultBankAccountId: bankAccountId,
    });
  };

  const handleCloseAddChartOfAccountModal = () => {
    setEditingChartOfAccount(null);
    setChartOfAccountCreateDefaults(null);
    setIsAddChartOfAccountModalOpen(false);
  };

  const handleOpenAddChartOfAccountModal = (
    createDefaults?: Partial<ChartOfAccountDraft>,
  ) => {
    setEditingChartOfAccount(null);
    setChartOfAccountCreateDefaults(createDefaults ?? null);
    setIsAddChartOfAccountModalOpen(true);
  };

  const handleOpenEditChartOfAccountModal = (account: ChartOfAccount) => {
    setChartOfAccountCreateDefaults(null);
    setEditingChartOfAccount(account);
    setIsAddChartOfAccountModalOpen(true);
  };

  const handleConfirmAddRateModal = () => {
    if (selectedCurrenciesToAdd.length === 0) {
      handleCloseAddRateModal();
      return;
    }

    onCurrencyConfigurationChange({
      functionalCurrency: config.functionalCurrency,
      documentCurrencies: [
        ...config.documentCurrencies,
        ...selectedCurrenciesToAdd,
      ],
    });
    handleCloseAddRateModal();
  };

  const handleRemoveCurrency = (currency: SupportedDocumentCurrency) => {
    onCurrencyConfigurationChange({
      functionalCurrency: config.functionalCurrency,
      documentCurrencies: config.documentCurrencies.filter(
        (item) => item !== currency,
      ),
    });
  };

  const handleSubmitBankAccount = async (
    draft: Partial<BankAccountDraft>,
    bankAccountId?: string,
  ) => {
    if (bankAccountId) {
      await onUpdateBankAccount(bankAccountId, draft);
    } else {
      await onAddBankAccount(draft);
    }
    handleCloseAddBankAccountModal();
  };

  const handleSubmitChartOfAccount = async (
    draft: Partial<ChartOfAccountDraft>,
    chartOfAccountId?: string,
  ) => {
    const saved = chartOfAccountId
      ? await onUpdateChartOfAccount(chartOfAccountId, draft)
      : await onAddChartOfAccount(draft);

    if (saved) {
      handleCloseAddChartOfAccountModal();
    }

    return saved;
  };

  const exchangeRatePanelContent = (
    <PanelStack>
      <Section>
        <ExchangeRatesWorkspace
          currencies={enabledForeignCurrencies}
          functionalCurrency={config.functionalCurrency}
          hasUnsavedChanges={hasUnsavedExchangeChanges}
          manualRatesByCurrency={config.manualRatesByCurrency}
          onAddRateClick={handleOpenAddRateModal}
          onSave={onSaveExchange}
          reference={exchangeRateReference}
          saving={savingExchange}
        />
      </Section>
    </PanelStack>
  );

  const bankAccountsPanelContent = (
    <PanelStack>
      <BankingWorkspace>
        <BankAccountsList
          bankAccounts={bankAccounts}
          defaultBankAccountId={config.bankPaymentPolicy.defaultBankAccountId}
          loading={bankAccountsLoading}
          onAddBankAccountClick={handleOpenAddBankAccountModal}
          onEditBankAccountClick={handleOpenEditBankAccountModal}
          onSetDefaultBankAccountClick={handleSetDefaultBankAccount}
          onToggleBankAccountStatus={onUpdateBankAccountStatus}
        />

        <BankPaymentPolicySection
          bankAccounts={bankAccounts}
          policy={config.bankPaymentPolicy}
          onChange={onBankPaymentPolicyChange}
        />
      </BankingWorkspace>
    </PanelStack>
  );

  const chartOfAccountsPanelContent = (
    <FlushPanelStack>
      <StretchSection>
        {chartOfAccountsError ? (
          <Alert showIcon type="error" message={chartOfAccountsError} />
        ) : null}

        <ChartOfAccountsList
          accounts={chartOfAccounts}
          loading={chartOfAccountsLoading || savingChartOfAccounts}
          seeding={seedingChartOfAccounts}
          onAddChartOfAccountClick={handleOpenAddChartOfAccountModal}
          onEditChartOfAccountClick={handleOpenEditChartOfAccountModal}
          onSeedDefaultChartOfAccounts={() => {
            void onSeedDefaultChartOfAccounts();
          }}
          onToggleChartOfAccountStatus={(chartOfAccountId, status) => {
            void onUpdateChartOfAccountStatus(chartOfAccountId, status);
          }}
        />
      </StretchSection>
    </FlushPanelStack>
  );

  const postingProfilesPanelContent = (
    <FlushPanelStack>
      {!chartOfAccounts.length ? (
        <Alert
          showIcon
          type="warning"
          message="Primero configura el catálogo de cuentas"
          description="Los perfiles contables necesitan cuentas contables activas antes de poder mapear eventos."
        />
      ) : (
        <>
          <StretchSection>
            {postingProfilesError ? (
              <Alert showIcon type="error" message={postingProfilesError} />
            ) : null}

            <PostingProfilesList
              chartOfAccounts={chartOfAccounts}
              loading={postingProfilesLoading || savingPostingProfiles}
              onAddPostingProfile={onAddPostingProfile}
              onUpdatePostingProfile={onUpdatePostingProfile}
              onUpdatePostingProfileStatus={onUpdatePostingProfileStatus}
              postingProfiles={postingProfiles}
              seeding={seedingPostingProfiles}
              onSeedDefaultPostingProfiles={onSeedDefaultPostingProfiles}
            />
          </StretchSection>
        </>
      )}
    </FlushPanelStack>
  );

  const activePanelContent: Record<AccountingPanelKey, ReactNode> = {
    'exchange-rates': exchangeRatePanelContent,
    'bank-accounts': bankAccountsPanelContent,
    'chart-of-accounts': chartOfAccountsPanelContent,
    'posting-profiles': postingProfilesPanelContent,
  };

  return (
    <FormStack>
      {error ? <Alert type="error" showIcon message={error} /> : null}

      <Card
        loading={loading}
        bordered={false}
        style={{ boxShadow: 'none', height: '100%' }}
        styles={{
          body: {
            padding: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <AccountingStack>
          <PanelSurface>
            {(accountingPanel === 'bank-accounts' ||
              accountingPanel === 'chart-of-accounts') && (
              <PanelHeader>
                <PanelHeaderLeft>
                  <PanelTitle>{activePanelItem.label}</PanelTitle>
                  <PanelDescription>{activePanelItem.description}</PanelDescription>
                </PanelHeaderLeft>
              </PanelHeader>
            )}

            {(history.length > 0 || historyLoading) && (
              <HistoryLinkRow>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setIsHistoryDrawerOpen(true)}
                >
                  Ver bitacora contable
                  {history.length > 0 ? ` (${history.length})` : ''}
                </Button>
              </HistoryLinkRow>
            )}

            {activePanelContent[accountingPanel]}
          </PanelSurface>
        </AccountingStack>
      </Card>

      <AddExchangeRateModal
        availableCurrencies={availableCurrencies}
        enabledForeignCurrencies={enabledForeignCurrencies}
        functionalCurrency={config.functionalCurrency}
        manualRatesByCurrency={config.manualRatesByCurrency}
        open={isAddRateModalOpen}
        selectedCurrencies={selectedCurrenciesToAdd}
        onBuyRateChange={onBuyRateChange}
        onCancel={handleCloseAddRateModal}
        onConfirm={handleConfirmAddRateModal}
        onFunctionalCurrencyChange={onFunctionalCurrencyChange}
        onRemoveCurrency={handleRemoveCurrency}
        onSelectionChange={setSelectedCurrenciesToAdd}
        onSellRateChange={onSellRateChange}
      />

      <AddBankAccountModal
        currencies={Array.from(
          new Set([config.functionalCurrency, ...config.documentCurrencies]),
        )}
        editingAccount={editingBankAccount}
        open={isAddBankAccountModalOpen}
        onCancel={handleCloseAddBankAccountModal}
        onSubmit={handleSubmitBankAccount}
      />

      <AddChartOfAccountModal
        accounts={chartOfAccounts}
        createDefaults={chartOfAccountCreateDefaults}
        editingAccount={editingChartOfAccount}
        loading={savingChartOfAccounts}
        open={isAddChartOfAccountModalOpen}
        onCancel={handleCloseAddChartOfAccountModal}
        onSubmit={handleSubmitChartOfAccount}
      />

      <Drawer
        title="Bitacora contable"
        open={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        placement="bottom"
        height="75%"
        destroyOnHidden
      >
        <AccountingHistoryList entries={history} loading={historyLoading} />
      </Drawer>
    </FormStack>
  );
};

const FormStack = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--ds-space-2);
  min-height: 0;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
`;

const StretchSection = styled(Section)`
  flex: 1;
  min-height: 0;
`;

const BankingWorkspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
  align-items: stretch;
  flex: 1;
  height: 100%;
  min-height: 0;

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

const AccountingStack = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--ds-space-5);
  min-height: 0;
`;

const PanelSurface = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  background: var(--ds-color-bg-surface);
  min-height: 0;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4) var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
`;

const PanelHeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const PanelDescription = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;
