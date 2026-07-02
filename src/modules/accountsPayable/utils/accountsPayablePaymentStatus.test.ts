import { describe, expect, it } from 'vitest';

import {
  isVoidedAccountsPayablePaymentStatus,
  resolveAccountsPayablePaymentAccountingEventType,
  resolveAccountsPayablePaymentStatusTag,
  shouldShowAccountsPayablePayment,
} from './accountsPayablePaymentStatus';

describe('accountsPayablePaymentStatus', () => {
  it('normaliza estados terminalmente inactivos de pagos CxP', () => {
    for (const status of ['void', 'voided', 'canceled', 'cancelled']) {
      expect(isVoidedAccountsPayablePaymentStatus(status)).toBe(true);
      expect(shouldShowAccountsPayablePayment({ status })).toBe(false);
      expect(
        shouldShowAccountsPayablePayment({ status }, { includeVoided: true }),
      ).toBe(true);
      expect(resolveAccountsPayablePaymentStatusTag(status)).toEqual({
        color: 'red',
        label: 'Anulado',
      });
      expect(resolveAccountsPayablePaymentAccountingEventType(status)).toBe(
        'accounts_payable.payment.voided',
      );
    }
  });

  it('mantiene borradores ocultos aun cuando se incluyen anulados', () => {
    expect(shouldShowAccountsPayablePayment({ status: 'draft' })).toBe(false);
    expect(
      shouldShowAccountsPayablePayment(
        { status: 'draft' },
        { includeVoided: true },
      ),
    ).toBe(false);
    expect(resolveAccountsPayablePaymentStatusTag('draft')).toEqual({
      color: 'gold',
      label: 'Borrador',
    });
  });

  it('trata estados activos o desconocidos como registrados', () => {
    expect(shouldShowAccountsPayablePayment({ status: 'posted' })).toBe(true);
    expect(shouldShowAccountsPayablePayment({ status: undefined })).toBe(true);
    expect(resolveAccountsPayablePaymentStatusTag('posted')).toEqual({
      color: 'green',
      label: 'Registrado',
    });
    expect(resolveAccountsPayablePaymentAccountingEventType('posted')).toBe(
      'accounts_payable.payment.recorded',
    );
  });
});
