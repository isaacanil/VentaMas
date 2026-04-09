import { Alert, Button, Empty, Input, Pagination, Select, message } from 'antd';
import { useDeferredValue, useState } from 'react';
import styled from 'styled-components';

import { FileExcelOutlined } from '@/constants/icons/antd';
import { fbGetAccountingReports } from '@/firebase/accounting/fbGetAccountingReports';

import {
  formatAccountingDate,
  formatAccountingMoney,
  formatAccountingPeriod,
} from '../utils/accountingWorkspace';
import {
  normalizeGeneralLedgerSnapshot,
  useAccountingBackendReports,
} from '../hooks/useAccountingBackendReports';
import { JournalEntryDetailDrawer } from './JournalEntryDetailDrawer';
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

export const GeneralLedgerPanel = ({
  businessId,
  enabled,
  onOpenOrigin,
  openingOriginRecordId,
}: GeneralLedgerPanelProps) => {
  const [accountId, setAccountId] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [selectedMovement, setSelectedMovement] =
    useState<GeneralLedgerMovement | null>(null);

  const PAGE_SIZE = 50;
  const deferredQuery = useDeferredValue(query.trim());

  const {
    error,
    generalLedgerAccountOptions,
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
  const accountOptions = generalLedgerAccountOptions;
  const selectedAccount = snapshot?.account ?? null;
  const activePeriodValue = periodFilter || periods[0] || undefined;
  const pagedEntries = snapshot?.entries ?? [];

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
        periodKey: result.generalLedger?.selectedPeriodKey ?? periodFilter ?? null,
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

  const resetPage = () => {
    setPage(1);
    setSelectedMovement(null);
  };

  if (!accountOptions.length) {
    return (
      <Panel>
        <SectionTitle>Libro mayor</SectionTitle>
        <SectionText>
          {loading
            ? 'Cargando cuentas contables del libro mayor...'
            : 'No hay cuentas posteables activas para generar el mayor.'}
        </SectionText>
      </Panel>
    );
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
      <Toolbar>
        <ToolbarField>
          <ToolbarLabel>Cuenta</ToolbarLabel>
          <Select
            showSearch
            optionFilterProp="label"
            value={selectedAccountId}
            options={accountOptions.map((option) => ({
              label:
                option.movementCount > 0
                  ? `${option.code} · ${option.name}`
                  : `${option.code} · ${option.name} (sin movimientos)`,
              value: option.id,
            }))}
            onChange={(v) => { setAccountId(v); resetPage(); }}
          />
        </ToolbarField>

        <ToolbarField>
          <ToolbarLabel>Periodo</ToolbarLabel>
          <Select
            value={activePeriodValue}
            options={periods.map((period) => ({
              label: formatAccountingPeriod(period),
              value: period,
            }))}
            onChange={(v) => { setPeriodFilter(v); resetPage(); }}
          />
        </ToolbarField>

        <ToolbarField>
          <ToolbarLabel>Buscar</ToolbarLabel>
          <Input
            allowClear
            placeholder="Referencia, modulo o descripcion"
            value={query}
            onChange={(event) => { setQuery(event.target.value); resetPage(); }}
          />
        </ToolbarField>
        <ToolbarAction>
          <Button
            icon={<FileExcelOutlined />}
            loading={exporting}
            onClick={() => { void handleExport(); }}
          >
            Exportar Excel
          </Button>
        </ToolbarAction>
      </Toolbar>

      <SummaryStrip>
        <SummaryItem>
          <span>Saldo inicial</span>
          <strong>{formatAccountingMoney(snapshot.openingBalance)}</strong>
        </SummaryItem>
        <SummaryItem>
          <span>Debitos del tramo</span>
          <strong>{formatAccountingMoney(snapshot.periodDebit)}</strong>
        </SummaryItem>
        <SummaryItem>
          <span>Creditos del tramo</span>
          <strong>{formatAccountingMoney(snapshot.periodCredit)}</strong>
        </SummaryItem>
        <SummaryItem $negative={snapshot.closingBalance < 0}>
          <span>Saldo final</span>
          <strong>{formatAccountingMoney(snapshot.closingBalance)}</strong>
        </SummaryItem>
      </SummaryStrip>

      <TableShell>
        <LedgerTable>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Referencia</th>
              <th>Descripción</th>
              <th className="amount-col">Débito</th>
              <th className="amount-col">Crédito</th>
              <th className="amount-col">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {pagedEntries.map((entry) => (
              <LedgerRow
                key={entry.id}
                onClick={() => setSelectedMovement(entry)}
              >
                <DateCell>{formatAccountingDate(entry.entryDate)}</DateCell>
                <td>
                  <strong>{entry.reference}</strong>
                  {entry.moduleLabel ? (
                    <SourceBadge>{entry.moduleLabel}{entry.sourceLabel ? ` · ${entry.sourceLabel}` : ''}</SourceBadge>
                  ) : null}
                </td>
                <td>
                  <strong>{entry.title}</strong>
                  {(entry.lineDescription ?? entry.description) ? (
                    <span>{entry.lineDescription ?? entry.description}</span>
                  ) : null}
                </td>
                <AmountCell>
                  {entry.debit ? formatAccountingMoney(entry.debit) : <Dash aria-hidden="true">—</Dash>}
                </AmountCell>
                <AmountCell>
                  {entry.credit ? formatAccountingMoney(entry.credit) : <Dash aria-hidden="true">—</Dash>}
                </AmountCell>
                <AmountCell $bold $negative={entry.runningBalance < 0}>
                  {formatAccountingMoney(entry.runningBalance)}
                </AmountCell>
              </LedgerRow>
            ))}
          </tbody>
        </LedgerTable>

        {!pagedEntries.length ? (
          <EmptyState>
            <Empty
              description="No hay movimientos para la cuenta seleccionada con esos filtros."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </EmptyState>
        ) : null}
      </TableShell>

      {snapshot.pagination.totalEntries > snapshot.pagination.pageSize ? (
        <PaginationRow>
          <PaginationInfo>
            Mostrando {(snapshot.pagination.page - 1) * snapshot.pagination.pageSize + 1}–{Math.min(snapshot.pagination.page * snapshot.pagination.pageSize, snapshot.pagination.totalEntries)} de {snapshot.pagination.totalEntries} movimientos
          </PaginationInfo>
          <Pagination
            current={snapshot.pagination.page}
            pageSize={snapshot.pagination.pageSize}
            total={snapshot.pagination.totalEntries}
            showSizeChanger={false}
            onChange={setPage}
          />
        </PaginationRow>
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

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 1.2fr) minmax(220px, 0.7fr) minmax(280px, 1fr) auto;
  gap: 12px;
  align-items: flex-end;

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

const ToolbarField = styled.label`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
`;

const ToolbarLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ds-color-text-secondary);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const SectionText = styled.p`
  margin: 6px 0 0;
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const SummaryStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryItem = styled.div<{ $negative?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-4);
  border: 1px solid
    ${({ $negative }) =>
      $negative
        ? 'var(--ds-color-state-danger-subtle)'
        : 'var(--ds-color-border-default)'};
  border-radius: var(--ds-radius-lg);
  background: ${({ $negative }) =>
    $negative
      ? 'var(--ds-color-state-danger-subtle)'
      : 'var(--ds-color-bg-surface)'};

  span {
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    text-transform: uppercase;
    letter-spacing: var(--ds-letter-spacing-wide);
    color: var(--ds-color-text-secondary);
  }

  strong {
    font-size: var(--ds-font-size-md);
    line-height: var(--ds-line-height-tight);
    color: ${({ $negative }) =>
      $negative
        ? 'var(--ds-color-state-danger-text)'
        : 'var(--ds-color-text-primary)'};
    font-variant-numeric: tabular-nums;
  }
`;

const TableShell = styled.div`
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const LedgerTable = styled.table`
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
    font-weight: var(--ds-font-weight-semibold);
    background: var(--ds-color-bg-subtle);
    white-space: nowrap;
  }

  th.amount-col {
    text-align: right;
  }
`;

const LedgerRow = styled.tr`
  cursor: pointer;
  transition: background-color 120ms ease;

  &:nth-child(even) td {
    background: var(--ds-color-bg-table-row-alt);
  }

  td {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    font-size: var(--ds-font-size-base);
    line-height: var(--ds-line-height-normal);
    color: var(--ds-color-text-secondary);
    vertical-align: middle;
  }

  td strong {
    display: block;
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-medium);
    line-height: 1.3;
  }

  td span {
    display: block;
    font-size: var(--ds-font-size-xs);
    color: var(--ds-color-text-secondary);
    margin-top: 2px;
    line-height: 1.3;
  }

  &:last-child td {
    border-bottom: none;
  }

  &:hover td {
    background: var(--ds-color-interactive-hover-bg) !important;
  }
`;

const DateCell = styled.td`
  white-space: nowrap;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  width: 110px;
`;

const SourceBadge = styled.span`
  display: inline-block;
  margin-top: 3px;
  padding: 1px 6px;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  background: var(--ds-color-state-info-subtle);
  color: var(--ds-color-state-info-text);
  border-radius: var(--ds-radius-sm);
  letter-spacing: var(--ds-letter-spacing-normal);
  line-height: 1.6;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
`;

const Dash = styled.span`
  color: var(--ds-color-text-disabled);
  user-select: none;
`; /* decorativo: aria-hidden en JSX — no transmite información adicional, la posición de columna ya define débito/crédito */

const AmountCell = styled.td<{ $bold?: boolean; $negative?: boolean }>`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-align: right;
  font-weight: ${({ $bold }) =>
    $bold ? 'var(--ds-font-weight-semibold)' : 'var(--ds-font-weight-regular)'};
  color: ${({ $bold, $negative }) =>
    $negative
      ? 'var(--ds-color-state-danger-text)'
      : $bold
        ? 'var(--ds-color-text-primary)'
        : 'inherit'};
  width: 110px;
`;

const EmptyState = styled.div`
  padding: var(--ds-space-8) var(--ds-space-4);
`;

const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const PaginationInfo = styled.span`
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;
