import { Alert } from 'antd';
import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import ROUTES_NAME from '@/router/routes/routesName';

import { AccountingWorkspaceShell } from './components/AccountingWorkspaceShell';
import { FinancialReportsPanel } from './components/FinancialReportsPanel';
import { FiscalCompliancePanel } from './components/FiscalCompliancePanel';
import { GeneralLedgerPanel } from './components/GeneralLedgerPanel';
import { JournalBookPanel } from './components/JournalBookPanel';
import { ManualEntriesPanel } from './components/ManualEntriesPanel';
import { PeriodClosePanel } from './components/PeriodClosePanel';
import { useAccountingOriginNavigation } from './hooks/useAccountingOriginNavigation';
import { useAccountingWorkspace } from './hooks/useAccountingWorkspace';
import {
  findAccountingLedgerRecord,
  getAccountingEntryLocatorFromSearch,
  getAccountingEntryLocatorKey,
} from '@/modules/accounting/utils/accountingNavigation';
import {
  DEFAULT_ACCOUNTING_WORKSPACE_PANEL,
  getAccountingWorkspacePanel,
  resolveAccountingWorkspacePanelKey,
} from './utils/accountingPanels';

export default function AccountingWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePanel = useMemo(
    () => resolveAccountingWorkspacePanelKey(location.pathname),
    [location.pathname],
  );
  const activePanelItem = useMemo(
    () => getAccountingWorkspacePanel(activePanel),
    [activePanel],
  );
  const requestedEntryLocator = useMemo(
    () => getAccountingEntryLocatorFromSearch(location.search),
    [location.search],
  );
  const requestedSelectionKey = useMemo(
    () => getAccountingEntryLocatorKey(requestedEntryLocator),
    [requestedEntryLocator],
  );
  const shouldLoadLedgerRecords =
    activePanel !== 'general-ledger' && activePanel !== 'financial-reports';
  const {
    accountingEnabled,
    businessId,
    chartOfAccounts,
    chartError,
    chartLoading,
    closingPeriod,
    closePeriod,
    configError,
    configLoading,
    isAccountingRolloutBusiness,
    journalLoading,
    ledgerRecords,
    periodClosures,
    periodLoading,
    periodOptions,
    postingAccounts,
    postingProfiles,
    postingProfilesError,
    postingProfilesLoading,
    reversePostedEntry,
    saveManualEntry,
    savingManualEntry,
    reversingEntryId,
  } = useAccountingWorkspace({
    includeLedgerRecords: shouldLoadLedgerRecords,
  });
  const { openingOriginRecordId, openRecordOrigin } =
    useAccountingOriginNavigation();
  const requestedJournalRecord = useMemo(
    () =>
      activePanel === 'journal-book'
        ? findAccountingLedgerRecord(ledgerRecords, requestedEntryLocator)
        : null,
    [activePanel, ledgerRecords, requestedEntryLocator],
  );

  useEffect(() => {
    if (
      location.pathname === ROUTES_NAME.ACCOUNTING_TERM.ACCOUNTING ||
      location.pathname === `${ROUTES_NAME.ACCOUNTING_TERM.ACCOUNTING}/`
    ) {
      navigate(
        getAccountingWorkspacePanel(DEFAULT_ACCOUNTING_WORKSPACE_PANEL).route,
        {
          replace: true,
        },
      );
    }
  }, [location.pathname, navigate]);

  const loading = (() => {
    switch (activePanel) {
      case 'manual-entries':
        return configLoading || chartLoading || periodLoading;
      case 'general-ledger':
      case 'financial-reports':
        return configLoading;
      case 'period-close':
        return configLoading || periodLoading;
      default:
        return (
          configLoading ||
          chartLoading ||
          postingProfilesLoading ||
          journalLoading ||
          periodLoading
        );
    }
  })();

  const setupLoaded =
    !chartLoading && !postingProfilesLoading && !configLoading;
  const setupIncomplete =
    accountingEnabled &&
    setupLoaded &&
    (chartOfAccounts.length === 0 || postingProfiles.length === 0);

  const notices = [
    !isAccountingRolloutBusiness ? (
      <Alert
        key="rollout-info"
        type="info"
        showIcon
        message="Este negocio no esta marcado como rollout contable piloto."
        description="La pantalla sigue disponible para disenar el flujo y probar asientos manuales, pero algunos eventos automaticos pueden no aparecer."
      />
    ) : null,
    configError || chartError || postingProfilesError ? (
      <Alert
        key="load-error"
        type="error"
        showIcon
        message="Hay datos contables que no cargaron por completo."
        description={
          configError ?? chartError ?? postingProfilesError ?? 'Error de carga.'
        }
      />
    ) : null,
    setupIncomplete ? (
      <Alert
        key="setup-incomplete"
        type="warning"
        showIcon
        message="Contabilidad habilitada sin base contable completa."
        description="Completa el catalogo de cuentas y los perfiles contables en Configuracion > Contabilidad. Mientras falte esta base, los documentos crean eventos, pero no generan asientos posteados para mayor y reportes."
      />
    ) : null,
  ].filter(Boolean);

  const content = (() => {
    if (!accountingEnabled) {
      return (
        <Alert
          type="warning"
          showIcon
          message="La contabilidad general aun no esta habilitada para este negocio."
          description="Activa contabilidad desde Settings > Accounting para usar libro diario, reportes y cierres."
        />
      );
    }

    switch (activePanel) {
      case 'manual-entries':
        return (
          <ManualEntriesPanel
            closures={periodClosures}
            postingAccounts={postingAccounts}
            saving={savingManualEntry}
            onSubmit={saveManualEntry}
          />
        );
      case 'general-ledger':
        return (
          <GeneralLedgerPanel
            businessId={businessId}
            enabled={accountingEnabled}
            onOpenOrigin={openRecordOrigin}
            openingOriginRecordId={openingOriginRecordId}
          />
        );
      case 'financial-reports':
        return (
          <FinancialReportsPanel
            businessId={businessId}
            enabled={accountingEnabled}
          />
        );
      case 'fiscal-compliance':
        return (
          <FiscalCompliancePanel
            businessId={businessId}
            enabled={accountingEnabled}
            periods={periodOptions.map((option) => option.periodKey)}
            defaultPeriodKey={periodOptions[0]?.periodKey ?? null}
          />
        );
      case 'period-close':
        return (
          <PeriodClosePanel
            closures={periodClosures}
            closing={closingPeriod}
            periods={periodOptions}
            onClosePeriod={closePeriod}
          />
        );
      default:
        return (
          <JournalBookPanel
            loading={loading}
            records={ledgerRecords}
            openingOriginRecordId={openingOriginRecordId}
            onOpenOrigin={openRecordOrigin}
            requestedRecord={requestedJournalRecord}
            requestedSelectionKey={requestedSelectionKey}
            reversingEntryId={reversingEntryId}
            onReverseEntry={reversePostedEntry}
          />
        );
    }
  })();

  return (
    <Wrapper>
      <MenuApp sectionName={activePanelItem.label} />

      <Content>
        <AccountingWorkspaceShell
          loading={loading}
          notices={notices.length ? notices : null}
        >
          {content}
        </AccountingWorkspaceShell>
      </Content>
    </Wrapper>
  );
}

const Wrapper = styled(PageShell)`
  background: var(--ds-color-bg-page);
`;

const Content = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: var(--ds-space-4) var(--ds-space-6) var(--ds-space-10);
  overflow-y: auto;

  @media (max-width: 720px) {
    padding: var(--ds-space-4) var(--ds-space-4) var(--ds-space-8);
  }
`;
