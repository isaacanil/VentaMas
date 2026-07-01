import { render, screen } from '@testing-library/react';
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
});
