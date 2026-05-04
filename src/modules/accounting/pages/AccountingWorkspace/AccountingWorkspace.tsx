import { Alert } from '@heroui/react';
import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
      <Alert key="rollout-info" status="accent">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>
            Este negocio no esta marcado como rollout contable piloto.
          </Alert.Title>
          <Alert.Description>
            La pantalla sigue disponible para disenar el flujo y probar asientos
            manuales, pero algunos eventos automaticos pueden no aparecer.
          </Alert.Description>
        </Alert.Content>
      </Alert>
    ) : null,
    configError || chartError || postingProfilesError ? (
      <Alert key="load-error" status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>
            Hay datos contables que no cargaron por completo.
          </Alert.Title>
          <Alert.Description>
            {configError ??
              chartError ??
              postingProfilesError ??
              'Error de carga.'}
          </Alert.Description>
        </Alert.Content>
      </Alert>
    ) : null,
    setupIncomplete ? (
      <Alert key="setup-incomplete" status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>
            Contabilidad habilitada sin base contable completa.
          </Alert.Title>
          <Alert.Description>
            Completa el catalogo de cuentas y los perfiles contables en
            Configuracion &gt; Contabilidad. Mientras falte esta base, los
            documentos crean eventos, pero no generan asientos posteados para
            mayor y reportes.
          </Alert.Description>
        </Alert.Content>
      </Alert>
    ) : null,
  ].filter(Boolean);

  const content = (() => {
    if (!accountingEnabled) {
      return (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              La contabilidad general aun no esta habilitada para este negocio.
            </Alert.Title>
            <Alert.Description>
              Activa contabilidad desde Settings &gt; Accounting para usar libro
              diario, reportes y cierres.            </Alert.Description>
          </Alert.Content>
        </Alert>
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
    <PageShell className="bg-[var(--ds-color-bg-page)]">
      <MenuApp sectionName={activePanelItem.label} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-4 pb-10 sm:px-4 sm:pb-8">
        <AccountingWorkspaceShell
          loading={loading}
          notices={notices.length ? notices : null}
        >
          {content}
        </AccountingWorkspaceShell>
      </div>
    </PageShell>
  );
}

