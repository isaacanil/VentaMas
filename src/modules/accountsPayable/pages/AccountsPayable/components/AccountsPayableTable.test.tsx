import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AccountsPayableTable } from './AccountsPayableTable';
import type { AccountsPayableRow } from '../utils/accountsPayableDashboard';

vi.mock('@/components/ui/AdvancedTable', () => ({
  AdvancedTable: ({
    columns = [],
    data = [],
    emptyText,
    footerLeftSide,
  }: {
    columns?: Array<{
      Header?: ReactNode;
      accessor: string;
      cell?: (args: { row: Record<string, unknown>; value: unknown }) => ReactNode;
    }>;
    data?: Array<Record<string, unknown>>;
    emptyText?: ReactNode;
    footerLeftSide?: ReactNode;
  }) => (
    <div data-testid="advanced-table">
      <div>{emptyText}</div>
      <div>
        {columns.map((column) => (
          <div key={column.accessor}>{column.Header}</div>
        ))}
      </div>
      <div>
        {data.map((row) => (
          <div key={String(row.id)}>
            {columns.map((column) => (
              <div key={column.accessor}>
                {column.cell
                  ? column.cell({ row, value: row[column.accessor] })
                  : String(row[column.accessor] ?? '')}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div>{footerLeftSide}</div>
    </div>
  ),
}));

const accountingSnapshot = {
  accountingDate: new Date('2026-04-01T10:00:00.000Z').getTime(),
  accountingEventId: null,
  documentNature: 'inventory',
  documentNatureLabel: 'Inventario',
  journalEntryId: null,
  posted: true,
  postedAt: new Date('2026-04-01T10:00:00.000Z').getTime(),
  settlementTiming: 'deferred',
  settlementTimingLabel: 'Diferida',
  sourceDocumentId: 'purchase-1',
  sourceDocumentType: 'purchase',
  statusLabel: 'Contabilizada',
  statusTone: 'success',
} satisfies AccountsPayableRow['accountingSnapshot'];

const buildRow = (): AccountsPayableRow =>
  ({
    accountingSnapshot,
    agingLabel: 'Al día',
    agingTone: 'success',
    balanceAmount: 1000,
    conditionLabel: '30 días',
    dueAt: new Date('2026-04-15T10:00:00.000Z').getTime(),
    fiscalSnapshot: {
      documentType: 'valid_fiscal_credit',
      fiscalLabel: 'B0100001234',
      vendorReferenceLabel: 'FAC-123',
    },
    id: 'row-1',
    paidAmount: 0,
    paymentControl: {
      canRegisterPayment: true,
      label: 'Aprobada',
      reason: null,
      status: 'payable',
      tone: 'success',
    },
    providerName: 'Proveedor Uno',
    purchase: { id: 'purchase-1' },
    reference: 'PO-1',
    traceabilitySummary: '0 pagos · 0 evidencias',
  }) as AccountsPayableRow;

const renderTable = ({
  emptyReason,
  hasError = false,
  loading = false,
  onClearFilters,
  rows = [],
}: {
  emptyReason?: 'filtered' | 'no_open';
  hasError?: boolean;
  loading?: boolean;
  onClearFilters?: () => void;
  rows?: AccountsPayableRow[];
}) =>
  render(
    <AccountsPayableTable
      canManageControlAction={() => true}
      canRegisterPayments
      emptyReason={emptyReason}
      groupBy="provider"
      hasError={hasError}
      loading={loading}
      onClearFilters={onClearFilters}
      onManageControl={vi.fn()}
      onOpenDetail={vi.fn()}
      onOpenPayments={vi.fn()}
      onOpenPurchase={vi.fn()}
      onRegisterPayment={vi.fn()}
      onToggleAllRowsSelection={vi.fn()}
      onToggleRowSelection={vi.fn()}
      rows={rows}
      selectedRowIds={new Set()}
    />,
  );

describe('AccountsPayableTable', () => {
  it('passes a loading empty state and footer to the table shell', () => {
    renderTable({ loading: true });

    expect(screen.getByText('Cargando CxP...')).toBeInTheDocument();
    expect(screen.getByText('Cargando registros')).toBeInTheDocument();
  });

  it('passes an error empty state and footer to the table shell', () => {
    renderTable({ hasError: true });

    expect(screen.getByText('No se pudo confirmar CxP.')).toBeInTheDocument();
    expect(screen.getByText('Registros sin confirmar')).toBeInTheDocument();
  });

  it('shows an operational empty state when there are no open AP obligations', () => {
    renderTable({ emptyReason: 'no_open' });

    expect(
      screen.getByText('No hay obligaciones abiertas en CxP.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Las cuentas aparecerán cuando una compra completada tenga balance pendiente y pase los controles de pago.',
      ),
    ).toBeInTheDocument();
  });

  it('shows a filter empty state when the current scope has no matches', () => {
    const handleClearFilters = vi.fn();
    renderTable({
      emptyReason: 'filtered',
      onClearFilters: handleClearFilters,
    });

    expect(
      screen.getByText('No hay CxP que coincidan con los filtros actuales.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(handleClearFilters).toHaveBeenCalledTimes(1);
  });

  it('renders accounting status as a visible table column', () => {
    renderTable({ rows: [buildRow()] });

    expect(screen.getByText('Contable')).toBeInTheDocument();
    expect(screen.getByText('Contabilizada')).toBeInTheDocument();
    expect(screen.getByText('Fecha contable 01/04/2026')).toBeInTheDocument();
    expect(screen.getByText('Inventario · Diferida')).toBeInTheDocument();
  });
});
