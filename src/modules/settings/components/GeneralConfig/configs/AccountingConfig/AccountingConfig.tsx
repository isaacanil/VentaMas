import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { AccountingSettingsForm } from './components/AccountingSettingsForm';
import { useAccountingAuditTrail } from './hooks/useAccountingAuditTrail';
import { useAccountingConfig } from './hooks/useAccountingConfig';
import { useAccountingPostingProfiles } from './hooks/useAccountingPostingProfiles';
import { useChartOfAccounts } from './hooks/useChartOfAccounts';
import {
  DEFAULT_ACCOUNTING_PANEL_KEY,
  getAccountingPanelItem,
  resolveAccountingPanelKey,
} from './utils/accountingPanels';
import ROUTES_NAME from '@/router/routes/routesName';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  background: var(--ds-color-bg-page);
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
`;

export default function AccountingConfig() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const userId = user?.uid ?? user?.id ?? null;
  const settingsWorkspaceEnabled = Boolean(businessId);
  const {
    bankAccounts,
    config,
    enabledForeignCurrencies,
    error,
    exchangeRateReference,
    hasUnsavedExchangeChanges,
    history,
    loading,
    saveExchangeSettings,
    savingExchange,
    updateCurrencyConfiguration,
    updateFunctionalCurrency,
    updateBuyRate,
    updateSellRate,
  } = useAccountingConfig({
    businessId,
    userId,
  });
  const {
    addChartOfAccount,
    chartOfAccounts,
    error: chartOfAccountsError,
    loading: chartOfAccountsLoading,
    saving: savingChartOfAccounts,
    seeding: seedingChartOfAccounts,
    seedDefaultChartOfAccounts,
    updateChartOfAccount,
    updateChartOfAccountStatus,
  } = useChartOfAccounts({
    businessId,
    enabled: settingsWorkspaceEnabled,
    functionalCurrency: config.functionalCurrency,
    userId,
  });
  const {
    addPostingProfile,
    error: postingProfilesError,
    loading: postingProfilesLoading,
    postingProfiles,
    saving: savingPostingProfiles,
    seeding: seedingPostingProfiles,
    seedDefaultPostingProfiles,
    updatePostingProfile,
    updatePostingProfileStatus,
  } = useAccountingPostingProfiles({
    businessId,
    chartOfAccounts,
    enabled: settingsWorkspaceEnabled,
    userId,
  });
  const { entries: auditEntries, loading: auditLoading } =
    useAccountingAuditTrail({
      bankAccounts,
      businessId,
      chartOfAccounts,
      postingProfiles,
      settingsHistory: history,
    });
  const activePanel = useMemo(
    () => resolveAccountingPanelKey(location.pathname),
    [location.pathname],
  );
  const activePanelItem = getAccountingPanelItem(activePanel);

  useEffect(() => {
    if (
      location.pathname ===
        ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING ||
      location.pathname ===
        `${ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING}/`
    ) {
      navigate(getAccountingPanelItem(DEFAULT_ACCOUNTING_PANEL_KEY).route, {
        replace: true,
      });
    }
  }, [location.pathname, navigate]);

  return (
    <PageWrapper>
      <Content>
        <AccountingSettingsForm
          activePanelItem={activePanelItem}
          accountingPanel={activePanel}
          chartOfAccounts={chartOfAccounts}
          chartOfAccountsError={chartOfAccountsError}
          chartOfAccountsLoading={chartOfAccountsLoading}
          config={config}
          error={error}
          enabledForeignCurrencies={enabledForeignCurrencies}
          exchangeRateReference={exchangeRateReference}
          hasUnsavedExchangeChanges={hasUnsavedExchangeChanges}
          history={auditEntries}
          historyLoading={auditLoading}
          loading={loading}
          onAddChartOfAccount={addChartOfAccount}
          onBuyRateChange={updateBuyRate}
          onCurrencyConfigurationChange={updateCurrencyConfiguration}
          onFunctionalCurrencyChange={updateFunctionalCurrency}
          onSaveExchange={saveExchangeSettings}
          onSellRateChange={updateSellRate}
          onSeedDefaultChartOfAccounts={seedDefaultChartOfAccounts}
          onUpdateChartOfAccount={updateChartOfAccount}
          onUpdateChartOfAccountStatus={updateChartOfAccountStatus}
          onAddPostingProfile={addPostingProfile}
          onSeedDefaultPostingProfiles={seedDefaultPostingProfiles}
          onUpdatePostingProfile={updatePostingProfile}
          onUpdatePostingProfileStatus={updatePostingProfileStatus}
          postingProfiles={postingProfiles}
          postingProfilesError={postingProfilesError}
          postingProfilesLoading={postingProfilesLoading}
          savingChartOfAccounts={savingChartOfAccounts}
          savingExchange={savingExchange}
          savingPostingProfiles={savingPostingProfiles}
          seedingChartOfAccounts={seedingChartOfAccounts}
          seedingPostingProfiles={seedingPostingProfiles}
        />
      </Content>
    </PageWrapper>
  );
}
