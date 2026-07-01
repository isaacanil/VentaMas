import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AccountsPayableRow } from '../utils/accountsPayableDashboard';
import type { AccountsPayablePaymentProposal } from '../utils/accountsPayablePaymentProposal';

import { AccountsPayablePaymentProposalModal } from './AccountsPayablePaymentProposalModal';

const buildRow = ({
  agingBucket = 'current',
  agingLabel = 'Al día',
  balanceAmount = 100,
  daysUntilDue = null,
  dueAt = new Date('2026-04-10T10:00:00.000Z').getTime(),
  reference,
  fiscalSnapshot = {
    netPayableAmount: null,
    withholdingITBISAmount: 0,
    withholdingISRAmount: 0,
  } as AccountsPayableRow['fiscalSnapshot'],
  accountingSnapshot = {
    accountingDate: new Date('2026-04-01T10:00:00.000Z').getTime(),
    accountingEventId: null,
    documentNature: 'expense',
    documentNatureLabel: 'Gasto',
    journalEntryId: null,
    posted: true,
    postedAt: new Date('2026-04-01T10:00:00.000Z').getTime(),
    sourceDocumentId: null,
    sourceDocumentType: 'purchase',
    statusLabel: 'Contabilizada',
    statusTone: 'success',
    settlementTiming: 'deferred',
    settlementTimingLabel: 'Diferida',
  } as AccountsPayableRow['accountingSnapshot'],
  paidAmount = 0,
  providerName = 'Proveedor Uno',
  totalAmount = balanceAmount,
}: {
  agingBucket?: AccountsPayableRow['agingBucket'];
  agingLabel?: string;
  balanceAmount?: number;
  daysUntilDue?: number | null;
  dueAt?: number | null;
  fiscalSnapshot?: AccountsPayableRow['fiscalSnapshot'];
  accountingSnapshot?: AccountsPayableRow['accountingSnapshot'];
  paidAmount?: number;
  providerName?: string;
  reference: string;
  totalAmount?: number;
}): AccountsPayableRow =>
  ({
    agingBucket,
    agingLabel,
    agingTone: agingBucket === 'current' ? 'success' : 'warning',
    balanceAmount,
    daysUntilDue,
    dueAt,
    fiscalSnapshot,
    accountingSnapshot,
    id: reference,
    paidAmount,
    providerId: null,
    providerName,
    reference,
    totalAmount,
  }) as AccountsPayableRow;

const buildProposal = (): AccountsPayablePaymentProposal => {
  const dueRow = buildRow({
    agingBucket: 'due_1_30',
    agingLabel: 'Vencido 1-30',
    balanceAmount: 500,
    fiscalSnapshot: {
      netPayableAmount: 470,
      withholdingITBISAmount: 20,
      withholdingISRAmount: 10,
    } as AccountsPayableRow['fiscalSnapshot'],
    providerName: 'Suplidor con fecha',
    reference: 'PO-DUE',
    totalAmount: 500,
  });
  const noDueDateRow = buildRow({
    agingBucket: 'no_due_date',
    agingLabel: 'Sin fecha',
    balanceAmount: 250,
    dueAt: null,
    providerName: 'Suplidor sin fecha',
    reference: 'PO-NO-DATE',
  });
  const dueSoonRow = buildRow({
    agingBucket: 'current',
    agingLabel: 'Vence en 3 días',
    balanceAmount: 120,
    daysUntilDue: 3,
    providerName: 'Suplidor próximo',
    reference: 'PO-SOON',
  });

  return {
    blockedAmount: 0,
    blockedCashRequirementAmount: 0,
    blockedCount: 0,
    blockedWithholdingAmount: 0,
    dueSoonAmount: 120,
    dueSoonCount: 1,
    dueSoonRows: [dueSoonRow],
    eligibleAmount: 870,
    eligibleCashRequirementAmount: 840,
    eligibleCount: 3,
    eligibleWithholdingAmount: 30,
    exclusionSummaries: [],
    noDueDateAmount: 250,
    noDueDateCount: 1,
    overdueAmount: 500,
    recommendedRows: [dueRow, dueSoonRow],
    reviewRows: [noDueDateRow],
    supplierSummaries: [
      {
        balanceAmount: 870,
        cashRequirementAmount: 840,
        count: 3,
        overdueAmount: 500,
        providerId: null,
        providerName: 'Suplidores agrupados',
        withholdingAmount: 30,
      },
    ],
    visibleAmount: 870,
    visibleCashRequirementAmount: 840,
    visibleCount: 3,
    visibleWithholdingAmount: 30,
  };
};

