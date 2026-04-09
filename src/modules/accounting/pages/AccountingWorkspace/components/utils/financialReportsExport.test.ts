import { describe, expect, it } from 'vitest';

import type { FinancialReportsSnapshot } from '../../utils/accountingWorkspace';

import {
  buildBalanceSheetExportRows,
  buildFinancialReportExportFileName,
  buildIncomeStatementExportRows,
  buildSummaryExportRows,
  buildTrialBalanceExportRows,
} from './financialReportsExport';

const sampleReports: FinancialReportsSnapshot = {
  trialBalance: [
    {
      accountId: 'cash-1',
      code: '1100',
      name: 'Caja general',
      type: 'asset',
      debit: 11180,
      credit: 5200,
      balance: 5980,
    },
  ],
  trialBalanceTotals: {
    debit: 16380,
    credit: 16380,
  },
  incomeRows: [
    {
      accountId: 'sales-1',
      code: '4100',
      name: 'Ventas',
      kind: 'income',
      amount: 2300,
    },
    {
      accountId: 'expense-1',
      code: '5200',
      name: 'Gastos operativos',
      kind: 'expense',
      amount: 3000,
    },
  ],
  incomeTotals: {
    income: 2300,
    expense: 3000,
    netIncome: -700,
  },
  balanceSheet: {
    assets: [
      {
        accountId: 'cash-1',
        code: '1100',
        name: 'Caja general',
        type: 'asset',
        debit: 11180,
        credit: 5200,
        balance: 5980,
      },
    ],
    liabilities: [
      {
        accountId: 'tax-1',
        code: '2200',
        name: 'Impuestos por pagar',
        type: 'liability',
        debit: 0,
        credit: 180,
        balance: 180,
      },
    ],
    equity: [
      {
        accountId: 'capital-1',
        code: '3100',
        name: 'Capital',
        type: 'equity',
        debit: 0,
        credit: 10000,
        balance: 10000,
      },
    ],
    currentEarnings: -700,
  },
};

describe('financialReportsExport', () => {
  it('builds a stable file name from the selected period', () => {
    expect(buildFinancialReportExportFileName('2026-03')).toBe(
      'reportes_financieros_2026-03.xlsx',
    );
  });

  it('maps the summary cards into export rows', () => {
    expect(buildSummaryExportRows(sampleReports)).toEqual([
      { Indicador: 'Debitos acumulados', Valor: 16380 },
      { Indicador: 'Creditos acumulados', Valor: 16380 },
      { Indicador: 'Resultado neto del periodo', Valor: -700 },
    ]);
  });

  it('maps trial balance, income statement and balance sheet rows for export', () => {
    expect(buildTrialBalanceExportRows(sampleReports)).toEqual([
      {
        Cuenta: '1100',
        Nombre: 'Caja general',
        Debito: 11180,
        Credito: 5200,
        Balance: 5980,
      },
    ]);

    expect(buildIncomeStatementExportRows(sampleReports)).toEqual([
      {
        Cuenta: '4100',
        Nombre: 'Ventas',
        Tipo: 'Ingreso',
        Monto: 2300,
      },
      {
        Cuenta: '5200',
        Nombre: 'Gastos operativos',
        Tipo: 'Gasto',
        Monto: 3000,
      },
      {
        Cuenta: '',
        Nombre: 'Utilidad neta',
        Tipo: 'Total',
        Monto: -700,
      },
    ]);

    expect(buildBalanceSheetExportRows(sampleReports)).toEqual([
      {
        Grupo: 'Activos',
        Cuenta: '1100',
        Nombre: 'Caja general',
        Balance: 5980,
      },
      {
        Grupo: 'Pasivos',
        Cuenta: '2200',
        Nombre: 'Impuestos por pagar',
        Balance: 180,
      },
      {
        Grupo: 'Patrimonio',
        Cuenta: '3100',
        Nombre: 'Capital',
        Balance: 10000,
      },
      {
        Grupo: 'Patrimonio',
        Cuenta: '',
        Nombre: 'Resultado acumulado del periodo',
        Balance: -700,
      },
    ]);
  });
});
