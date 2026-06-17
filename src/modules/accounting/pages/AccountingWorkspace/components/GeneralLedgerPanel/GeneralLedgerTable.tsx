import { Empty } from 'antd';
import styled from 'styled-components';

import { VmButton } from '@/components/heroui';

import {
  formatAccountingDate,
  formatAccountingMoney,
} from '../../utils/accountingWorkspace';
import {
  type VisibleLedgerMetrics,
} from './generalLedgerPanelUtils';
import {
  PanelCard,
  PanelCardHeader,
  PanelCardMeta,
  PanelCardTitle,
} from './GeneralLedgerPanelCard';

import type { GeneralLedgerMovement } from '../../utils/accountingWorkspace';

interface GeneralLedgerTableProps {
  effectiveDateFrom: string;
  entries: GeneralLedgerMovement[];
  metrics: VisibleLedgerMetrics;
  onSelectMovement: (entry: GeneralLedgerMovement) => void;
}

export const GeneralLedgerTable = ({
  effectiveDateFrom,
  entries,
  metrics,
  onSelectMovement,
}: GeneralLedgerTableProps) => (
  <PanelCard>
    <PanelCardHeader>
      <PanelCardTitle>
        Movimientos <PanelCardMeta>{entries.length} registros</PanelCardMeta>
      </PanelCardTitle>
      <VmButton size="sm" variant="tertiary">
        Ordenar
      </VmButton>
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
            <AmountCell>
              <Dash aria-hidden="true">—</Dash>
            </AmountCell>
            <AmountCell>
              <Dash aria-hidden="true">—</Dash>
            </AmountCell>
            <AmountCell $bold $negative={metrics.openingBalance < 0}>
              {formatAccountingMoney(metrics.openingBalance)}
            </AmountCell>
          </OpeningRow>

          {entries.map((entry) => (
            <LedgerRow key={entry.id} onClick={() => onSelectMovement(entry)}>
              <DateCell>{formatAccountingDate(entry.entryDate)}</DateCell>
              <ReferenceCell>
                <ReferenceLink>{entry.reference}</ReferenceLink>
              </ReferenceCell>
              <td>
                <strong>
                  {entry.lineDescription ?? entry.description ?? entry.title}
                </strong>
              </td>
              <AmountCell $tone="debit">
                {entry.debit ? (
                  formatAccountingMoney(entry.debit)
                ) : (
                  <Dash aria-hidden="true">—</Dash>
                )}
              </AmountCell>
              <AmountCell $tone="credit">
                {entry.credit ? (
                  formatAccountingMoney(entry.credit)
                ) : (
                  <Dash aria-hidden="true">—</Dash>
                )}
              </AmountCell>
              <AmountCell $bold $negative={entry.runningBalance < 0}>
                {formatAccountingMoney(entry.runningBalance)}
              </AmountCell>
            </LedgerRow>
          ))}
        </tbody>
        {entries.length ? (
          <tfoot>
            <tr>
              <td colSpan={3}>Totales · RD$</td>
              <AmountFootCell $tone="debit">
                {formatAccountingMoney(metrics.periodDebit)}
              </AmountFootCell>
              <AmountFootCell $tone="credit">
                {formatAccountingMoney(metrics.periodCredit)}
              </AmountFootCell>
              <AmountFootCell>
                {formatAccountingMoney(metrics.closingBalance)}
              </AmountFootCell>
            </tr>
          </tfoot>
        ) : null}
      </LedgerTable>

      {!entries.length ? (
        <EmptyState>
          <Empty
            description="No hay movimientos para la cuenta seleccionada con esos filtros."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </EmptyState>
      ) : null}
    </TableShell>
  </PanelCard>
);

const TableShell = styled.div`
  max-height: min(70vh, 760px);
  overflow: auto;
  background: var(--ds-color-bg-surface);
`;

const LedgerTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    position: sticky;
    z-index: 1;
    top: 0;
    padding: var(--ds-space-3) var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-default);
    background: var(--ds-color-bg-subtle);
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-semibold);
    letter-spacing: var(--ds-letter-spacing-wide);
    line-height: var(--ds-line-height-tight);
    text-align: left;
    text-transform: uppercase;
    white-space: nowrap;
  }

  th.amount-col {
    text-align: right;
  }

  tfoot td {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-top: 1px solid var(--ds-color-border-default);
    background: color-mix(in srgb, var(--ds-color-bg-page) 92%, white);
    font-variant-numeric: tabular-nums;
    font-weight: var(--ds-font-weight-semibold);
    white-space: nowrap;
  }
`;

const OpeningRow = styled.tr`
  td {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    background: color-mix(in srgb, var(--ds-color-bg-subtle) 76%, white);
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
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
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-base);
    line-height: var(--ds-line-height-normal);
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
  width: 120px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  white-space: nowrap;
`;

const ReferenceCell = styled.td`
  width: 160px;
  white-space: nowrap;
`;

const ReferenceLink = styled.span`
  color: var(--ds-color-interactive-default);
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-sm);
  font-variant-numeric: tabular-nums;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 2px;
`;

const Dash = styled.span`
  color: var(--ds-color-text-disabled);
  user-select: none;
`;

const AmountCell = styled.td<{
  $bold?: boolean;
  $negative?: boolean;
  $tone?: 'debit' | 'credit';
}>`
  width: 116px;
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
  font-variant-numeric: tabular-nums;
  font-weight: ${({ $bold }) =>
    $bold ? 'var(--ds-font-weight-semibold)' : 'var(--ds-font-weight-regular)'};
  text-align: right;
  white-space: nowrap;
`;

const AmountFootCell = styled.td<{ $tone?: 'debit' | 'credit' }>`
  color: ${({ $tone }) =>
    $tone === 'debit'
      ? 'var(--ds-color-state-danger-text)'
      : $tone === 'credit'
        ? 'var(--ds-color-state-success-text)'
        : 'var(--ds-color-text-primary)'};
  text-align: right;
`;

const EmptyState = styled.div`
  padding: var(--ds-space-8) var(--ds-space-4);
`;
