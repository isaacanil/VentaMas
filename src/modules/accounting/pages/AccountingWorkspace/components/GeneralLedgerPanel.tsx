import { Alert, message } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import styled from 'styled-components';

import type { DatePickerRangeValue } from '@/components/common/DatePicker/types';
import { fbGetAccountingReports } from '@/firebase/accounting/fbGetAccountingReports';

import {
  formatAccountingPeriod,
} from '../utils/accountingWorkspace';
import {
  normalizeGeneralLedgerSnapshot,
  useAccountingBackendReports,
} from '../hooks/useAccountingBackendReports';
import { JournalEntryDetailDrawer } from './JournalEntryDetailDrawer';
import { GeneralLedgerEmptyState } from './GeneralLedgerPanel/GeneralLedgerEmptyState';
import { GeneralLedgerHeader } from './GeneralLedgerPanel/GeneralLedgerHeader';
import { GeneralLedgerPagination } from './GeneralLedgerPanel/GeneralLedgerPagination';
import { GeneralLedgerSummaryCard } from './GeneralLedgerPanel/GeneralLedgerSummaryCard';
import { GeneralLedgerTable } from './GeneralLedgerPanel/GeneralLedgerTable';
import { GeneralLedgerToolbar } from './GeneralLedgerPanel/GeneralLedgerToolbar';
import { GeneralLedgerTAccountCard } from './GeneralLedgerPanel/GeneralLedgerTAccountCard';
import {
  formatDateInputValue,
  getVisibleLedgerMetrics,
} from './GeneralLedgerPanel/generalLedgerPanelUtils';
import { exportGeneralLedgerWorkbook } from './utils/generalLedgerExport';

import type {
  AccountingLedgerRecord,
  GeneralLedgerMovement,
} from '../utils/accountingWorkspace';

interface GeneralLedgerPanelProps {
  businessId: string | null;
  enabled: boolean;
  onOpenOrigin: (record: AccountingLedgerRecord | null) => Promise<boolean>;
  openingOriginRecordId: string | null;
}

const PAGE_SIZE = 50;

