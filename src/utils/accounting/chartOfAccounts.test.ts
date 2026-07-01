import { describe, expect, it } from 'vitest';

import {
  CHART_OF_ACCOUNTS_MAX_LEVEL,
  collectChartOfAccountDescendantIds,
  DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE,
  buildChartOfAccountChildrenByParentId,
  buildChartOfAccountsById,
  getChartOfAccountLevel,
  getChartOfAccountMaxDescendantDepth,
  isChartOfAccountPostingAllowedForEntries,
  normalizeChartOfAccountRecord,
  resolveChartOfAccountClassification,
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
    const payrollPayableAccount = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
      (account) => account.systemKey === 'payroll_payable',
    );
    const payrollWithholdingsAccount = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
      (account) => account.systemKey === 'payroll_withholdings_payable',
    );
    const itbisWithholdingsAccount = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
      (account) => account.systemKey === 'withholding_itbis_payable',
    );
    const isrWithholdingsAccount = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
      (account) => account.systemKey === 'withholding_isr_payable',
    );
    const retainedEarningsAccount = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
      (account) => account.systemKey === 'retained_earnings',
    );
    const cashOverShortExpenseAccount = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
      (account) => account.systemKey === 'cash_over_short_expense',
    );
    const bankReconciliationIncomeAccount =
      DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
        (account) => account.systemKey === 'bank_reconciliation_income',
      );
    const bankReconciliationExpenseAccount =
      DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.find(
        (account) => account.systemKey === 'bank_reconciliation_expense',
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
    expect(payrollPayableAccount).toMatchObject({
      code: '2110',
      type: 'liability',
      normalSide: 'credit',
    });
    expect(payrollWithholdingsAccount).toMatchObject({
      code: '2120',
      type: 'liability',
      normalSide: 'credit',
    });
    expect(itbisWithholdingsAccount).toMatchObject({
      code: '2210',
      type: 'liability',
      normalSide: 'credit',
    });
    expect(isrWithholdingsAccount).toMatchObject({
      code: '2220',
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
    expect(bankReconciliationIncomeAccount).toMatchObject({
      code: '4160',
      type: 'income',
      normalSide: 'credit',
    });
    expect(bankReconciliationExpenseAccount).toMatchObject({
      code: '5260',
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

    expect(
      Array.from(collectChartOfAccountDescendantIds(accounts, 'root')),
    ).toEqual(['child-a', 'child-b']);
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

    expect(
      sortChartOfAccountsForDisplay(accounts).map((account) => account.id),
    ).toEqual(['assets', 'cash', 'bank', 'income']);
  });

  it('clasifica cuentas mayor y detalle segun hijos y permiso de asiento', () => {
    const accounts = [
      normalizeChartOfAccountRecord('root', 'business-1', {
        code: '1000',
        name: 'Activos',
        type: 'asset',
        postingAllowed: true,
      }),
      normalizeChartOfAccountRecord('detail', 'business-1', {
        code: '1100',
        name: 'Caja',
        type: 'asset',
        parentId: 'root',
        postingAllowed: true,
      }),
      normalizeChartOfAccountRecord('manual-major', 'business-1', {
        code: '1200',
        name: 'Bancos',
        type: 'asset',
        postingAllowed: false,
      }),
    ];
    const childrenByParentId = buildChartOfAccountChildrenByParentId(accounts);

    expect(
      resolveChartOfAccountClassification(
        accounts[0],
        childrenByParentId.get('root')?.length ?? 0,
      ),
    ).toBe('major');
    expect(
      resolveChartOfAccountClassification(
        accounts[1],
        childrenByParentId.get('detail')?.length ?? 0,
      ),
    ).toBe('detail');
    expect(
      resolveChartOfAccountClassification(
        accounts[2],
        childrenByParentId.get('manual-major')?.length ?? 0,
      ),
    ).toBe('major');
    expect(isChartOfAccountPostingAllowedForEntries(accounts[0], 1)).toBe(
      false,
    );
    expect(isChartOfAccountPostingAllowedForEntries(accounts[1], 0)).toBe(true);
  });

  it('calcula nivel hasta el sexto nivel y profundidad de descendientes', () => {
    const accounts = Array.from({ length: CHART_OF_ACCOUNTS_MAX_LEVEL }).map(
      (_, index) =>
        normalizeChartOfAccountRecord(`level-${index + 1}`, 'business-1', {
          code: `1${index + 1}00`,
          name: `Nivel ${index + 1}`,
          type: 'asset',
          parentId: index === 0 ? null : `level-${index}`,
        }),
    );
    const accountsById = buildChartOfAccountsById(accounts);
    const childrenByParentId = buildChartOfAccountChildrenByParentId(accounts);

    expect(getChartOfAccountLevel(accounts[0], accountsById)).toBe(1);
    expect(getChartOfAccountLevel(accounts[5], accountsById)).toBe(6);
    expect(
      getChartOfAccountMaxDescendantDepth('level-1', childrenByParentId),
    ).toBe(5);
  });
});
