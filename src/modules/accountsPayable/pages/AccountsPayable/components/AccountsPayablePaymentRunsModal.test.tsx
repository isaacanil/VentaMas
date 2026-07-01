import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type {
  AccountsPayablePaymentRun,
  AccountsPayablePaymentRunEvent,
} from '@/modules/accountsPayable/repositories/paymentRuns.repository';

import { AccountsPayablePaymentRunsModal } from './AccountsPayablePaymentRunsModal';

const buildRun = (
  overrides: Partial<AccountsPayablePaymentRun> = {},
): AccountsPayablePaymentRun => ({
  approvalStatus: 'pending_approval',
  createdAt: new Date('2026-04-12T12:00:00.000Z').getTime(),
  executionStatus: 'not_started',
  excludedLines: [
    {
      exclusionReason:
        'La cuenta por pagar no tiene vencimiento confirmado para la corrida.',
      reference: 'PO-NO-DATE',
      vendorBillId: 'purchase:purchase-2',
    },
  ],
  id: 'payment-run-1',
  lines: [
    {
      cashRequirementAmount: 1106,
      reference: 'PO-001',
      supplierName: 'Proveedor Uno',
      vendorBillId: 'purchase:purchase-1',
      withholdingAmount: 74,
    },
  ],
  source: {
    description: '2 cuentas visibles con los filtros actuales.',
    label: 'Lote visible',
  },
  status: 'submitted',
  totals: {
    eligibleAmount: 1180,
    eligibleCashRequirementAmount: 1106,
    eligibleCount: 1,
    eligibleWithholdingAmount: 74,
    excludedCount: 1,
    requestedCount: 2,
  },
  ...overrides,
});

const buildEvent = (
  overrides: Partial<AccountsPayablePaymentRunEvent> = {},
): AccountsPayablePaymentRunEvent => ({
  action: 'approve',
  createdAt: new Date('2026-04-12T14:30:00.000Z').getTime(),
  createdBy: 'reviewer-1',
  evidenceNote: 'Acta FIN-42',
  id: 'event-1',
  nextStatus: {
    approvalStatus: 'approved',
    executionStatus: 'not_started',
    status: 'approved',
  },
  paymentRunId: 'payment-run-1',
  previousStatus: {
    approvalStatus: 'pending_approval',
    executionStatus: 'not_started',
    status: 'submitted',
  },
  reason: 'Validada contra caja y soportes.',
  ...overrides,
});

