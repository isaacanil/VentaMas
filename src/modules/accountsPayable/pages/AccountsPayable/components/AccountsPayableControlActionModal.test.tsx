import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountsPayableRow } from '../utils/accountsPayableDashboard';

import { AccountsPayableControlActionModal } from './AccountsPayableControlActionModal';

const mocks = vi.hoisted(() => ({
  fbManageVendorBillControl: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: mocks.useSelector,
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

vi.mock('@/firebase/purchase/fbManageVendorBillControl', () => ({
  fbManageVendorBillControl: mocks.fbManageVendorBillControl,
}));

const row = {
  id: 'purchase:purchase-1',
  providerName: 'Proveedor Fiscal',
  purchase: {
    id: 'purchase-1',
  },
  reference: '120',
  vendorBill: {
    id: 'purchase:purchase-1',
  },
} as AccountsPayableRow;

describe('AccountsPayableControlActionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useSelector.mockReturnValue({
      activeBusinessId: 'business-1',
      businessID: 'business-1',
      uid: 'approver-1',
    });
    mocks.fbManageVendorBillControl.mockResolvedValue({
      ok: true,
    });
  });

  it('keeps backend approval blockers visible inside the modal', async () => {
    mocks.fbManageVendorBillControl.mockRejectedValueOnce(
      Object.assign(
        new Error(
          'No se puede aprobar la CxP porque falta NCF del comprobante fiscal.',
        ),
        { code: 'failed-precondition' },
      ),
    );

    render(
      <AccountsPayableControlActionModal
        action="approve"
        onCancel={vi.fn()}
        onCompleted={vi.fn()}
        open
        row={row}
      />,
    );

    fireEvent.change(screen.getByLabelText('Motivo de aprobación'), {
      target: { value: 'Factura validada contra recepción' },
    });
    fireEvent.change(
      screen.getByLabelText('Referencia de aprobación requerida'),
      {
        target: { value: 'Factura física revisada' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));

    await waitFor(() =>
      expect(mocks.fbManageVendorBillControl).toHaveBeenCalled(),
    );
    expect(
      await screen.findByText('No se pudo completar la acción'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'No se puede aprobar la CxP porque falta NCF del comprobante fiscal.',
      ),
    ).toBeInTheDocument();
  });

  it('accepts evidence URLs without requiring an evidence note', async () => {
    const onCompleted = vi.fn();

    render(
      <AccountsPayableControlActionModal
        action="approve"
        onCancel={vi.fn()}
        onCompleted={onCompleted}
        open
        row={row}
      />,
    );

    fireEvent.change(screen.getByLabelText('Motivo de aprobación'), {
      target: { value: 'Factura validada contra recepción' },
    });
    fireEvent.change(screen.getByLabelText('URLs de evidencia'), {
      target: {
        value:
          'https://files.example/ap-approval.pdf\nhttps://files.example/receipt.pdf',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));

    await waitFor(() =>
      expect(mocks.fbManageVendorBillControl).toHaveBeenCalled(),
    );
    expect(mocks.fbManageVendorBillControl).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'approver-1' }),
      expect.objectContaining({
        evidenceNote: null,
        evidenceUrls: [
          'https://files.example/ap-approval.pdf',
          'https://files.example/receipt.pdf',
        ],
      }),
    );
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });
});
