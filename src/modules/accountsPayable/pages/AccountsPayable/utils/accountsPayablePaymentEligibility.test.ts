import { describe, expect, it } from 'vitest';

import type { AccountsPayableRow } from './accountsPayableDashboard';
import {
  getAccountsPayablePaymentBlockMessage,
  hasAccountsPayablePaymentBalance,
  isAccountsPayablePaymentEligible,
} from './accountsPayablePaymentEligibility';

const buildRow = ({
  balanceAmount = 100,
  canRegisterPayment = true,
  label = 'Aprobada',
  reason = null,
}: {
  balanceAmount?: number;
  canRegisterPayment?: boolean;
  label?: string;
  reason?: string | null;
} = {}): AccountsPayableRow =>
  ({
    balanceAmount,
    paymentControl: {
      canRegisterPayment,
      label,
      reason,
      status: canRegisterPayment ? 'payable' : 'on_hold',
      tone: canRegisterPayment ? 'success' : 'warning',
    },
  }) as AccountsPayableRow;

describe('accountsPayablePaymentEligibility', () => {
  it('uses the payable balance threshold from backend payment rules', () => {
    expect(
      hasAccountsPayablePaymentBalance(buildRow({ balanceAmount: 0.01 })),
    ).toBe(false);
    expect(
      hasAccountsPayablePaymentBalance(buildRow({ balanceAmount: 0.02 })),
    ).toBe(true);
  });

  it('requires both payment control clearance and open balance', () => {
    expect(isAccountsPayablePaymentEligible(buildRow())).toBe(true);
    expect(
      isAccountsPayablePaymentEligible(buildRow({ canRegisterPayment: false })),
    ).toBe(false);
    expect(
      isAccountsPayablePaymentEligible(buildRow({ balanceAmount: 0 })),
    ).toBe(false);
  });

  it('returns the correct UI block message', () => {
    expect(
      getAccountsPayablePaymentBlockMessage({
        canRegisterPayments: false,
        row: buildRow(),
      }),
    ).toBe('Tu rol no puede registrar pagos de CxP.');

    expect(
      getAccountsPayablePaymentBlockMessage({
        canRegisterPayments: true,
        row: buildRow({
          canRegisterPayment: false,
          label: 'Retenida',
          reason: 'Falta NCF válido',
        }),
      }),
    ).toBe('Retenida: Falta NCF válido');

    expect(
      getAccountsPayablePaymentBlockMessage({
        canRegisterPayments: true,
        row: buildRow({ balanceAmount: 0 }),
      }),
    ).toBe('La cuenta por pagar no tiene balance pendiente.');
  });
});