export const GeneralLedgerPanel = ({
  businessId,
  enabled,
  onOpenOrigin,
  openingOriginRecordId,
}: GeneralLedgerPanelProps) => {
  const [accountId, setAccountId] = useState('');
  const [periodFilter] = useState('');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [selectedMovement, setSelectedMovement] =
    useState<GeneralLedgerMovement | null>(null);

  const deferredQuery = useDeferredValue(query.trim());

  const {
    error,
    generalLedgerAccountOptions: accountOptions,
    generalLedgerSnapshot: snapshot,
    loading,
    periods,
    selectedLedgerAccountId,
  } = useAccountingBackendReports({
    businessId,
    enabled,
    includeFinancialReports: false,
    includeGeneralLedger: true,
    ledgerAccountId: accountId || null,
    ledgerPage: page,
    ledgerPageSize: PAGE_SIZE,
    ledgerPeriodKey: periodFilter || null,
    ledgerQuery: deferredQuery || null,
  });

  const selectedAccountId = selectedLedgerAccountId ?? accountId;
  const selectedAccount = snapshot?.account ?? null;
  const activePeriodValue = periodFilter || periods[0] || undefined;
  const pagedEntries = useMemo(
    () => snapshot?.entries ?? [],
    [snapshot?.entries],
  );

  const entryDates = useMemo(
    () =>
      pagedEntries
        .map((entry) => entry.entryDate)
        .filter((entryDate): entryDate is Date => Boolean(entryDate)),
    [pagedEntries],
  );

  const defaultDateFrom = formatDateInputValue(entryDates[0] ?? null);
  const defaultDateTo = formatDateInputValue(entryDates.at(-1) ?? null);
  const hasExplicitDateRange = Boolean(dateFrom || dateTo);
  const effectiveDateFrom = hasExplicitDateRange ? dateFrom : defaultDateFrom;
  const effectiveDateTo = hasExplicitDateRange ? dateTo : defaultDateTo;

  const filteredEntries = useMemo(() => {
    const fromTime = effectiveDateFrom
      ? new Date(`${effectiveDateFrom}T00:00:00`).getTime()
      : null;
    const toTime = effectiveDateTo
      ? new Date(`${effectiveDateTo}T23:59:59`).getTime()
      : null;

    return pagedEntries.filter((entry) => {
      const entryTime = entry.entryDate?.getTime() ?? null;
      if (fromTime !== null && (entryTime === null || entryTime < fromTime)) {
        return false;
      }
      if (toTime !== null && (entryTime === null || entryTime > toTime)) {
        return false;
      }
      return true;
    });
  }, [effectiveDateFrom, effectiveDateTo, pagedEntries]);

  const visibleMetrics = useMemo(
    () => getVisibleLedgerMetrics(filteredEntries, snapshot?.openingBalance ?? 0),
    [filteredEntries, snapshot?.openingBalance],
  );
  const tAccountDebitRows = filteredEntries.filter((entry) => entry.debit > 0);
  const tAccountCreditRows = filteredEntries.filter((entry) => entry.credit > 0);

  const resetPage = useCallback(() => {
    setPage(1);
    setSelectedMovement(null);
  }, []);

  const handleAccountChange = useCallback(
    (value: string) => {
      if (value === accountId) return;

      setAccountId(value);
      setDateFrom('');
      setDateTo('');
      resetPage();
    },
    [accountId, resetPage],
  );

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      resetPage();
    },
    [resetPage],
  );

  const dateRangeValue = useMemo<DatePickerRangeValue>(() => {
    const start = effectiveDateFrom
      ? DateTime.fromISO(effectiveDateFrom)
      : null;
    const end = effectiveDateTo ? DateTime.fromISO(effectiveDateTo) : null;

    return [
      start?.isValid ? start : null,
      end?.isValid ? end : null,
    ];
  }, [effectiveDateFrom, effectiveDateTo]);

  const handleDateRangeChange = useCallback(
    (range: DatePickerRangeValue | null) => {
      const nextFrom = range?.[0]?.toISODate() ?? '';
      const nextTo = range?.[1]?.toISODate() ?? '';

      if (nextFrom === effectiveDateFrom && nextTo === effectiveDateTo) {
        return;
      }

      setDateFrom(nextFrom);
      setDateTo(nextTo);
      resetPage();
    },
    [effectiveDateFrom, effectiveDateTo, resetPage],
  );

  const handleExport = async () => {
    if (!snapshot || !selectedAccount) return;
    setExporting(true);
    try {
      const result = await fbGetAccountingReports({
        businessId: businessId ?? '',
        includeFinancialReports: false,
        includeGeneralLedger: true,
        ledgerAccountId: selectedAccount.id,
        ledgerPage: 1,
        ledgerPageSize: 100,
        ledgerPeriodKey: periodFilter || null,
        ledgerQuery: deferredQuery || null,
      });
      const exportSnapshot = normalizeGeneralLedgerSnapshot(
        result.generalLedger?.snapshot,
      );
      if (!exportSnapshot) {
        throw new Error('No se pudo reconstruir el snapshot para exportacion.');
      }
      await exportGeneralLedgerWorkbook({
        accountCode: selectedAccount.code,
        accountName: selectedAccount.name,
        periodKey:
          result.generalLedger?.selectedPeriodKey ?? periodFilter ?? null,
        snapshot: exportSnapshot,
      });
      if (exportSnapshot.pagination.hasNextPage) {
        void message.warning(
          'La exportación se limitó a los primeros 100 movimientos del filtro actual.',
        );
      }
      void message.success('Libro mayor exportado a Excel.');
    } catch (error) {
      console.error('Error exportando libro mayor:', error);
      void message.error('No se pudo exportar el archivo.');
    } finally {
      setExporting(false);
    }
  };

  const handleAuxiliary = () => {
    void message.info('Vista auxiliar del mayor aun no disponible.');
  };

  if (!accountOptions.length) {
    return <GeneralLedgerEmptyState loading={loading} />;
  }

  if (!snapshot) {
    return (
      <Panel>
        {error ? (
          <Alert
            type="error"
            showIcon
            message="No se pudo cargar el libro mayor."
            description={error}
          />
        ) : null}
      </Panel>
    );
  }

  return (
    <Panel>
      <GeneralLedgerHeader
        exporting={exporting}
        periodLabel={
          activePeriodValue ? formatAccountingPeriod(activePeriodValue) : null
        }
        onAuxiliary={handleAuxiliary}
        onExport={() => {
          void handleExport();
        }}
      />

      <GeneralLedgerToolbar
        accountOptions={accountOptions}
        dateRangeValue={dateRangeValue}
        query={query}
        selectedAccountId={selectedAccountId}
        onAccountChange={handleAccountChange}
        onDateRangeChange={handleDateRangeChange}
        onQueryChange={handleQueryChange}
      />

      <ContentGrid>
        <MainColumn>
          <GeneralLedgerTable
            effectiveDateFrom={effectiveDateFrom}
            entries={filteredEntries}
            metrics={visibleMetrics}
            onSelectMovement={setSelectedMovement}
          />
        </MainColumn>

        <SideColumn>
          <GeneralLedgerSummaryCard
            account={selectedAccount}
            metrics={visibleMetrics}
          />

          <GeneralLedgerTAccountCard
            creditRows={tAccountCreditRows}
            debitRows={tAccountDebitRows}
            metrics={visibleMetrics}
          />
        </SideColumn>
      </ContentGrid>

      {snapshot.pagination.totalEntries > snapshot.pagination.pageSize ? (
        <GeneralLedgerPagination
          pagination={snapshot.pagination}
          onChange={setPage}
        />
      ) : null}

      <JournalEntryDetailDrawer
        open={Boolean(selectedMovement)}
        openingOrigin={
          Boolean(selectedMovement?.sourceRecord) &&
          selectedMovement?.sourceRecord.id === openingOriginRecordId
        }
        onOpenOrigin={onOpenOrigin}
        record={selectedMovement?.sourceRecord ?? null}
        onClose={() => setSelectedMovement(null)}
      />
    </Panel>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  padding: var(--ds-space-6) 0 var(--ds-space-8);
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 0.95fr);
  gap: var(--ds-space-4);

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  min-width: 0;
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
`;
