import { describe, expect, it } from 'vitest';

import {
  collectChartOfAccountDescendantIds,
  DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE,
  normalizeChartOfAccountRecord,
  sortChartOfAccountsForDisplay,
} from '@/utils/accounting/chartOfAccounts';

describe('chartOfAccounts', () => {
  it('incluye cuentas base para arrancar el catalogo', () => {
    const cashAccount = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
      (account) => account.systemKey === 'cash',
    );
    const accountsPayableAccount = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
      (account) => account.systemKey === 'accounts_payable',
    );
    const retainedEarningsAccount = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
      (account) => account.systemKey === 'retained_earnings',
    );
    const cashOverShortExpenseAccount = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
      (account) => account.systemKey === 'cash_over_short_expense',
    );

    expect(cashAccount).toMatchObject({
      code: '1100',
      type: 'asset',
      normalSide: 'debit',
    });
    expect(accountsPayableAccount).toMatchObject({
      code: '2100',
      type: 'liability',
      normalSide: 'credit',
    });
    expect(retainedEarningsAccount).toMatchObject({
      code: '3200',
      type: 'equity',
      normalSide: 'credit',
    });
    expect(cashOverShortExpenseAccount).toMatchObject({
      code: '5250',
      type: 'expense',
      normalSide: 'debit',
    });
  });

  it('normaliza registros de firestore con defaults coherentes', () => {
    const result = normalizeChartOfAccountRecord('acc-1', 'business-1', {
      code: '4100',
      name: 'Ventas',
      type: 'income',
    });

    expect(result).toMatchObject({
      id: 'acc-1',
      businessId: 'business-1',
      code: '4100',
      name: 'Ventas',
      type: 'income',
      status: 'active',
      postingAllowed: true,
      normalSide: 'credit',
      currencyMode: 'functional_only',
    });
  });

  it('calcula descendientes sin incluir la raiz', () => {
    const accounts = [
      normalizeChartOfAccountRecord('root', 'business-1', {
        code: '1000',
        name: 'Activos',
        type: 'asset',
      }),
      normalizeChartOfAccountRecord('child-a', 'business-1', {
        code: '1100',
        name: 'Caja',
        type: 'asset',
        parentId: 'root',
      }),
      normalizeChartOfAccountRecord('child-b', 'business-1', {
        code: '1110',
        name: 'Banco',
        type: 'asset',
        parentId: 'child-a',
      }),
    ];

    expect(Array.from(collectChartOfAccountDescendantIds(accounts, 'root'))).toEqual(
      ['child-a', 'child-b'],
    );
  });

  it('ordena el catalogo por jerarquia y codigo', () => {
    const accounts = [
      normalizeChartOfAccountRecord('bank', 'business-1', {
        code: '1110',
        name: 'Banco',
        type: 'asset',
        parentId: 'assets',
      }),
      normalizeChartOfAccountRecord('income', 'business-1', {
        code: '4000',
        name: 'Ingresos',
        type: 'income',
      }),
      normalizeChartOfAccountRecord('assets', 'business-1', {
        code: '1000',
        name: 'Activos',
        type: 'asset',
      }),
      normalizeChartOfAccountRecord('cash', 'business-1', {
        code: '1100',
        name: 'Caja',
        type: 'asset',
        parentId: 'assets',
      }),
    ];

    expect(sortChartOfAccountsForDisplay(accounts).map((account) => account.id)).toEqual(
      ['assets', 'cash', 'bank', 'income'],
    );
  });
});
