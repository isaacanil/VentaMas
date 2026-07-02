import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountsPayablePayment } from '@/types/payments';
import type { Purchase } from '@/utils/purchase/types';

import { SupplierPaymentHistoryModal } from './SupplierPaymentHistoryModal';

const mocks = vi.hoisted(() => ({
  useAccountsPayablePayments: vi.fn(),
  useOpenAccountingEntry: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: mocks.useSelector,
}));

vi.mock('@/modules/accounting/public', () => ({
  useOpenAccountingEntry: mocks.useOpenAccountingEntry,
}));

vi.mock('@/modules/accountsPayable/public', () => ({
  useAccountsPayablePayments: mocks.useAccountsPayablePayments,
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();

  return {
    ...actual,
    Tag: ({
      children,
      color,
    }: {
      children: ReactNode;
      color?: string;
    }) => <span data-color={color}>{children}</span>,
  };
});

vi.mock('@/components/common/Modal', () => ({
  ModalShell: ({
    children,
    footer,
    open,
    title,
  }: {
    children: ReactNode;
    footer: ReactNode;
    open: boolean;
    title: string;
  }) =>
    open ? (
      <section aria-label={title} role="dialog">
        {children}
        {footer}
      </section>
    ) : null,
}));

const purchase = {
  id: 'purchase-1',
  numberId: 'COMP-001',
  paymentState: {
    balance: 0,
    paid: 1180,
    status: 'paid',
    total: 1180,
  },
  provider: {
    name: 'Proveedor Fiscal',
  },
} as Purchase;

const payment = {
  businessId: 'business-1',
  counterpartyType: 'supplier',
  createdAt: '2026-06-30T10:00:00.000Z',
  evidenceNote: 'Ticket AP-101',
  id: 'payment-1',
  occurredAt: '2026-06-30T10:00:00.000Z',
  operationType: 'payable-payment',
  paymentMethods: [{ amount: 1106, method: 'transfer' }],
  receiptNumber: 'REC-001',
  settlementAmount: 1180,
  sourceId: 'purchase-1',
  sourceDocumentType: 'purchase',
  status: 'posted',
  totalAmount: 1106,
  withholdingAmount: 74,
  withholdingApplications: [
    { amount: 54, type: 'itbis' },
    { amount: 20, type: 'isr' },
  ],
} as AccountsPayablePayment;

const createPayment = (
  overrides: Record<string, unknown> = {},
): AccountsPayablePayment =>
  ({
    ...payment,
    ...overrides,
  }) as unknown as AccountsPayablePayment;

describe('SupplierPaymentHistoryModal', () => {
  beforeEach(() => {
    mocks.useOpenAccountingEntry.mockReturnValue(vi.fn());
    mocks.useSelector.mockReturnValue({
      activeBusinessId: 'business-1',
      businessID: 'business-1',
      id: 'user-1',
      role: 'admin',
    });
    mocks.useAccountsPayablePayments.mockReturnValue({
      error: null,
      loading: false,
      payments: [payment],
    });
  });

  it('shows fiscal settlement amounts separately from cash outflow', () => {
    render(
      <SupplierPaymentHistoryModal
        onCancel={vi.fn()}
        open
        purchase={purchase}
      />,
    );

    expect(
      screen.getByRole('dialog', { name: 'Historial de pagos' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Salida de caja')).toBeInTheDocument();
    expect(screen.getAllByText('$1,106.00')).toHaveLength(2);
    expect(screen.getByText('Retención fiscal')).toBeInTheDocument();
    expect(screen.getByText('Total liquidado')).toBeInTheDocument();
    expect(screen.getAllByText('$1,180.00')).toHaveLength(2);
    expect(
      screen.getByText('Evidencia de registro: Ticket AP-101'),
    ).toBeInTheDocument();
    expect(screen.getByText('Retención ITBIS')).toBeInTheDocument();
    expect(screen.getByText('$54.00')).toBeInTheDocument();
    expect(screen.getByText('Retención ISR')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();
  });

  it('shows query errors instead of an empty payment history', () => {
    mocks.useAccountsPayablePayments.mockReturnValue({
      error: new Error('permission denied'),
      loading: false,
      payments: [],
    });

    render(
      <SupplierPaymentHistoryModal
        onCancel={vi.fn()}
        open
        purchase={purchase}
      />,
    );

    expect(
      screen.getByText('No se pudo cargar el historial de pagos.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Esta compra todavía no tiene pagos registrados.'),
    ).not.toBeInTheDocument();
  });

  it('renders legacy inactive statuses as voided and blocks repeated voiding', () => {
    const openAccountingEntry = vi.fn();
    mocks.useOpenAccountingEntry.mockReturnValue(openAccountingEntry);
    mocks.useAccountsPayablePayments.mockReturnValue({
      error: null,
      loading: false,
      payments: [
        createPayment({
          id: 'void-payment',
          receiptNumber: 'REC-VOID',
          status: 'void',
          voidEvidenceNote: 'Soporte de anulación void',
          voidReason: 'Anulación void',
        }),
        createPayment({
          id: 'voided-payment',
          receiptNumber: 'REC-VOIDED',
          status: 'voided',
          voidEvidenceNote: 'Soporte de anulación voided',
          voidReason: 'Anulación voided',
        }),
        createPayment({
          id: 'canceled-payment',
          receiptNumber: 'REC-CANCELED',
          status: 'canceled',
          voidReason: 'Cancelación importada',
        }),
        createPayment({
          id: 'cancelled-payment',
          receiptNumber: 'REC-CANCELLED',
          status: 'cancelled',
          voidReason: 'Cancelación legacy',
        }),
      ],
    });

    render(
      <SupplierPaymentHistoryModal
        onCancel={vi.fn()}
        open
        purchase={purchase}
      />,
    );

    expect(screen.getAllByText('Anulado')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: 'Anular pago' })).toBeNull();
    expect(screen.getByText('Motivo: Anulación voided')).toBeInTheDocument();
    expect(
      screen.getByText('Evidencia de anulación: Soporte de anulación voided'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole('button', { name: /Ver asiento contable/ })[1],
    );

    expect(openAccountingEntry).toHaveBeenCalledWith({
      eventType: 'accounts_payable.payment.voided',
      sourceDocumentId: 'voided-payment',
      sourceDocumentType: 'accountsPayablePayment',
    });
  });
});
