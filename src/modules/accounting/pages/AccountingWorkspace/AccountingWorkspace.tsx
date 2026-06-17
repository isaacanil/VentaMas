import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { VmAlert } from '@/components/heroui';
import { PageShell } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/public';
import ROUTES_NAME from '@/router/routes/routesName';

import { AccountingWorkspaceShell } from './components/AccountingWorkspaceShell';
import { AccountingMonitorPanel } from './components/AccountingMonitorPanel';
import { FinancialReportsPanel } from './components/FinancialReportsPanel';
import { FiscalCompliancePanel } from './components/FiscalCompliancePanel';
import { GeneralLedgerPanel } from './components/GeneralLedgerPanel';
import { JournalBookPanel } from './components/JournalBookPanel';
import { ManualEntriesPanel } from './components/ManualEntriesPanel';
import { PeriodClosePanel } from './components/PeriodClosePanel';
import { useAccountingOriginNavigation } from './hooks/useAccountingOriginNavigation';
import { useAccountingWorkspace } from './hooks/useAccountingWorkspace';
import { useFiscalMonthlyComplianceAvailability } from './hooks/useFiscalMonthlyComplianceAvailability';
import {
  getAccountingEntryLocatorFromSearch,
  getAccountingEntryLocatorKey,
} from '@/modules/accounting/utils/accountingNavigation';
import { findAccountingLedgerRecord } from '@/modules/accounting/utils/accountingLedgerRecord';
import {
  DEFAULT_ACCOUNTING_WORKSPACE_PANEL,
  getAccountingWorkspacePanel,
  resolveAccountingWorkspacePanelKey,
} from './utils/accountingPanels';

export default function AccountingWorkspace() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const activePanel = useMemo(
    () => resolveAccountingWorkspacePanelKey(pathname),
    [pathname],
  );
  const activePanelItem = useMemo(
    () => getAccountingWorkspacePanel(activePanel),
    [activePanel],
  );
  const requestedEntryLocator = useMemo(
    () => getAccountingEntryLocatorFromSearch(search),
    [search],
  );
  const requestedSelectionKey = useMemo(
    () => getAccountingEntryLocatorKey(requestedEntryLocator),
    [requestedEntryLocator],
  );
  const shouldLoadLedgerRecords =
    activePanel !== 'general-ledger' &&
    activePanel !== 'financial-reports' &&
    activePanel !== 'fiscal-compliance';
  const shouldLoadAccountingSetup =
    activePanel !== 'general-ledger' &&
    activePanel !== 'financial-reports' &&
    activePanel !== 'fiscal-compliance' &&
    activePanel !== 'accounting-monitor';
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
    projectionDeadLetters,
    replayProjection,
    replayingEventId,
    reversePostedEntry,
    saveManualEntry,
    savingManualEntry,
    reversingEntryId,
  } = useAccountingWorkspace({
    includeAccountingSetup: shouldLoadAccountingSetup,
    includeLedgerRecords: shouldLoadLedgerRecords,
  });
  const { openingOriginRecordId, openRecordOrigin } =
    useAccountingOriginNavigation();
  const fiscalMonthlyComplianceAvailability =
    useFiscalMonthlyComplianceAvailability({
      businessId,
      enabled: accountingEnabled && activePanel === 'fiscal-compliance',
    });
  const fiscalCompliancePeriodKeys = useMemo(
    () => periodOptions.map((option) => option.periodKey),
    [periodOptions],
  );
  const requestedJournalRecord = useMemo(
    () =>
      activePanel === 'journal-book'
        ? findAccountingLedgerRecord(ledgerRecords, requestedEntryLocator)
        : null,
    [activePanel, ledgerRecords, requestedEntryLocator],
  );

  useEffect(() => {
    if (
      pathname === ROUTES_NAME.ACCOUNTING_TERM.ACCOUNTING ||
      pathname === `${ROUTES_NAME.ACCOUNTING_TERM.ACCOUNTING}/`
    ) {
      navigate(
        getAccountingWorkspacePanel(DEFAULT_ACCOUNTING_WORKSPACE_PANEL).route,
        {
          replace: true,
        },
      );
    }
  }, [pathname, navigate]);

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
    shouldLoadAccountingSetup &&
    accountingEnabled &&
    setupLoaded &&
    (chartOfAccounts.length === 0 || postingProfiles.length === 0);

  const notices = [
    !isAccountingRolloutBusiness ? (
      <VmAlert key="rollout-info" status="accent">
        <VmAlert.Indicator />
        <VmAlert.Content>
          <VmAlert.Title>
            Este negocio no esta marcado como rollout contable piloto.
          </VmAlert.Title>
          <VmAlert.Description>
            La pantalla sigue disponible para disenar el flujo y probar asientos
            manuales, pero algunos eventos automaticos pueden no aparecer.
          </VmAlert.Description>
        </VmAlert.Content>
      </VmAlert>
    ) : null,
    configError || chartError || postingProfilesError ? (
      <VmAlert key="load-error" status="danger">
        <VmAlert.Indicator />
        <VmAlert.Content>
          <VmAlert.Title>
            Hay datos contables que no cargaron por completo.
          </VmAlert.Title>
          <VmAlert.Description>
            {configError ??
              chartError ??
              postingProfilesError ??
              'Error de carga.'}
          </VmAlert.Description>
        </VmAlert.Content>
      </VmAlert>
    ) : null,
    setupIncomplete ? (
      <VmAlert key="setup-incomplete" status="warning">
        <VmAlert.Indicator />
        <VmAlert.Content>
          <VmAlert.Title>
            Contabilidad habilitada sin base contable completa.
          </VmAlert.Title>
          <VmAlert.Description>
            Completa el catalogo de cuentas y las reglas de contabilización en
            Configuracion &gt; Contabilidad. Mientras falte esta base, los
            documentos crean eventos, pero no generan asientos posteados para
            mayor y reportes.
          </VmAlert.Description>
        </VmAlert.Content>
      </VmAlert>
    ) : null,
  ].filter(Boolean);

  const content = (() => {
    if (!accountingEnabled) {
      return (
        <VmAlert status="warning">
          <VmAlert.Indicator />
          <VmAlert.Content>
            <VmAlert.Title>
              La contabilidad general aun no esta habilitada para este negocio.
            </VmAlert.Title>
            <VmAlert.Description>
              Activa contabilidad desde Settings &gt; Accounting para usar libro
              diario, reportes y cierres.{' '}
            </VmAlert.Description>
          </VmAlert.Content>
        </VmAlert>
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
            monthlyComplianceAvailable={
              fiscalMonthlyComplianceAvailability.enabled
            }
            monthlyComplianceError={fiscalMonthlyComplianceAvailability.error}
            monthlyComplianceResolved={
              fiscalMonthlyComplianceAvailability.resolved
            }
            periods={fiscalCompliancePeriodKeys}
            defaultPeriodKey={periodOptions[0]?.periodKey ?? null}
          />
        );
      case 'accounting-monitor':
        return (
          <AccountingMonitorPanel
            deadLetters={projectionDeadLetters}
            records={ledgerRecords}
            replayingEventId={replayingEventId}
            onReplayIssue={replayProjection}
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
