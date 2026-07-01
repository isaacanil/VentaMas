import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Purchase } from '@/utils/purchase/types';

import { RegisterSupplierPaymentModal } from './RegisterSupplierPaymentModal';

const mocks = vi.hoisted(() => ({
  fbAddAccountsPayablePayment: vi.fn(),
  useAccountingBankingSettings: vi.fn(),
  useAccountingRolloutEnabled: vi.fn(),
  useActiveBankAccounts: vi.fn(),
  useIsOpenCashReconciliation: vi.fn(),
  useSelector: vi.fn(),
  useSupplierCreditNotes: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: mocks.useSelector,
}));

vi.mock('@/components/DatePicker', () => ({
  default: () => <input aria-label="Fecha seleccionada" readOnly />,
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

vi.mock('@/firebase/cashCount/useIsOpenCashReconciliation', () => ({
  useIsOpenCashReconciliation: mocks.useIsOpenCashReconciliation,
}));

vi.mock('@/firebase/purchase/fbAddAccountsPayablePayment', () => ({
  fbAddAccountsPayablePayment: mocks.fbAddAccountsPayablePayment,
}));

vi.mock('@/hooks/useAccountingRolloutEnabled', () => ({
  useAccountingRolloutEnabled: mocks.useAccountingRolloutEnabled,
}));

vi.mock('@/hooks/useAccountingBankPaymentPolicy', () => ({
  useAccountingBankingSettings: mocks.useAccountingBankingSettings,
}));

vi.mock('@/modules/accounting/public', () => ({
  useActiveBankAccounts: mocks.useActiveBankAccounts,
}));

vi.mock('./hooks/useSupplierCreditNotes', () => ({
  useSupplierCreditNotes: mocks.useSupplierCreditNotes,
}));

vi.mock('./components/SupplierPaymentMethods/SupplierPaymentMethods', () => ({
  SupplierPaymentMethods: () => <div>Métodos de pago</div>,
}));

const purchase = {
  id: 'purchase-1',
  numberId: 'COMP-001',
  paymentState: {
    balance: 100,
    paid: 0,
    status: 'unpaid',
    total: 100,
  },
  provider: {
    name: 'Proveedor Fiscal',
  },
} as Purchase;

describe('RegisterSupplierPaymentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fbAddAccountsPayablePayment.mockResolvedValue({
      ok: true,
      paymentId: 'payment-1',
      purchaseId: 'purchase-1',
      paymentState: null,
      receiptNumber: null,
    });
    mocks.useAccountingBankingSettings.mockReturnValue({
      bankAccountsEnabled: false,
      bankPaymentPolicy: null,
    });
    mocks.useAccountingRolloutEnabled.mockReturnValue(true);
    mocks.useActiveBankAccounts.mockReturnValue([]);
    mocks.useIsOpenCashReconciliation.mockReturnValue({
      cashCount: {
        id: 'cash-count-1',
        incrementNumber: 12,
      },
      status: 'open',
    });
    mocks.useSelector.mockReturnValue({
      activeBusinessId: 'business-1',
      businessID: 'business-1',
      role: 'admin',
      uid: 'user-1',
    });
    mocks.useSupplierCreditNotes.mockReturnValue({
      creditNotes: [],
    });
  });

  it('requires operational evidence before registering a supplier payment', () => {
    render(
      <RegisterSupplierPaymentModal
        onCancel={vi.fn()}
        open
        purchase={purchase}
      />,
    );

    expect(
      screen.getByRole('dialog', { name: 'Registrar pago a proveedor' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Evidencia o referencia')).toHaveAttribute(
      'aria-invalid',
      'false',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    expect(mocks.fbAddAccountsPayablePayment).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Indica una evidencia o referencia.',
    );
    expect(screen.getByLabelText('Evidencia o referencia')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('trims and forwards payment evidence to the callable wrapper', async () => {
    const onCancel = vi.fn();

    render(
      <RegisterSupplierPaymentModal
        onCancel={onCancel}
        open
        purchase={purchase}
      />,
    );

    fireEvent.change(screen.getByLabelText('Evidencia o referencia'), {
      target: { value: '  Ticket AP-101  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    await waitFor(() =>
      expect(mocks.fbAddAccountsPayablePayment).toHaveBeenCalled(),
    );
    expect(mocks.fbAddAccountsPayablePayment).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'user-1' }),
      expect.objectContaining({
        evidenceNote: 'Ticket AP-101',
        note: 'Ticket AP-101',
      }),
    );
    expect(onCancel).toHaveBeenCalled();
  });
});
