import { Skeleton, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { VmButton } from '@/components/heroui';
import { FileExcelOutlined, PlusOutlined } from '@/constants/icons/antd';
import ROUTES_NAME from '@/router/routes/routesName';

import { JOURNAL_BOOK_PAGE_SIZE } from './constants';
import { JournalBookSummary } from './components/JournalBookSummary';
import { JournalBookTable } from './components/JournalBookTable';
import { JournalBookToolbar } from './components/JournalBookToolbar';
import { JournalEntryDetailDrawer } from '../JournalEntryDetailDrawer';
import { exportJournalBookWorkbook } from '../utils/journalBookExport';

import type { JournalBookSummaryTotals } from './types';
import type { AccountingLedgerRecord } from '../../utils/accountingWorkspace';

interface JournalBookPanelProps {
  loading: boolean;
  onOpenOrigin: (record: AccountingLedgerRecord | null) => Promise<boolean>;
  records: AccountingLedgerRecord[];
  openingOriginRecordId: string | null;
  requestedRecord: AccountingLedgerRecord | null;
  requestedSelectionKey: string | null;
  onReverseEntry: (
    entry: NonNullable<AccountingLedgerRecord['journalEntry']>,
  ) => Promise<boolean>;
  reversingEntryId: string | null;
}

export const JournalBookPanel = ({
  loading,
  onOpenOrigin,
  openingOriginRecordId,
  onReverseEntry,
  records,
  requestedRecord,
  requestedSelectionKey,
  reversingEntryId,
}: JournalBookPanelProps) => {
  const navigate = useNavigate();
  const [moduleFilter, setModuleFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [previewOnly, setPreviewOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [manualSelectedRecord, setManualSelectedRecord] =
    useState<AccountingLedgerRecord | null>(null);
  const [dismissedRequestedSelectionKey, setDismissedRequestedSelectionKey] =
    useState<string | null>(null);
  const notifiedMissingSelectionKeyRef = useRef<string | null>(null);

  const moduleOptions = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.moduleLabel))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const fromTime = dateFrom
      ? new Date(`${dateFrom}T00:00:00`).getTime()
      : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return records.filter((record) => {
      const recordTime = record.entryDate?.getTime() ?? null;

      if (moduleFilter !== 'all' && record.moduleLabel !== moduleFilter) {
        return false;
      }

      if (previewOnly && record.detailMode !== 'projected') {
        return false;
      }

      if (typeFilter !== 'all' && record.journalTypeKey !== typeFilter) {
        return false;
      }

      if (
        fromTime !== null &&
        (recordTime === null ||
          Number.isNaN(recordTime) ||
          recordTime < fromTime)
      ) {
        return false;
      }

      if (
        toTime !== null &&
        (recordTime === null || Number.isNaN(recordTime) || recordTime > toTime)
      ) {
        return false;
      }

      if (normalizedQuery && !record.searchIndex.includes(normalizedQuery)) {
        return false;
      }

      return true;
    });
  }, [dateFrom, dateTo, moduleFilter, previewOnly, query, records, typeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / JOURNAL_BOOK_PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRecords = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * JOURNAL_BOOK_PAGE_SIZE;

    return filteredRecords.slice(
      startIndex,
      startIndex + JOURNAL_BOOK_PAGE_SIZE,
    );
  }, [filteredRecords, safeCurrentPage]);

  const activeRequestedRecord =
    requestedSelectionKey &&
    requestedSelectionKey !== dismissedRequestedSelectionKey
      ? requestedRecord
      : null;
  const selectedRecord = activeRequestedRecord ?? manualSelectedRecord;
  const summary = useMemo<JournalBookSummaryTotals>(
    () =>
      filteredRecords.reduce<JournalBookSummaryTotals>(
        (totals, record) => {
          const debit = record.lines.reduce((sum, line) => sum + line.debit, 0);
          const credit = record.lines.reduce(
            (sum, line) => sum + line.credit,
            0,
          );

          totals.debit += debit;
          totals.credit += credit;
          totals.debitMovements += record.lines.filter(
            (line) => line.debit > 0,
          ).length;
          totals.creditMovements += record.lines.filter(
            (line) => line.credit > 0,
          ).length;

          if (record.detailMode === 'posted') {
            totals.posted += 1;
          }

          if (record.detailMode === 'projected') {
            totals.projected += 1;
          }

          if (record.statusTone === 'warning') {
            totals.warning += 1;
          }

          if (record.statusTone === 'neutral') {
            totals.pending += 1;
          }

          if (record.statusLabel === 'Revertido') {
            totals.reversed += 1;
          }

          return totals;
        },
        {
          credit: 0,
          creditMovements: 0,
          debit: 0,
          debitMovements: 0,
          pending: 0,
          posted: 0,
          projected: 0,
          reversed: 0,
          warning: 0,
        },
      ),
    [filteredRecords],
  );
  const difference = Math.abs(summary.debit - summary.credit);
  const filteredLinesCount = useMemo(
    () =>
      filteredRecords.reduce(
        (totalLines, record) => totalLines + record.lines.length,
        0,
      ),
    [filteredRecords],
  );
  const activeRangeLabel = (() => {
    if (dateFrom && dateTo) {
      return `${dateFrom} - ${dateTo}`;
    }

    if (dateFrom) {
      return `Desde ${dateFrom}`;
    }

    if (dateTo) {
      return `Hasta ${dateTo}`;
    }

    return 'Todo el historial';
  })();

  useEffect(() => {
    if (
      !requestedSelectionKey ||
      loading ||
      activeRequestedRecord ||
      requestedSelectionKey === notifiedMissingSelectionKeyRef.current
    ) {
      return;
    }

    notifiedMissingSelectionKeyRef.current = requestedSelectionKey;
    void message.info(
      'No se encontro un asiento contable exacto para este documento.',
    );
  }, [activeRequestedRecord, loading, requestedSelectionKey]);

  const handleSelectRecord = (record: AccountingLedgerRecord) => {
    if (requestedSelectionKey) {
      setDismissedRequestedSelectionKey(requestedSelectionKey);
    }
    setManualSelectedRecord(record);
  };

  const handleCloseDrawer = () => {
    if (requestedSelectionKey && activeRequestedRecord) {
      setDismissedRequestedSelectionKey(requestedSelectionKey);
    }
    setManualSelectedRecord(null);
  };

  const handleExport = async () => {
    if (!filteredRecords.length) {
      void message.error(
        'No hay movimientos para exportar con los filtros actuales.',
      );
      return;
    }

    setExporting(true);
    try {
      await exportJournalBookWorkbook({
        moduleFilter,
        dateFrom,
        dateTo,
        records: filteredRecords,
      });
      void message.success('Libro diario exportado a Excel.');
    } catch (error) {
      console.error('Error exportando libro diario:', error);
      void message.error('No se pudo exportar el libro diario.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    void message.info('Importacion contable aun no disponible en este modulo.');
  };

  if (loading) {
    return (
      <Panel>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Panel>
    );
  }

  return (
    <Panel>
      <HeaderBar>
        <HeaderCopy>
          <HeaderTitle>Libro Diario</HeaderTitle>
          <HeaderMeta>
            {filteredRecords.length} asientos · {filteredLinesCount} lineas ·{' '}
            {activeRangeLabel}
          </HeaderMeta>
        </HeaderCopy>

        <HeaderActions>
          <VmButton
            variant="secondary"
            isPending={exporting}
            onPress={() => {
              void handleExport();
            }}
          >
            <FileExcelOutlined />
            Exportar
          </VmButton>
          <VmButton variant="secondary" onPress={handleImport}>
            Importar
          </VmButton>
          <VmButton
            variant="primary"
            aria-label="Nuevo asiento"
            onPress={() => {
              void navigate(ROUTES_NAME.ACCOUNTING_TERM.ACCOUNTING_MANUAL_ENTRIES);
            }}
          >
            <PlusOutlined />
            Nuevo Asiento
          </VmButton>
        </HeaderActions>
      </HeaderBar>

      <JournalBookSummary difference={difference} summary={summary} />

      <JournalOperations>
        <JournalBookToolbar
          dateFrom={dateFrom}
          dateTo={dateTo}
          moduleFilter={moduleFilter}
          moduleOptions={moduleOptions}
          previewOnly={previewOnly}
          query={query}
          setCurrentPage={setCurrentPage}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          setModuleFilter={setModuleFilter}
          setPreviewOnly={setPreviewOnly}
          setQuery={setQuery}
          setTypeFilter={setTypeFilter}
          typeFilter={typeFilter}
        />
        <JournalBookTable
          difference={difference}
          filteredRecords={filteredRecords}
          onPageChange={setCurrentPage}
          onSelectRecord={handleSelectRecord}
          pagedRecords={pagedRecords}
          safeCurrentPage={safeCurrentPage}
          selectedRecordId={selectedRecord?.id ?? null}
          summary={summary}
          totalPages={totalPages}
        />
      </JournalOperations>

      <JournalEntryDetailDrawer
        open={Boolean(selectedRecord)}
        openingOrigin={selectedRecord?.id === openingOriginRecordId}
        onOpenOrigin={onOpenOrigin}
        record={selectedRecord}
        reversing={Boolean(
          selectedRecord?.journalEntry &&
          reversingEntryId === selectedRecord.journalEntry.id,
        )}
        onClose={handleCloseDrawer}
        onReverseEntry={onReverseEntry}
      />
    </Panel>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  min-height: calc(100dvh - 48px);
  overflow: visible;
  padding: var(--ds-space-3) 0 0;
`;

const HeaderBar = styled.section`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
  flex-wrap: wrap;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: clamp(1.25rem, 1.4vw, 1.5rem);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
`;

const HeaderMeta = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const JournalOperations = styled.section`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--ds-space-3);
  height: clamp(460px, 88dvh, 760px);
  min-height: 0;
`;
