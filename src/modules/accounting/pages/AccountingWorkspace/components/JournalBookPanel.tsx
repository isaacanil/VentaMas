import {
  Button,
  Empty,
  Input,
  Pagination,
  Select,
  Skeleton,
  Switch,
  message,
} from 'antd';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { FileExcelOutlined, PlusOutlined } from '@/constants/icons/antd';
import ROUTES_NAME from '@/router/routes/routesName';

import {
  formatAccountingDate,
  formatAccountingMoney,
} from '../utils/accountingWorkspace';
import { JournalEntryDetailDrawer } from './JournalEntryDetailDrawer';
import { exportJournalBookWorkbook } from './utils/journalBookExport';

import type { AccountingLedgerRecord } from '../utils/accountingWorkspace';

const JOURNAL_BOOK_PAGE_SIZE = 10;
const JOURNAL_TYPE_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'Venta', value: 'sale' },
  { label: 'Compra', value: 'purchase' },
  { label: 'Pago', value: 'payment' },
  { label: 'Cobro', value: 'collection' },
  { label: 'Gasto', value: 'expense' },
  { label: 'Nomina', value: 'payroll' },
  { label: 'Ajuste', value: 'adjustment' },
] as const;

const SYSTEM_GENERATED_REFERENCE_PATTERN =
  /^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+__[\w-]+$/i;
const OPAQUE_USER_PATTERN = /^[A-Za-z0-9_-]{20,}$/;
const OPAQUE_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{12,}$/;
const USER_ID_LIKE_PATTERN =
  /^(?=.{8,}$)(?=.*\d|.*[A-Z])[A-Za-z0-9_-]+$/;

const pad2 = (value: number) => value.toString().padStart(2, '0');

const buildCompactCode = (
  prefix: 'DOC' | 'USR',
  entryDate: Date | null,
  stableSeed: string,
): string => {
  let hash = 0;
  for (let index = 0; index < stableSeed.length; index += 1) {
    hash = (hash * 31 + stableSeed.charCodeAt(index)) % 10000;
  }

  const year = entryDate?.getFullYear() ?? 0;
  const month = pad2((entryDate?.getMonth() ?? 0) + 1);
  return `${prefix}-${year.toString().padStart(4, '0')}-${month}-${hash
    .toString()
    .padStart(4, '0')}`;
};

const formatJournalAmount = (value: number): string =>
  Math.abs(value) < 0.005 ? '—' : `RD$ ${formatAccountingMoney(value)}`;

const formatDocumentLabel = (record: AccountingLedgerRecord): string => {
  const documentReference = record.documentReference?.trim();
  if (!documentReference) {
    return '—';
  }

  return SYSTEM_GENERATED_REFERENCE_PATTERN.test(documentReference) ||
    OPAQUE_REFERENCE_PATTERN.test(documentReference)
    ? buildCompactCode('DOC', record.entryDate, documentReference)
    : documentReference;
};

const formatUserLabel = (record: AccountingLedgerRecord): string => {
  const cleaned = record.userLabel?.trim();
  if (cleaned?.length) {
    if (cleaned.startsWith('system:')) {
      return 'Sistema';
    }

    if (cleaned.includes('@')) {
      return cleaned.split('@')[0];
    }

    if (
      OPAQUE_USER_PATTERN.test(cleaned) ||
      USER_ID_LIKE_PATTERN.test(cleaned) ||
      (cleaned.includes(':') && !cleaned.includes(' '))
    ) {
      return buildCompactCode('USR', record.entryDate, cleaned);
    }

    return cleaned;
  }

  return record.sourceKind === 'automatic' ? 'Sistema' : '—';
};

