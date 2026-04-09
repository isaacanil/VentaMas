import { describe, expect, it } from 'vitest';

import { validateExpense } from './expenseValidate';

describe('validateExpense', () => {
  it('requires a bank account for bank-like payment methods', () => {
    expect(
      validateExpense({
        description: 'Pago servicio',
        amount: 100,
        categoryId: 'cat_1',
        dates: { expenseDate: Date.now() },
        payment: { method: 'bank_transfer' },
      }),
    ).toEqual({
      payment: {
        bankAccountId: 'Cuenta bancaria es requerida',
      },
    });
  });

  it('requires an open cash register for open cash expenses', () => {
    expect(
      validateExpense({
        description: 'Caja chica',
        amount: 80,
        categoryId: 'cat_1',
        dates: { expenseDate: Date.now() },
        payment: { method: 'open_cash' },
      }),
    ).toEqual({
      payment: {
        cashRegister: 'Cuadre de caja es requerido',
      },
    });
  });
});
