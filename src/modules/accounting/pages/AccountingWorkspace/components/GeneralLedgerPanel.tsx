import { Alert, Button, Empty, Input, Pagination, Select, message } from 'antd';
import { useDeferredValue, useMemo, useState } from 'react';
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

const formatDateInputValue = (value: Date | null): string => {
  if (!value || Number.isNaN(value.getTime())) return '';

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatCompactMoney = (value: number): string =>
  `RD$ ${formatAccountingMoney(value)}`;

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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
  const effectiveDateFrom = dateFrom || defaultDateFrom;
  const effectiveDateTo = dateTo || defaultDateTo;

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

  const visibleOpeningBalance =
    filteredEntries.length > 0
      ? filteredEntries[0].runningBalance -
        filteredEntries[0].debit +
        filteredEntries[0].credit
      : snapshot?.openingBalance ?? 0;
  const visiblePeriodDebit = filteredEntries.reduce(
    (total, entry) => total + entry.debit,
    0,
  );
  const visiblePeriodCredit = filteredEntries.reduce(
    (total, entry) => total + entry.credit,
    0,
  );
  const visibleClosingBalance =
    filteredEntries.at(-1)?.runningBalance ?? visibleOpeningBalance;
  const tAccountDebitRows = filteredEntries.filter((entry) => entry.debit > 0);
  const tAccountCreditRows = filteredEntries.filter((entry) => entry.credit > 0);

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

  const handleAuxiliary = () => {
    void message.info('Vista auxiliar del mayor aun no disponible.');
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
      <PageHeader>
        <HeaderCopy>
          <SectionTitle>Libro Mayor</SectionTitle>
          <SectionText>
            Movimientos por cuenta contable
            {activePeriodValue ? ` — ${formatAccountingPeriod(activePeriodValue)}` : ''}
          </SectionText>
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
          <Button onClick={handleAuxiliary}>Auxiliar</Button>
        </HeaderActions>
      </PageHeader>

      <ToolbarShell>
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
                    ? `${option.code} — ${option.name}`
                    : `${option.code} — ${option.name} (sin movimientos)`,
                value: option.id,
              }))}
              onChange={(value) => {
                setAccountId(value);
                resetPage();
              }}
            />
          </ToolbarField>

          <ToolbarField $compact>
            <ToolbarLabel>Desde</ToolbarLabel>
            <Input
              type="date"
              value={effectiveDateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                resetPage();
              }}
            />
          </ToolbarField>

          <ToolbarField $compact>
            <ToolbarLabel>Hasta</ToolbarLabel>
            <Input
              type="date"
              value={effectiveDateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                resetPage();
              }}
            />
          </ToolbarField>

          <ToolbarField $search>
            <ToolbarLabel>Buscar</ToolbarLabel>
            <Input
              allowClear
              placeholder="Filtrar movimientos..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetPage();
              }}
            />
          </ToolbarField>
        </Toolbar>
      </ToolbarShell>

      <ContentGrid>
        <MainColumn>
          <PanelCard>
            <PanelCardHeader>
              <PanelCardTitle>
                Movimientos <PanelCardMeta>{filteredEntries.length} registros</PanelCardMeta>
              </PanelCardTitle>
              <Button size="small">Ordenar</Button>
            </PanelCardHeader>

            <TableShell>
              <LedgerTable>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ref.</th>
                    <th>Descripción</th>
                    <th className="amount-col">Débito</th>
                    <th className="amount-col">Crédito</th>
                    <th className="amount-col">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  <OpeningRow>
                    <DateCell>
                      {effectiveDateFrom
                        ? formatAccountingDate(new Date(`${effectiveDateFrom}T00:00:00`))
                        : '—'}
                    </DateCell>
                    <ReferenceCell>
                      <Dash aria-hidden="true">—</Dash>
                    </ReferenceCell>
                    <td>
                      <strong>Saldo inicial</strong>
                    </td>
                    <AmountCell><Dash aria-hidden="true">—</Dash></AmountCell>
                    <AmountCell><Dash aria-hidden="true">—</Dash></AmountCell>
                    <AmountCell $bold $negative={visibleOpeningBalance < 0}>
                      {formatAccountingMoney(visibleOpeningBalance)}
                    </AmountCell>
                  </OpeningRow>

                  {filteredEntries.map((entry) => (
                    <LedgerRow
                      key={entry.id}
                      onClick={() => setSelectedMovement(entry)}
                    >
                      <DateCell>{formatAccountingDate(entry.entryDate)}</DateCell>
                      <ReferenceCell>
                        <ReferenceLink>{entry.reference}</ReferenceLink>
                      </ReferenceCell>
                      <td>
                        <strong>{entry.lineDescription ?? entry.description ?? entry.title}</strong>
                      </td>
                      <AmountCell $tone="debit">
                        {entry.debit ? formatAccountingMoney(entry.debit) : <Dash aria-hidden="true">—</Dash>}
                      </AmountCell>
                      <AmountCell $tone="credit">
                        {entry.credit ? formatAccountingMoney(entry.credit) : <Dash aria-hidden="true">—</Dash>}
                      </AmountCell>
                      <AmountCell $bold $negative={entry.runningBalance < 0}>
                        {formatAccountingMoney(entry.runningBalance)}
                      </AmountCell>
                    </LedgerRow>
                  ))}
                </tbody>
                {filteredEntries.length ? (
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Totales · RD$</td>
                      <AmountFootCell $tone="debit">
                        {formatAccountingMoney(visiblePeriodDebit)}
                      </AmountFootCell>
                      <AmountFootCell $tone="credit">
                        {formatAccountingMoney(visiblePeriodCredit)}
                      </AmountFootCell>
                      <AmountFootCell>
                        {formatAccountingMoney(visibleClosingBalance)}
                      </AmountFootCell>
                    </tr>
                  </tfoot>
                ) : null}
              </LedgerTable>

              {!filteredEntries.length ? (
                <EmptyState>
                  <Empty
                    description="No hay movimientos para la cuenta seleccionada con esos filtros."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </EmptyState>
              ) : null}
            </TableShell>
          </PanelCard>
        </MainColumn>

        <SideColumn>
          <PanelCard>
            <PanelCardHeader>
              <PanelCardTitle>
                {selectedAccount
                  ? `${selectedAccount.code} — ${selectedAccount.name}`
                  : 'Cuenta'}
              </PanelCardTitle>
            </PanelCardHeader>
            <PanelBody>
              <StatLine>
                <span>Tipo de cuenta</span>
                <strong>Activo</strong>
              </StatLine>
              <StatLine>
                <span>Saldo inicial</span>
                <strong>{formatCompactMoney(visibleOpeningBalance)}</strong>
              </StatLine>
              <StatLine>
                <span>Débitos del período</span>
                <strong className="debit">{formatCompactMoney(visiblePeriodDebit)}</strong>
              </StatLine>
              <StatLine>
                <span>Créditos del período</span>
                <strong className="credit">{formatCompactMoney(visiblePeriodCredit)}</strong>
              </StatLine>
              <StatLine $total>
                <span>Saldo final</span>
                <strong>{formatCompactMoney(visibleClosingBalance)}</strong>
              </StatLine>
            </PanelBody>
          </PanelCard>

          <PanelCard>
            <PanelCardHeader>
              <PanelCardTitle>
                Vista T <PanelCardMeta>Esquema del período</PanelCardMeta>
              </PanelCardTitle>
            </PanelCardHeader>
            <TAccount>
              <TAccountSide>
                <TAccountHeading>Debe</TAccountHeading>
                {tAccountDebitRows.map((entry) => (
                  <TAccountRow key={`debit:${entry.id}`}>
                    <span>{formatDateInputValue(entry.entryDate).slice(5)}</span>
                    <strong>{formatAccountingMoney(entry.debit)}</strong>
                  </TAccountRow>
                ))}
                <TAccountTotal>
                  <span>Σ Debe</span>
                  <strong>{formatAccountingMoney(visiblePeriodDebit)}</strong>
                </TAccountTotal>
              </TAccountSide>

              <TAccountSide $credit>
                <TAccountHeading>Haber</TAccountHeading>
                {tAccountCreditRows.map((entry) => (
                  <TAccountRow key={`credit:${entry.id}`}>
                    <span>{formatDateInputValue(entry.entryDate).slice(5)}</span>
                    <strong>{formatAccountingMoney(entry.credit)}</strong>
                  </TAccountRow>
                ))}
                <TAccountTotal>
                  <span>Σ Haber</span>
                  <strong>{formatAccountingMoney(visiblePeriodCredit)}</strong>
                </TAccountTotal>
              </TAccountSide>
            </TAccount>
          </PanelCard>
        </SideColumn>
      </ContentGrid>

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

