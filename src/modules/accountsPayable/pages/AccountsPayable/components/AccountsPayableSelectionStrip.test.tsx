import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AccountsPayablePaymentProposal } from '../utils/accountsPayablePaymentProposal';

import { AccountsPayableSelectionStrip } from './AccountsPayableSelectionStrip';

const buildProposal = (
  overrides: Partial<AccountsPayablePaymentProposal> = {},
): AccountsPayablePaymentProposal => ({
  blockedAmount: 500,
  blockedCashRequirementAmount: 500,
  blockedCount: 1,
  blockedWithholdingAmount: 0,
  dueSoonAmount: 120,
  dueSoonCount: 1,
  dueSoonRows: [],
  eligibleAmount: 870,
  eligibleCashRequirementAmount: 840,
  eligibleCount: 3,
  eligibleWithholdingAmount: 30,
  exclusionSummaries: [],
  noDueDateAmount: 250,
  noDueDateCount: 1,
  overdueAmount: 500,
  recommendedRows: [],
  reviewRows: [],
  supplierSummaries: [],
  visibleAmount: 1370,
  visibleCashRequirementAmount: 1340,
  visibleCount: 4,
  visibleWithholdingAmount: 30,
  ...overrides,
});

describe('AccountsPayableSelectionStrip', () => {
  it('shows selected scope, financial metrics and contextual actions', () => {
    const onClearSelection = vi.fn();
    const onExportSelection = vi.fn();
    const onOpenPaymentProposal = vi.fn();

    render(
      <AccountsPayableSelectionStrip
        onClearSelection={onClearSelection}
        onExportSelection={onExportSelection}
        onOpenPaymentProposal={onOpenPaymentProposal}
        paymentProposal={buildProposal()}
        selectedRowsCount={3}
        visibleRowsCount={24}
      />,
    );

    expect(screen.getByText('3 seleccionadas')).toBeInTheDocument();
    expect(screen.getByText('de 24 visibles')).toBeInTheDocument();
    expect(screen.getByText('Caja estimada')).toBeInTheDocument();
    expect(screen.getByText('$840.00')).toBeInTheDocument();
    expect(screen.getByText('Balance aprobado')).toBeInTheDocument();
    expect(screen.getByText('$870.00')).toBeInTheDocument();
    expect(screen.getByText('Retenciones')).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument();
    expect(screen.getByText('Excluidas por control')).toBeInTheDocument();
    expect(screen.getByText('1 · $500.00')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Limpiar seleccion CxP' }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Abrir propuesta de pago para la seleccion CxP',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Exportar seleccion de cuentas por pagar',
      }),
    );

    expect(onClearSelection).toHaveBeenCalledTimes(1);
    expect(onOpenPaymentProposal).toHaveBeenCalledTimes(1);
    expect(onExportSelection).toHaveBeenCalledTimes(1);
  });

  it('keeps proposal action disabled when the current scope is blocked', () => {
    const onOpenPaymentProposal = vi.fn();

    render(
      <AccountsPayableSelectionStrip
        onClearSelection={vi.fn()}
        onExportSelection={vi.fn()}
        onOpenPaymentProposal={onOpenPaymentProposal}
        paymentProposal={buildProposal({ blockedCount: 0 })}
        paymentProposalBlockedReason="Selecciona filas especificas antes de generar una propuesta."
        selectedRowsCount={2}
        visibleRowsCount={12}
      />,
    );

    const proposalButton = screen.getByRole('button', {
      name: 'Abrir propuesta de pago para la seleccion CxP',
    });

    expect(proposalButton).toBeDisabled();
    fireEvent.click(proposalButton);
    expect(onOpenPaymentProposal).not.toHaveBeenCalled();
    expect(screen.queryByText('Excluidas por control')).not.toBeInTheDocument();
  });

  it('does not present financial amounts as confirmed while loading', () => {
    render(
      <AccountsPayableSelectionStrip
        isLoading
        onClearSelection={vi.fn()}
        onExportSelection={vi.fn()}
        onOpenPaymentProposal={vi.fn()}
        paymentProposal={buildProposal()}
        selectedRowsCount={3}
        visibleRowsCount={24}
      />,
    );

    expect(screen.getAllByText('Actualizando')).toHaveLength(3);
    expect(screen.getByText('1 · Actualizando')).toBeInTheDocument();
    expect(screen.queryByText('$840.00')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Abrir propuesta de pago para la seleccion CxP',
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', {
        name: 'Exportar seleccion de cuentas por pagar',
      }),
    ).toBeDisabled();
  });
});