describe('AccountsPayablePaymentRunsModal', () => {
  it('renders payment run status, totals and exclusions', () => {
    render(
      <AccountsPayablePaymentRunsModal
        onClose={vi.fn()}
        open
        runs={[buildRun()]}
      />,
    );

    expect(screen.getByText('Historial de corridas CxP')).toBeInTheDocument();
    expect(screen.getByText('payment-run-1')).toBeInTheDocument();
    expect(screen.getByText('En aprobación')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getAllByText('Sin ejecutar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$1,106.00')).toHaveLength(2);
    expect(screen.getAllByText('$74.00').length).toBeGreaterThan(0);
    expect(screen.getByText('PO-001')).toBeInTheDocument();
    expect(
      screen.getByText(/1 excluida · La cuenta por pagar no tiene vencimiento/),
    ).toBeInTheDocument();
  });

  it('renders audit events for a payment run', () => {
    render(
      <AccountsPayablePaymentRunsModal
        eventsByPaymentRunId={{ 'payment-run-1': [buildEvent()] }}
        onClose={vi.fn()}
        open
        runs={[buildRun()]}
      />,
    );

    expect(screen.getByText('Bitácora')).toBeInTheDocument();
    expect(screen.getByText('Aprobar')).toBeInTheDocument();
    expect(screen.getByText('Validada contra caja y soportes.')).toBeInTheDocument();
    expect(screen.getByText('Evidencia: Acta FIN-42')).toBeInTheDocument();
    expect(
      screen.getByText('Estado: En aprobación a Aprobada - Usuario reviewer-1'),
    ).toBeInTheDocument();
  });

  it('renders payment execution audit events with human labels', () => {
    render(
      <AccountsPayablePaymentRunsModal
        eventsByPaymentRunId={{
          'payment-run-1': [
            buildEvent({
              action: 'record_payment',
              createdBy: 'cashier-1',
              evidenceNote: null,
              nextStatus: {
                approvalStatus: 'approved',
                executionStatus: 'in_progress',
                status: 'approved',
              },
              previousStatus: {
                approvalStatus: 'approved',
                executionStatus: 'not_started',
                status: 'approved',
              },
              reason:
                'Pago registrado contra la cuenta por pagar purchase:purchase-1.',
            }),
          ],
        }}
        onClose={vi.fn()}
        open
        runs={[buildRun()]}
      />,
    );

    expect(screen.getByText('Pago registrado')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Pago registrado contra la cuenta por pagar purchase:purchase-1.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Estado: Aprobada a Aprobada - Usuario cashier-1'),
    ).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <AccountsPayablePaymentRunsModal onClose={vi.fn()} open runs={[]} />,
    );

    expect(screen.getByText('Sin corridas guardadas')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Aquí aparecerán las propuestas aprobables con líneas, bitácora y avance de ejecución.',
      ),
    ).toBeInTheDocument();
  });

  it('warns when payment run history or audit events are capped', () => {
    render(
      <AccountsPayablePaymentRunsModal
        eventsByPaymentRunId={{ 'payment-run-1': [buildEvent()] }}
        eventsHasMore
        eventsRawDocCount={101}
        hasMore
        onClose={vi.fn()}
        open
        rawDocCount={26}
        runs={[buildRun()]}
      />,
    );

    expect(screen.getByText('Historial de corridas acotado')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Se muestran las 1 corridas más recientes de 26 leídas. Hay más historial fuera del lote actual.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Bitácora de corridas acotada')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Se muestran los 1 eventos más recientes de 101 leídos. Puede existir auditoría anterior fuera del lote actual.',
      ),
    ).toBeInTheDocument();
  });

  it('opens payment registration for approved run lines', () => {
    const onRegisterPayment = vi.fn();

    render(
      <AccountsPayablePaymentRunsModal
        onClose={vi.fn()}
        onRegisterPayment={onRegisterPayment}
        open
        runs={[
          buildRun({
            approvalStatus: 'approved',
            executionStatus: 'not_started',
            status: 'approved',
          }),
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Registrar pago de PO-001 en corrida payment-run-1',
      }),
    );

    expect(onRegisterPayment).toHaveBeenCalledWith({
      paymentRunId: 'payment-run-1',
      vendorBillId: 'purchase:purchase-1',
    });
  });

  it('keeps payment run line payment actions disabled without treasury access', () => {
    const onRegisterPayment = vi.fn();

    render(
      <AccountsPayablePaymentRunsModal
        canRegisterPayments={false}
        onClose={vi.fn()}
        onRegisterPayment={onRegisterPayment}
        open
        runs={[
          buildRun({
            approvalStatus: 'approved',
            executionStatus: 'not_started',
            status: 'approved',
          }),
        ]}
      />,
    );

    const registerButton = screen.getByRole('button', {
      name: 'Registrar pago de PO-001 en corrida payment-run-1',
    });

    expect(registerButton).toBeDisabled();
    expect(registerButton).toHaveTextContent('Sin permiso');
    fireEvent.click(registerButton);
    expect(onRegisterPayment).not.toHaveBeenCalled();
  });

  it('expands long payment runs and shows line execution metrics', () => {
    render(
      <AccountsPayablePaymentRunsModal
        onClose={vi.fn()}
        open
        runs={[
          buildRun({
            approvalStatus: 'approved',
            executionStatus: 'in_progress',
            lines: [
              {
                cashRequirementAmount: 100,
                executionStatus: 'executed',
                paidSettlementAmount: 112,
                reference: 'PO-001',
                supplierName: 'Proveedor Uno',
                vendorBillId: 'purchase:purchase-1',
                withholdingAmount: 12,
              },
              {
                cashRequirementAmount: 200,
                executionStatus: 'partial',
                paidSettlementAmount: 50,
                reference: 'PO-002',
                supplierName: 'Proveedor Dos',
                vendorBillId: 'purchase:purchase-2',
                withholdingAmount: 0,
              },
              {
                cashRequirementAmount: 300,
                reference: 'PO-003',
                supplierName: 'Proveedor Tres',
                vendorBillId: 'purchase:purchase-3',
                withholdingAmount: 0,
              },
              {
                cashRequirementAmount: 400,
                reference: 'PO-004',
                supplierName: 'Proveedor Cuatro',
                vendorBillId: 'purchase:purchase-4',
                withholdingAmount: 0,
              },
            ],
            status: 'approved',
          }),
        ]}
      />,
    );

    expect(screen.getByText('4 facturas aprobadas para pago')).toBeInTheDocument();
    expect(screen.getByText('PO-001')).toBeInTheDocument();
    expect(screen.getByText('PO-003')).toBeInTheDocument();
    expect(screen.queryByText('PO-004')).not.toBeInTheDocument();
    expect(screen.getByText('Ejecutada')).toBeInTheDocument();
    expect(screen.getByText('Parcial')).toBeInTheDocument();
    expect(screen.getAllByText('$50.00').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Ver todas (4)' }));

    expect(screen.getByText('PO-004')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Mostrar menos' }),
    ).toBeInTheDocument();
  });

  it('renders persisted execution summary for partially executed runs', () => {
    render(
      <AccountsPayablePaymentRunsModal
        onClose={vi.fn()}
        open
        runs={[
          buildRun({
            approvalStatus: 'approved',
            executionStatus: 'in_progress',
            executionSummary: {
              executedLineCount: 1,
              lastPaymentAt: new Date('2026-04-12T15:30:00.000Z').getTime(),
              lastPaymentId: 'supplier-payment-1',
              paidCashAmount: 150,
              paidSettlementAmount: 162,
              paidWithholdingAmount: 12,
              partialLineCount: 1,
              pendingLineCount: 2,
              totalLineCount: 4,
            },
            status: 'approved',
          }),
        ]}
      />,
    );

    const summary = screen.getByRole('region', {
      name: 'Resumen de ejecución de corrida payment-run-1',
    });

    expect(within(summary).getByText('Ejecución')).toBeInTheDocument();
    expect(within(summary).getByText('Ejecutadas')).toBeInTheDocument();
    expect(within(summary).getByText('1 / 4')).toBeInTheDocument();
    expect(within(summary).getByText('Parciales')).toBeInTheDocument();
    expect(within(summary).getByText('Pendientes')).toBeInTheDocument();
    expect(within(summary).getByText('$162.00')).toBeInTheDocument();
    expect(within(summary).getByText('$150.00')).toBeInTheDocument();
    expect(within(summary).getByText('$12.00')).toBeInTheDocument();
    expect(within(summary).getByText(/Último pago/)).toBeInTheDocument();
  });

  it('submits a draft run with a required reason', async () => {
    const onManageRun = vi.fn().mockResolvedValue(undefined);

    render(
      <AccountsPayablePaymentRunsModal
        onClose={vi.fn()}
        onManageRun={onManageRun}
        open
        runs={[
          buildRun({
            approvalStatus: 'pending_review',
            status: 'draft',
          }),
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: ' Revisada contra caja disponible ' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Enviar a aprobación' }),
    );

    await waitFor(() =>
      expect(onManageRun).toHaveBeenCalledWith({
        action: 'submit',
        evidenceNote: null,
        paymentRunId: 'payment-run-1',
        reason: 'Revisada contra caja disponible',
      }),
    );
  }, 10000);

  it('disables payment run review actions without accounting admin access', () => {
    const onManageRun = vi.fn();

    render(
      <AccountsPayablePaymentRunsModal
        canManageRunAction={(action) => action === 'submit'}
        getManageRunActionDeniedMessage={() =>
          'Esta acción requiere rol contable administrador.'
        }
        onClose={vi.fn()}
        onManageRun={onManageRun}
        open
        runs={[buildRun()]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(
      screen.getByText('Esta acción requiere rol contable administrador.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    expect(onManageRun).not.toHaveBeenCalled();
  });

  it('requires evidence before approving a submitted run', async () => {
    const onManageRun = vi.fn().mockResolvedValue(undefined);

    render(
      <AccountsPayablePaymentRunsModal
        onClose={vi.fn()}
        onManageRun={onManageRun}
        open
        runs={[buildRun()]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: ' Aprobada para pago semanal ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar corrida' }));

    expect(onManageRun).not.toHaveBeenCalled();
    expect(
      screen.getByText('Indica una evidencia o referencia para esta acción.'),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText('Evidencia o referencia requerida'),
      {
        target: { value: 'Acta FIN-2026-04-12' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar corrida' }));

    await waitFor(() =>
      expect(onManageRun).toHaveBeenCalledWith({
        action: 'approve',
        evidenceNote: 'Acta FIN-2026-04-12',
        paymentRunId: 'payment-run-1',
        reason: 'Aprobada para pago semanal',
      }),
    );
  }, 10000);
});