const PageHeader = styled.section`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--ds-space-4);
  flex-wrap: wrap;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const ToolbarShell = styled.section`
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(300px, 1.4fr) minmax(160px, 0.55fr) minmax(160px, 0.55fr) minmax(240px, 0.9fr);
  gap: 12px;
  align-items: flex-end;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ToolbarField = styled.label<{ $compact?: boolean; $search?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  min-width: 0;
  ${({ $compact }) => ($compact ? 'max-width: 180px;' : '')}
  ${({ $search }) => ($search ? 'width: 100%;' : '')}
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
  font-size: clamp(1.5rem, 1.7vw, 1.8rem);
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

const PanelCard = styled.section`
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
  overflow: hidden;
`;

const PanelCardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-default);
`;

const PanelCardTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
`;

const PanelCardMeta = styled.span`
  margin-left: var(--ds-space-2);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-regular);
`;

const PanelBody = styled.div`
  padding: var(--ds-space-4);
`;

const StatLine = styled.div<{ $total?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) 0;
  border-bottom: ${({ $total }) =>
    $total ? 'none' : '1px dotted var(--ds-color-border-subtle)'};

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }

  strong {
    color: var(--ds-color-text-primary);
    font-size: ${({ $total }) =>
      $total ? 'var(--ds-font-size-base)' : 'var(--ds-font-size-sm)'};
    font-weight: ${({ $total }) =>
      $total ? 'var(--ds-font-weight-semibold)' : 'var(--ds-font-weight-medium)'};
    font-variant-numeric: tabular-nums;
  }

  strong.debit {
    color: var(--ds-color-state-danger-text);
  }

  strong.credit {
    color: var(--ds-color-state-success-text);
  }
