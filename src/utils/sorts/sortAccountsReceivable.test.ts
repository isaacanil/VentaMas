import { describe, expect, it } from 'vitest';

import type { AccountReceivableRow } from '@/utils/accountsReceivable/types';

import { sortAccounts } from './sortAccountsReceivable';

const baseRow = (overrides: Partial<AccountReceivableRow>): AccountReceivableRow => ({
  id: overrides.id ?? 'row-1',
  ncf: '',
  invoiceNumber: '',
  client: '',
  insurance: '',
  hasInsurance: false,
  isInsurance: false,
  initialAmount: 0,
  totalPaid: 0,
  balance: 0,
  products: 0,
  total: 0,
  ver: { account: {} as never },
  actions: { account: {} as never },
  type: 'normal',
  dateGroup: '',
  ...overrides,
});

describe('sortAccounts', () => {
  it('does not mutate original array when default criteria is used', () => {
    const accounts = [
      baseRow({ id: 'b', client: 'B' }),
      baseRow({ id: 'a', client: 'A' }),
    ];

    const result = sortAccounts(accounts, 'defaultCriteria', 'asc');

    expect(result.map((account) => account.id)).toEqual(['b', 'a']);
    expect(result).not.toBe(accounts);
    expect(accounts.map((account) => account.id)).toEqual(['b', 'a']);
  });

  it('sorts invoice numbers by numeric content instead of lexical text', () => {
    const result = sortAccounts(
      [
        baseRow({ id: 'invoice-10', invoiceNumber: 'FAC-10' }),
        baseRow({ id: 'invoice-2', invoiceNumber: 'FAC-2' }),
        baseRow({ id: 'missing', invoiceNumber: '' }),
      ],
      'invoiceNumber',
      'asc',
    );

    expect(result.map((account) => account.id)).toEqual([
      'missing',
      'invoice-2',
      'invoice-10',
    ]);
  });

  it('sorts dates from Date, Firestore-like seconds, and toMillis values', () => {
    const result = sortAccounts(
      [
        baseRow({
          id: 'date-object',
          date: new Date('2026-05-03T00:00:00.000Z'),
        }),
        baseRow({
          id: 'seconds',
          date: { seconds: 1_777_766_400 } as never,
        }),
        baseRow({
          id: 'toMillis',
          date: { toMillis: () => Date.parse('2026-05-01T00:00:00.000Z') } as never,
        }),
      ],
      'date',
      'asc',
    );

    expect(result.map((account) => account.id)).toEqual([
      'toMillis',
      'date-object',
      'seconds',
    ]);
  });

  it('sorts balances descending and treats missing balances as zero', () => {
    const result = sortAccounts(
      [
        baseRow({ id: 'zero', balance: 0 }),
        baseRow({ id: 'high', balance: 100 }),
        baseRow({ id: 'missing', balance: undefined as never }),
      ],
      'balance',
      'desc',
    );

    expect(result.map((account) => account.id)).toEqual([
      'high',
      'zero',
      'missing',
    ]);
  });
});
