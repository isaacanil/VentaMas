import { describe, expect, it } from 'vitest';

import { resolveCreditLimitStatus } from './creditLimit';

describe('creditLimit', () => {
  it('permite la operacion cuando no hay limites activos', () => {
    expect(
      resolveCreditLimitStatus({
        creditLimit: null,
        activeAccountsReceivableCount: 4,
        change: -150,
      }),
    ).toEqual({
      activeAccountsReceivableCount: 4,
      isWithinCreditLimit: true,
      isWithinInvoiceCount: true,
      creditLimitValue: 0,
    });
  });

  it('bloquea cuando se alcanza el maximo de facturas activas', () => {
    expect(
      resolveCreditLimitStatus({
        creditLimit: {
          invoice: {
            status: true,
            value: 3,
          },
        },
        activeAccountsReceivableCount: 3,
        change: 0,
      }),
    ).toEqual(
      expect.objectContaining({
        activeAccountsReceivableCount: 3,
        isWithinInvoiceCount: false,
        isWithinCreditLimit: true,
      }),
    );
  });

  it('calcula el siguiente balance usando el cambio negativo y el balance configurado', () => {
    expect(
      resolveCreditLimitStatus({
        creditLimit: {
          creditLimit: {
            status: true,
            value: 500,
          },
          currentBalance: 350,
        },
        activeAccountsReceivableCount: 1,
        change: -120,
      }),
    ).toEqual({
      activeAccountsReceivableCount: 1,
      isWithinCreditLimit: true,
      isWithinInvoiceCount: true,
      creditLimitValue: 470,
    });
  });

  it('usa el balance actual recibido como argumento y marca exceso cuando supera el limite', () => {
    expect(
      resolveCreditLimitStatus({
        creditLimit: {
          creditLimit: {
            status: true,
            value: 500,
          },
          currentBalance: 100,
        },
        activeAccountsReceivableCount: null,
        currentBalance: 480,
        change: -30,
      }),
    ).toEqual({
      activeAccountsReceivableCount: 0,
      isWithinCreditLimit: false,
      isWithinInvoiceCount: true,
      creditLimitValue: 510,
    });
  });
});
