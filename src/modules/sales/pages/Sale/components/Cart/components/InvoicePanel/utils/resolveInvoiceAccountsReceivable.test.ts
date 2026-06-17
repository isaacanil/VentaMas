import { DateTime } from 'luxon';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveInvoiceAccountsReceivable } from './resolveInvoiceAccountsReceivable';

describe('resolveInvoiceAccountsReceivable', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('normaliza los valores derivados de CxC antes de enviar la factura', () => {
    const paymentDate = DateTime.fromISO('2025-03-20').toMillis();

    expect(
      resolveInvoiceAccountsReceivable({
        accountsReceivable: {
          paymentFrequency: 'weekly',
          totalInstallments: '4',
          paymentDate,
          comments: 'cliente preferencial',
          currentBalance: 25,
        },
        cart: {
          payment: { value: 100 },
          totalPurchase: { value: 300 },
        },
      }),
    ).toEqual({
      paymentFrequency: 'weekly',
      totalInstallments: 4,
      paymentDate,
      comments: 'cliente preferencial',
      currentBalance: 25,
      installmentAmount: 50,
      totalReceivable: 200,
    });
  });

  it('resuelve una primera fecha de pago cuando el draft no tiene fecha', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));

    const resolved = resolveInvoiceAccountsReceivable({
      accountsReceivable: {
        paymentFrequency: 'monthly',
        totalInstallments: 2,
        paymentDate: null,
      },
      cart: {
        payment: { value: 0 },
        totalPurchase: { value: 100 },
      },
    });

    expect(resolved.paymentDate).toBe(
      DateTime.fromISO('2025-02-15').startOf('day').toMillis(),
    );
    expect(resolved.installmentAmount).toBe(50);
    expect(resolved.totalReceivable).toBe(100);
  });

  it('usa defaults seguros cuando frecuencia y cuotas vienen vacias', () => {
    const resolved = resolveInvoiceAccountsReceivable({
      accountsReceivable: {
        paymentFrequency: '',
        totalInstallments: 0,
      },
      cart: {
        change: { value: -12.345 },
      },
    });

    expect(resolved).toMatchObject({
      paymentFrequency: 'monthly',
      totalInstallments: 1,
      installmentAmount: 12.34,
      totalReceivable: 12.34,
    });
  });
});
