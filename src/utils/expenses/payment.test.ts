import { describe, expect, it } from 'vitest';

import type { BankAccount } from '@/types/accounting';

import { normalizeExpensePayment } from './payment';

const bankAccount: BankAccount = {
  id: 'bank_1',
  businessId: 'biz_1',
  name: 'Cuenta principal',
  currency: 'DOP',
  status: 'active',
  institutionName: 'Banco Demo',
};

describe('normalizeExpensePayment', () => {
  it('normalizes bank payments using bankAccountId and clears cash drawer data', () => {
    expect(
      normalizeExpensePayment(
        {
          method: 'bank_transfer',
          bankAccountId: 'bank_1',
          bank: 'Texto legacy',
          cashRegister: 'cash_1',
          reference: 'TRX-100',
        },
        { bankAccounts: [bankAccount] },
      ),
    ).toEqual({
      method: 'bank_transfer',
      sourceType: 'bank',
      bankAccountId: 'bank_1',
      bank: 'Cuenta principal',
      cashRegister: null,
      comment: null,
      reference: 'TRX-100',
    });
  });

  it('falls back to the configured default bank account when the payment does not specify one', () => {
    expect(
      normalizeExpensePayment(
        {
          method: 'bank_transfer',
          bank: 'Texto legacy',
          reference: 'TRX-200',
        },
        {
          bankAccounts: [bankAccount],
          defaultBankAccountId: 'bank_1',
        },
      ),
    ).toEqual({
      method: 'bank_transfer',
      sourceType: 'bank',
      bankAccountId: 'bank_1',
      bank: 'Cuenta principal',
      cashRegister: null,
      comment: null,
      reference: 'TRX-200',
    });
  });

  it('normalizes open cash payments and clears bank data', () => {
    expect(
      normalizeExpensePayment({
        method: 'open_cash',
        cashRegister: 'cash_1',
        bankAccountId: 'bank_1',
        bank: 'Banco Demo',
        comment: 'Urgente',
      }),
    ).toEqual({
      method: 'open_cash',
      sourceType: 'cash_drawer',
      cashRegister: 'cash_1',
      bankAccountId: null,
      bank: null,
      comment: 'Urgente',
      reference: null,
    });
  });
});
