import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AccountsPayableControlActionDropdown } from './AccountsPayableControlActionDropdown';
import type { AccountsPayableRow } from '../utils/accountsPayableDashboard';

const buildRow = (
  status: AccountsPayableRow['paymentControl']['status'] = 'payable',
): AccountsPayableRow =>
  ({
    id: 'vendor-bill-1',
    paidAmount: 0,
    paymentControl: {
      canRegisterPayment: status === 'payable',
      label: 'Aprobada',
      reason: null,
      status,
      tone: 'success',
    },
    paymentCount: 0,
    providerName: 'Proveedor Uno',
    purchase: { id: 'purchase-1' },
    reference: 'PO-1',
    vendorBill: { id: 'vendor-bill-1' },
  }) as AccountsPayableRow;

describe('AccountsPayableControlActionDropdown', () => {
  it('disables the control button when the current role cannot manage any available action', () => {
    render(
      <AccountsPayableControlActionDropdown
        canManageAction={() => false}
        disabledReason="Tu rol no puede gestionar controles de CxP."
        onSelectAction={vi.fn()}
        row={buildRow()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /control cxp/i }),
    ).toBeDisabled();
  });

  it('keeps the control button enabled when at least one available action is allowed', () => {
    render(
      <AccountsPayableControlActionDropdown
        canManageAction={(action) => action === 'place_hold'}
        onSelectAction={vi.fn()}
        row={buildRow()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /control cxp/i }),
    ).not.toBeDisabled();
  });
});