const formatAccountLabel = (
  line: AccountingLedgerRecord['lines'][number] | null | undefined,
): string => {
  if (!line) {
    return '—';
  }

  const code = line.accountCode?.trim();
  const name = line.accountName?.trim();

  if (code && name) {
    return `${code} ${name}`;
  }

  return code ?? name ?? '—';
};

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
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
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
  const summary = useMemo(
    () =>
      filteredRecords.reduce(
        (totals, record) => {
          const debit = record.lines.reduce((sum, line) => sum + line.debit, 0);
          const credit = record.lines.reduce(
            (sum, line) => sum + line.credit,
            0,
          );

          totals.debit += debit;
          totals.credit += credit;
          totals.debitMovements += record.lines.filter((line) => line.debit > 0)
            .length;
          totals.creditMovements += record.lines.filter((line) => line.credit > 0)
            .length;

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
          <Button
            icon={<FileExcelOutlined />}
            loading={exporting}
            onClick={() => {
              void handleExport();
            }}
          >
            Exportar
          </Button>
          <Button onClick={handleImport}>Importar</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            aria-label="Nuevo asiento"
            title="Nuevo asiento"
            onClick={() =>
              navigate(ROUTES_NAME.ACCOUNTING_TERM.ACCOUNTING_MANUAL_ENTRIES)
            }
          />
        </HeaderActions>
      </HeaderBar>

      <SummaryStrip>
        <SummaryItem $tone="debit">
          <span>Debitos periodo</span>
          <strong>{formatJournalAmount(summary.debit)}</strong>
          <small>{summary.debitMovements} movimientos</small>
        </SummaryItem>
        <SummaryItem $tone="credit">
          <span>Creditos periodo</span>
          <strong>{formatJournalAmount(summary.credit)}</strong>
          <small>{summary.creditMovements} movimientos</small>
        </SummaryItem>
        <SummaryItem $balanced={difference < 0.005}>
          <span>Diferencia</span>
          <strong>{formatJournalAmount(difference)}</strong>
          <small>{difference < 0.005 ? 'Cuadrado' : 'Revisar descuadre'}</small>
        </SummaryItem>
        <SummaryItem>
          <span>Estado</span>
          <StatusStack>
            <StatusMetric>
              <StatusDot $tone="success" />
              <span>{summary.posted} posteados</span>
            </StatusMetric>
            <StatusMetric>
              <StatusDot $tone="warning" />
              <span>{summary.projected} previos</span>
            </StatusMetric>
            {summary.warning > 0 ? (
              <StatusMetric>
                <StatusDot $tone="warning" />
                <span>{summary.warning} con alerta</span>
              </StatusMetric>
            ) : null}
            {summary.pending > 0 ? (
              <StatusMetric>
                <StatusDot $tone="neutral" />
                <span>{summary.pending} pendientes</span>
              </StatusMetric>
            ) : null}
            {summary.reversed > 0 ? (
              <StatusMetric>
                <StatusDot $tone="neutral" />
                <span>{summary.reversed} revertidos</span>
              </StatusMetric>
            ) : null}
          </StatusStack>
        </SummaryItem>
      </SummaryStrip>

      <ToolbarShell>
        <Toolbar>
          <ToolbarField $width="compact">
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

          <ToolbarField $width="compact">
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

          <ToolbarField $width="compact">
            <ToolbarLabel htmlFor="journal-type">Tipo</ToolbarLabel>
            <Select
              id="journal-type"
              value={typeFilter}
              options={JOURNAL_TYPE_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              onChange={(value) => {
                setCurrentPage(1);
                setTypeFilter(value);
              }}
            />
          </ToolbarField>

          <ToolbarField $width="compact">
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

          <ToolbarField $width="search">
            <ToolbarLabel htmlFor="journal-search">Buscar</ToolbarLabel>
            <Input
              id="journal-search"
              allowClear
              placeholder="NCF, referencia, descripcion o cuenta"
              value={query}
              onChange={(event) => {
                setCurrentPage(1);
                setQuery(event.target.value);
              }}
            />
          </ToolbarField>

          <ToolbarToggle>
            <ToolbarLabel htmlFor="journal-preview-only">Solo previos</ToolbarLabel>
            <ToggleRow>
              <Switch
                id="journal-preview-only"
                size="small"
                checked={previewOnly}
                onChange={(checked) => {
                  setCurrentPage(1);
                  setPreviewOnly(checked);
                }}
              />
              <span>No posteados</span>
            </ToggleRow>
          </ToolbarToggle>
        </Toolbar>
      </ToolbarShell>

      {filteredRecords.length === 0 ? (
        <EmptyState>
          <Empty
            description="No hay asientos que coincidan con los filtros actuales."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </EmptyState>
      ) : (
        <>
          <TableShell>
            <JournalTable>
              <colgroup>
                <col style={{ width: '44px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '190px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '280px' }} />
                <col />
                <col style={{ width: '160px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '140px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th aria-label="Seleccion" />
                  <th>Fecha</th>
                  <th>Asiento</th>
                  <th>Tipo</th>
                  <th>Cuenta</th>
                  <th>Descripcion</th>
                  <th>Documento</th>
                  <th>Usuario</th>
                  <th className="amount-col">Debito</th>
                  <th className="amount-col">Credito</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.map((record) => {
                  const [primaryLine, ...derivedLines] = record.lines;
                  const selected = selectedRecord?.id === record.id;

                  return (
                    <Fragment key={record.id}>
                      <JournalEntryRow
                        $selected={selected}
                        aria-selected={selected}
                        onClick={() => handleSelectRecord(record)}
                      >
                        <SelectionCell>
                          <SelectionCheckbox
                            checked={selected}
                            readOnly
                            tabIndex={-1}
                            aria-label={`Seleccionar asiento ${record.entryReference}`}
                          />
                        </SelectionCell>
                        <DateCell>{formatAccountingDate(record.entryDate)}</DateCell>
                        <EntryCell>
                          <EntryReference>{record.entryReference}</EntryReference>
                          <EntryMeta>{record.statusLabel}</EntryMeta>
                        </EntryCell>
                        <TypeCell>
                          <TypeBadge>
                            <TypeDot />
                            <span>{record.journalTypeLabel}</span>
                          </TypeBadge>
                        </TypeCell>
                        <AccountCell>{formatAccountLabel(primaryLine)}</AccountCell>
                        <DescriptionCell>
                          <strong>{primaryLine?.description ?? record.description}</strong>
                          <span>{record.title}</span>
                        </DescriptionCell>
                        <DocumentCell>
                          <CompactMeta title={record.documentReference ?? undefined}>
                            {formatDocumentLabel(record)}
                          </CompactMeta>
                        </DocumentCell>
                        <UserCell>
                          <CompactMeta title={record.userLabel ?? undefined}>
                            {formatUserLabel(record)}
                          </CompactMeta>
                        </UserCell>
                        <AmountCell $tone="debit">
                          {formatJournalAmount(primaryLine?.debit ?? 0)}
                        </AmountCell>
                        <AmountCell $tone="credit">
                          {formatJournalAmount(primaryLine?.credit ?? 0)}
                        </AmountCell>
                      </JournalEntryRow>

                      {derivedLines.map((line) => (
                        <JournalDerivedRow
                          key={`${record.id}:${line.lineNumber}`}
                          $selected={selected}
                          onClick={() => handleSelectRecord(record)}
                        >
                          <SelectionCell />
                          <DerivedMarkerCell>↳</DerivedMarkerCell>
                          <td />
                          <td />
                          <AccountCell>{formatAccountLabel(line)}</AccountCell>
                          <DescriptionCell>
                            <strong>{line.description ?? record.description}</strong>
                            <span>Linea {line.lineNumber}</span>
                          </DescriptionCell>
                          <td />
                          <td />
                          <AmountCell $tone="debit">
                            {formatJournalAmount(line.debit)}
                          </AmountCell>
                          <AmountCell $tone="credit">
                            {formatJournalAmount(line.credit)}
                          </AmountCell>
                        </JournalDerivedRow>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <JournalTotalsRow>
                  <JournalTotalsLabelCell colSpan={8}>
                    Totales visibles · {pagedRecords.length} asientos en pagina ·{' '}
                    {filteredRecords.length} filtrados · diferencia{' '}
                    {formatJournalAmount(difference)}
                  </JournalTotalsLabelCell>
                  <JournalTotalsAmountCell $tone="debit">
                    {formatJournalAmount(summary.debit)}
                  </JournalTotalsAmountCell>
                  <JournalTotalsAmountCell $tone="credit">
                    {formatJournalAmount(summary.credit)}
                  </JournalTotalsAmountCell>
                </JournalTotalsRow>
              </tfoot>
            </JournalTable>
          </TableShell>

          {filteredRecords.length > JOURNAL_BOOK_PAGE_SIZE ? (
            <PaginationRow>
              <PaginationInfo>
                Mostrando {pagedRecords.length} de {filteredRecords.length} asientos
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

const ToolbarShell = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns:
    minmax(148px, 164px)
    minmax(148px, 164px)
    minmax(128px, 144px)
    minmax(128px, 144px)
    minmax(220px, 1fr)
    minmax(240px, 280px);
  gap: 10px;
  align-items: end;

  @media (max-width: 1380px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ToolbarField = styled.div<{ $width?: 'compact' | 'search' }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  min-width: 0;

  ${({ $width }) =>
    $width === 'compact'
      ? `
        width: 100%;
      `
      : $width === 'search'
        ? `
          width: 100%;
        `
        : ''}
`;

const ToolbarToggle = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  justify-content: flex-end;
  min-width: 0;
`;

const ToolbarLabel = styled.label`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ds-color-text-secondary);
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-height: 32px;
  padding: 0 var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);

  span {
    line-height: var(--ds-line-height-normal);
  }
`;

const SummaryStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryItem = styled.div<{
  $balanced?: boolean;
  $tone?: 'debit' | 'credit';
}>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 88px;
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: ${({ $balanced }) =>
    $balanced
      ? 'var(--ds-color-state-success-subtle, var(--ds-color-bg-surface))'
      : 'var(--ds-color-bg-surface)'};

  span {
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-line-height-tight);
    letter-spacing: var(--ds-letter-spacing-wide);
    text-transform: uppercase;
    color: var(--ds-color-text-secondary);
    font-weight: var(--ds-font-weight-medium);
  }

  strong {
    color: ${({ $balanced, $tone }) =>
      $tone === 'debit'
        ? 'var(--ds-color-state-success-text, #166534)'
        : $tone === 'credit'
          ? 'var(--ds-color-state-danger-text, #b42318)'
          : $balanced
            ? 'var(--ds-color-state-success-text, var(--ds-color-text-primary))'
            : 'var(--ds-color-text-primary)'};
    font-size: var(--ds-font-size-lg);
    line-height: var(--ds-line-height-tight);
    font-weight: var(--ds-font-weight-semibold);
    font-variant-numeric: tabular-nums;
  }

  small {
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-line-height-normal);
    color: var(--ds-color-text-secondary);
  }
`;

const StatusStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin-top: var(--ds-space-1);
`;

const StatusMetric = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const StatusDot = styled.span<{ $tone: 'success' | 'warning' | 'neutral' }>`
  width: 7px;
  height: 7px;
  border-radius: 999px;
  flex-shrink: 0;
  background: ${({ $tone }) =>
    $tone === 'success'
      ? 'var(--ds-color-state-success)'
      : $tone === 'warning'
        ? 'var(--ds-color-state-warning)'
        : 'var(--ds-color-text-secondary)'};
`;

const TableShell = styled.div`
  overflow: auto;
  max-height: min(70vh, 760px);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
  box-shadow: var(--ds-shadow-sm);
`;

const JournalTable = styled.table`
  width: 100%;
  min-width: 1320px;
  border-collapse: collapse;

  th {
    position: sticky;
    top: 0;
    z-index: 1;
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
    white-space: nowrap;
  }

  th.amount-col {
    text-align: right;
  }

  tfoot td {
    position: sticky;
    bottom: 0;
    z-index: 2;
  }
`;

const JournalEntryRow = styled.tr<{ $selected: boolean }>`
  cursor: pointer;
  transition: background-color 150ms ease;

  td {
    background: ${({ $selected }) =>
      $selected
        ? 'var(--ds-color-interactive-selected-bg)'
        : 'var(--ds-color-bg-surface)'};
    padding: var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-line-height-normal);
    color: var(--ds-color-text-secondary);
    vertical-align: top;
  }

  &:hover td {
    background: var(--ds-color-interactive-hover-bg);
  }
`;

const JournalDerivedRow = styled.tr<{ $selected: boolean }>`
  cursor: pointer;

  td {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    background: ${({ $selected }) =>
      $selected
        ? 'color-mix(in srgb, var(--ds-color-interactive-selected-bg) 78%, white)'
        : 'var(--ds-color-bg-table-row-alt)'};
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-line-height-normal);
    color: var(--ds-color-text-secondary);
    vertical-align: top;
  }

  &:hover td {
    background: var(--ds-color-interactive-hover-bg);
  }
`;

const SelectionCell = styled.td`
  width: 44px;
  padding-right: 0;
`;

const SelectionCheckbox = styled.input.attrs({ type: 'checkbox' })`
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--ds-color-interactive-default);
`;

const DateCell = styled.td`
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
`;

const EntryCell = styled.td`
  min-width: 176px;
`;

const EntryReference = styled.span`
  display: block;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  font-variant-numeric: tabular-nums;
`;

const EntryMeta = styled.span`
  display: block;
  margin-top: 2px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-tight);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
`;

const TypeCell = styled.td`
  white-space: nowrap;
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-interactive-default);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const TypeDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
`;

const AccountCell = styled.td`
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-medium);
`;

const DescriptionCell = styled.td`
  && {
    display: table-cell;
    min-width: 260px;
  }

  strong {
    display: block;
    margin-bottom: 2px;
    color: var(--ds-color-text-primary);
    font-weight: var(--ds-font-weight-medium);
    line-height: var(--ds-line-height-tight);
  }

  span {
    display: block;
    color: var(--ds-color-text-secondary);
    line-height: var(--ds-line-height-normal);
  }
`;

const DerivedMarkerCell = styled.td`
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-sm);
`;

const DocumentCell = styled.td`
  white-space: nowrap;
`;

const UserCell = styled.td`
  white-space: nowrap;
`;

const CompactMeta = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 26px;
  padding: 0 var(--ds-space-2);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-xs);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AmountCell = styled.td<{ $tone: 'debit' | 'credit' }>`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-align: right;
  font-family: var(--ds-font-family-mono, monospace);
  font-weight: var(--ds-font-weight-semibold);

  && {
    color: ${({ $tone }) =>
      $tone === 'debit'
        ? 'var(--ds-color-state-success-text, #166534)'
        : 'var(--ds-color-state-danger-text, #b42318)'};
  }
`;

const JournalTotalsRow = styled.tr``;

const JournalTotalsLabelCell = styled.td`
  padding: var(--ds-space-3) var(--ds-space-4);
  border-top: 1px solid var(--ds-color-border-default);
  background: color-mix(in srgb, var(--ds-color-bg-page) 92%, white);
  box-shadow: 0 -8px 16px rgba(15, 23, 42, 0.04);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
`;

const JournalTotalsAmountCell = styled.td<{ $tone: 'debit' | 'credit' }>`
  padding: var(--ds-space-3) var(--ds-space-4);
  border-top: 1px solid var(--ds-color-border-default);
  background: color-mix(in srgb, var(--ds-color-bg-page) 92%, white);
  box-shadow: 0 -8px 16px rgba(15, 23, 42, 0.04);
  text-align: right;
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  font-variant-numeric: tabular-nums;

  && {
    color: ${({ $tone }) =>
      $tone === 'debit'
        ? 'var(--ds-color-state-success-text, #166534)'
        : 'var(--ds-color-state-danger-text, #b42318)'};
  }
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