describe('AccountsPayablePaymentProposalModal', () => {
  it('shows proposal scope and keeps no-due-date rows in review', () => {
    render(
      <AccountsPayablePaymentProposalModal
        canRegisterPayments
        onClose={vi.fn()}
        onOpenDetail={vi.fn()}
        onRegisterPayment={vi.fn()}
        open
        proposal={buildProposal()}
        scopeDescription="3 seleccionadas de 5 cuentas visibles con los filtros actuales."
        scopeLabel="3 seleccionadas"
      />,
    );

    expect(screen.getByText('3 seleccionadas')).toBeInTheDocument();
    expect(
      screen.getByText(
        '3 seleccionadas de 5 cuentas visibles con los filtros actuales.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('1 cuenta liberada sin vencimiento.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Caja estimada')).toBeInTheDocument();
    expect(screen.getByText('Liberado bruto')).toBeInTheDocument();
    expect(screen.getByText('Retenciones')).toBeInTheDocument();
    expect(screen.getByText('PO-DUE')).toBeInTheDocument();
    expect(screen.getAllByText('Contabilizada').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gasto · Diferida').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ret. $30.00').length).toBeGreaterThan(0);
    expect(screen.getByText('PO-SOON')).toBeInTheDocument();
    expect(screen.queryByText('Liquidez próxima')).not.toBeInTheDocument();
    expect(screen.getByText('PO-NO-DATE')).toBeInTheDocument();
    expect(screen.getByText('Requiere vencimiento')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Registrar pago' }),
    ).toHaveLength(2);
  }, 10000);

  it('exposes the save-run action for recommended rows', () => {
    const onCreateRun = vi.fn();

    render(
      <AccountsPayablePaymentProposalModal
        canRegisterPayments
        onClose={vi.fn()}
        onCreateRun={onCreateRun}
        onOpenDetail={vi.fn()}
        onRegisterPayment={vi.fn()}
        open
        proposal={buildProposal()}
        scopeDescription="2 cuentas recomendadas."
        scopeLabel="Lote visible"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Guardar corrida' }));

    expect(onCreateRun).toHaveBeenCalledTimes(1);
    expect(screen.getByText('2 cuentas con vencimiento')).toBeInTheDocument();
  });

  it('blocks save-run action when the payment-run scope is limited', () => {
    const onCreateRun = vi.fn();

    render(
      <AccountsPayablePaymentProposalModal
        canRegisterPayments
        onClose={vi.fn()}
        onCreateRun={onCreateRun}
        onOpenDetail={vi.fn()}
        onRegisterPayment={vi.fn()}
        open
        paymentRunBlockedReason="Selecciona filas específicas antes de guardar una corrida CxP con alcance limitado."
        proposal={buildProposal()}
        scopeDescription="2 cuentas recomendadas."
        scopeLabel="Lote visible"
      />,
    );

    expect(
      screen.getByText('Alcance limitado para corrida'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Selecciona filas específicas antes de guardar una corrida CxP con alcance limitado.',
      ),
    ).toBeInTheDocument();

    const saveRunButton = screen.getByRole('button', {
      name: 'Guardar corrida',
    });

    expect(saveRunButton).toBeDisabled();
    fireEvent.click(saveRunButton);
    expect(onCreateRun).not.toHaveBeenCalled();
  });
});