`;

const TableShell = styled.div`
  overflow: auto;
  max-height: min(70vh, 760px);
  background: var(--ds-color-bg-surface);
`;

const LedgerTable = styled.table`
  width: 100%;
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
    font-weight: var(--ds-font-weight-semibold);
    background: var(--ds-color-bg-subtle);
    white-space: nowrap;
  }

  th.amount-col {
    text-align: right;
  }

  tfoot td {
    padding: var(--ds-space-3) var(--ds-space-4);
    background: color-mix(in srgb, var(--ds-color-bg-page) 92%, white);
    border-top: 1px solid var(--ds-color-border-default);
    font-weight: var(--ds-font-weight-semibold);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
`;

const OpeningRow = styled.tr`
  td {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    background: color-mix(in srgb, var(--ds-color-bg-subtle) 76%, white);
    font-size: var(--ds-font-size-sm);
    color: var(--ds-color-text-secondary);
  }

  strong {
    color: var(--ds-color-text-primary);
    font-weight: var(--ds-font-weight-semibold);
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

  &:hover td {
    background: var(--ds-color-interactive-hover-bg) !important;
  }
`;

const DateCell = styled.td`
  white-space: nowrap;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  width: 120px;
`;

const ReferenceCell = styled.td`
  white-space: nowrap;
  width: 160px;
`;

const ReferenceLink = styled.span`
  color: var(--ds-color-interactive-default);
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 2px;
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-sm);
  font-variant-numeric: tabular-nums;
`;

const Dash = styled.span`
  color: var(--ds-color-text-disabled);
  user-select: none;
`;

const AmountCell = styled.td<{ $bold?: boolean; $negative?: boolean; $tone?: 'debit' | 'credit' }>`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-align: right;
  font-weight: ${({ $bold }) =>
    $bold ? 'var(--ds-font-weight-semibold)' : 'var(--ds-font-weight-regular)'};
  color: ${({ $tone, $bold, $negative }) =>
    $tone === 'debit'
      ? 'var(--ds-color-state-danger-text)'
      : $tone === 'credit'
        ? 'var(--ds-color-state-success-text)'
        : $negative
          ? 'var(--ds-color-state-danger-text)'
          : $bold
            ? 'var(--ds-color-text-primary)'
            : 'inherit'};
  width: 116px;
`;

const AmountFootCell = styled.td<{ $tone?: 'debit' | 'credit' }>`
  text-align: right;
  color: ${({ $tone }) =>
    $tone === 'debit'
      ? 'var(--ds-color-state-danger-text)'
      : $tone === 'credit'
        ? 'var(--ds-color-state-success-text)'
        : 'var(--ds-color-text-primary)'};
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

const TAccount = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const TAccountSide = styled.div<{ $credit?: boolean }>`
  padding: var(--ds-space-4);
  border-left: ${({ $credit }) =>
    $credit ? '1px solid var(--ds-color-border-default)' : 'none'};
`;

const TAccountHeading = styled.h4`
  margin: 0 0 var(--ds-space-3);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
`;

const TAccountRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-2);
  padding: 4px 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);

  strong {
    color: var(--ds-color-text-primary);
    font-variant-numeric: tabular-nums;
    font-weight: var(--ds-font-weight-medium);
  }
`;

const TAccountTotal = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
  padding-top: var(--ds-space-3);
  border-top: 1px solid var(--ds-color-border-default);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);

  strong {
    font-variant-numeric: tabular-nums;
  }
`;
