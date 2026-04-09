import { Button, Empty, Input, Pagination, Select, Skeleton, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { FileExcelOutlined } from '@/constants/icons/antd';

import {
  formatAccountingDate,
  formatAccountingMoney,
} from '../utils/accountingWorkspace';
import { JournalEntryDetailDrawer } from './JournalEntryDetailDrawer';
import { exportJournalBookWorkbook } from './utils/journalBookExport';

import type { AccountingLedgerRecord } from '../utils/accountingWorkspace';

const JOURNAL_BOOK_PAGE_SIZE = 10;

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
  const [moduleFilter, setModuleFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return records.filter((record) => {
      const recordTime = record.entryDate?.getTime() ?? null;

      if (moduleFilter !== 'all' && record.moduleLabel !== moduleFilter) {
        return false;
      }

      if (
        fromTime !== null &&
        (recordTime === null || Number.isNaN(recordTime) || recordTime < fromTime)
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
  }, [dateFrom, dateTo, moduleFilter, query, records]);

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
      void message.error('No hay movimientos para exportar con los filtros actuales.');
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

  if (loading) {
    return (
      <Panel>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Panel>
    );
  }

  return (
    <Panel>
      <Toolbar>
        <ToolbarField>
          <ToolbarLabel htmlFor="journal-search">Buscar</ToolbarLabel>
          <Input
            id="journal-search"
            allowClear
            placeholder="Factura, cobro, descripcion o cuenta"
            value={query}
            onChange={(event) => {
              setCurrentPage(1);
              setQuery(event.target.value);
            }}
          />
        </ToolbarField>

        <ToolbarField>
          <ToolbarLabel htmlFor="journal-module">Modulo</ToolbarLabel>
          <Select
            id="journal-module"
            value={moduleFilter}
            options={[
              { label: 'Todos', value: 'all' },
              ...moduleOptions.map((option) => ({
                label: option,
                value: option,
              })),
            ]}
            onChange={(value) => {
              setCurrentPage(1);
              setModuleFilter(value);
            }}
          />
        </ToolbarField>

        <ToolbarField>
          <ToolbarLabel htmlFor="journal-date-from">Desde</ToolbarLabel>
          <Input
            id="journal-date-from"
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setCurrentPage(1);
              setDateFrom(event.target.value);
            }}
          />
        </ToolbarField>

        <ToolbarField>
          <ToolbarLabel htmlFor="journal-date-to">Hasta</ToolbarLabel>
          <Input
            id="journal-date-to"
            type="date"
            value={dateTo}
            onChange={(event) => {
              setCurrentPage(1);
              setDateTo(event.target.value);
            }}
          />
        </ToolbarField>

        <ToolbarAction>
          <Button
            icon={<FileExcelOutlined />}
            loading={exporting}
            onClick={() => {
              void handleExport();
            }}
          >
            Exportar Excel
          </Button>
        </ToolbarAction>
      </Toolbar>

      {filteredRecords.length === 0 ? (
        <EmptyState>
          <Empty
            description="No hay movimientos que coincidan con los filtros actuales."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </EmptyState>
      ) : (
        <>
          <TableShell>
            <JournalTable>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Origen</th>
                  <th>Modulo</th>
                  <th>Referencia</th>
                  <th>Descripcion</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.map((record) => (
                  <JournalRow
                    key={record.id}
                    onClick={() => handleSelectRecord(record)}
                  >
                    <DateCell>
                      {formatAccountingDate(record.entryDate)}
                    </DateCell>
                    <td>{record.sourceLabel}</td>
                    <td>{record.moduleLabel}</td>
                    <td>{record.reference}</td>
                    <DescriptionCell>
                      <strong>{record.title}</strong>
                      <span>{record.description}</span>
                    </DescriptionCell>
                    <AmountCell>{formatAccountingMoney(record.amount)}</AmountCell>
                    <td>
                      {record.statusTone === 'success' ? (
                        <StatusText>{record.statusLabel}</StatusText>
                      ) : (
                        <StatusBadge $tone={record.statusTone}>
                          {record.statusLabel}
                        </StatusBadge>
                      )}
                    </td>
                  </JournalRow>
                ))}
              </tbody>
            </JournalTable>
          </TableShell>

          {filteredRecords.length > JOURNAL_BOOK_PAGE_SIZE ? (
            <PaginationRow>
              <PaginationInfo>
                Mostrando {pagedRecords.length} de {filteredRecords.length}{' '}
                movimientos
              </PaginationInfo>
              <Pagination
                current={safeCurrentPage}
                pageSize={JOURNAL_BOOK_PAGE_SIZE}
                total={filteredRecords.length}
                showSizeChanger={false}
                onChange={(page) => setCurrentPage(page)}
              />
            </PaginationRow>
          ) : null}
        </>
      )}

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
  gap: var(--ds-space-5);
  padding: var(--ds-space-6) 0 var(--ds-space-8);
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) minmax(180px, 0.8fr) repeat(
      2,
      minmax(160px, 0.7fr)
    ) auto;
  gap: 12px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ToolbarAction = styled.div`
  display: flex;
  align-items: flex-end;
`;

const ToolbarField = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
`;

const ToolbarLabel = styled.label`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ds-color-text-secondary);
`;

const TableShell = styled.div`
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const JournalTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-default);
    text-align: left;
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-line-height-tight);
    letter-spacing: var(--ds-letter-spacing-wide);
    text-transform: uppercase;
    color: var(--ds-color-text-secondary);
    background: var(--ds-color-bg-subtle);
    font-weight: var(--ds-font-weight-semibold);
  }
`;

const JournalRow = styled.tr`
  cursor: pointer;
  transition: background-color 150ms ease;

  td {
    padding: var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    font-size: var(--ds-font-size-base);
    line-height: var(--ds-line-height-normal);
    color: var(--ds-color-text-secondary);
    vertical-align: top;
  }

  &:last-child td {
    border-bottom: none;
  }

  &:hover td {
    background: var(--ds-color-interactive-hover-bg);
  }
`;

const DescriptionCell = styled.td`
  && {
    display: table-cell;
  }

  strong {
    display: block;
    margin-bottom: 2px;
    color: var(--ds-color-text-primary);
    font-weight: var(--ds-font-weight-medium);
  }

  span {
    display: block;
    color: var(--ds-color-text-secondary);
  }
`;

const DateCell = styled.td`
  white-space: pre-line;
  font-variant-numeric: tabular-nums;
`;

const StatusBadge = styled.span<{ $tone: 'success' | 'warning' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border: 1px solid
    ${(props) =>
      props.$tone === 'warning'
        ? 'var(--ds-color-state-warning)'
        : 'var(--ds-color-border-strong)'};
  border-radius: var(--ds-radius-md);
  background: ${(props) =>
    props.$tone === 'warning'
      ? 'var(--ds-color-state-warning-subtle)'
      : 'var(--ds-color-bg-subtle)'};
  color: ${(props) =>
    props.$tone === 'warning'
      ? 'var(--ds-color-state-warning-text)'
      : 'var(--ds-color-text-secondary)'};
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-normal);
  text-transform: uppercase;
`;

const StatusText = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
`;

const AmountCell = styled.td`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--ds-color-text-primary);
`;

const EmptyState = styled.div`
  padding: var(--ds-space-8) var(--ds-space-4);
`;

const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-4);
  flex-wrap: wrap;
  padding: 0 var(--ds-space-1);

  .ant-pagination {
    margin: 0;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PaginationInfo = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;
