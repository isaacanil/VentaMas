import type { Worksheet } from 'exceljs';

import {
  addReportHeader,
  applyProfessionalStyling,
  formatCurrencyColumns,
} from '@/hooks/exportToExcel/exportConfig';

import {
  formatAccountingPeriod,
  type FinancialReportsSnapshot,
} from '../../utils/accountingWorkspace';

type SummaryExportRow = {
  Indicador: string;
  Valor: number;
};

type TrialBalanceExportRow = {
  Cuenta: string;
  Nombre: string;
  Debito: number;
  Credito: number;
  Balance: number;
};

type IncomeStatementExportRow = {
  Cuenta: string;
  Nombre: string;
  Tipo: string;
  Monto: number;
};

type BalanceSheetExportRow = {
  Grupo: string;
  Cuenta: string;
  Nombre: string;
  Balance: number;
};

const downloadWorkbook = async (
  workbook: { xlsx: { writeBuffer: () => Promise<ArrayBuffer> } },
  fileName: string,
) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

const applySheetHeaderStyling = (
  worksheet: Worksheet,
  title: string,
  rowCount: number,
) => {
  applyProfessionalStyling(worksheet, rowCount);
  addReportHeader(worksheet, title);
  const headerRow = worksheet.getRow(4);
  headerRow.height = 35;
  headerRow.font = {
    bold: true,
    color: { argb: 'FF333333' },
    size: 12,
  };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F5F5' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
};

export const buildFinancialReportExportFileName = (periodKey: string): string =>
  `reportes_financieros_${periodKey}.xlsx`;

export const buildSummaryExportRows = (
  reports: FinancialReportsSnapshot,
): SummaryExportRow[] => [
  {
    Indicador: 'Debitos acumulados',
    Valor: reports.trialBalanceTotals.debit,
  },
  {
    Indicador: 'Creditos acumulados',
    Valor: reports.trialBalanceTotals.credit,
  },
  {
    Indicador: 'Resultado neto del periodo',
    Valor: reports.incomeTotals.netIncome,
  },
];

export const buildTrialBalanceExportRows = (
  reports: FinancialReportsSnapshot,
): TrialBalanceExportRow[] =>
  reports.trialBalance.map((row) => ({
    Cuenta: row.code,
    Nombre: row.name,
    Debito: row.debit,
    Credito: row.credit,
    Balance: row.balance,
  }));

export const buildIncomeStatementExportRows = (
  reports: FinancialReportsSnapshot,
): IncomeStatementExportRow[] => [
  ...reports.incomeRows.map((row) => ({
    Cuenta: row.code,
    Nombre: row.name,
    Tipo: row.kind === 'income' ? 'Ingreso' : 'Gasto',
    Monto: row.amount,
  })),
  {
    Cuenta: '',
    Nombre: 'Utilidad neta',
    Tipo: 'Total',
    Monto: reports.incomeTotals.netIncome,
  },
];

export const buildBalanceSheetExportRows = (
  reports: FinancialReportsSnapshot,
): BalanceSheetExportRow[] => [
  ...reports.balanceSheet.assets.map((row) => ({
    Grupo: 'Activos',
    Cuenta: row.code,
    Nombre: row.name,
    Balance: row.balance,
  })),
  ...reports.balanceSheet.liabilities.map((row) => ({
    Grupo: 'Pasivos',
    Cuenta: row.code,
    Nombre: row.name,
    Balance: row.balance,
  })),
  ...reports.balanceSheet.equity.map((row) => ({
    Grupo: 'Patrimonio',
    Cuenta: row.code,
    Nombre: row.name,
    Balance: row.balance,
  })),
  {
    Grupo: 'Patrimonio',
    Cuenta: '',
    Nombre: 'Resultado acumulado del periodo',
    Balance: reports.balanceSheet.currentEarnings,
  },
];

export const exportFinancialReportsWorkbook = async ({
  periodKey,
  reports,
}: {
  periodKey: string;
  reports: FinancialReportsSnapshot;
}) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const periodLabel = formatAccountingPeriod(periodKey);

  const summaryRows = buildSummaryExportRows(reports);
  const summarySheet = workbook.addWorksheet('Resumen');
  summarySheet.columns = [
    { header: 'Indicador', key: 'Indicador', width: 34 },
    { header: 'Valor', key: 'Valor', width: 18 },
  ];
  summaryRows.forEach((row) => summarySheet.addRow(row));
  applySheetHeaderStyling(
    summarySheet,
    `Resumen financiero - ${periodLabel}`,
    summaryRows.length,
  );
  formatCurrencyColumns(summarySheet, ['Indicador', 'Valor'], ['Valor']);

  const trialBalanceRows = buildTrialBalanceExportRows(reports);
  const trialBalanceSheet = workbook.addWorksheet('Balanza');
  trialBalanceSheet.columns = [
    { header: 'Cuenta', key: 'Cuenta', width: 14 },
    { header: 'Nombre', key: 'Nombre', width: 32 },
    { header: 'Debito', key: 'Debito', width: 18 },
    { header: 'Credito', key: 'Credito', width: 18 },
    { header: 'Balance', key: 'Balance', width: 18 },
  ];
  trialBalanceRows.forEach((row) => trialBalanceSheet.addRow(row));
  applySheetHeaderStyling(
    trialBalanceSheet,
    `Balanza de comprobacion - ${periodLabel}`,
    trialBalanceRows.length,
  );
  formatCurrencyColumns(
    trialBalanceSheet,
    ['Cuenta', 'Nombre', 'Debito', 'Credito', 'Balance'],
    ['Debito', 'Credito', 'Balance'],
  );

  const incomeRows = buildIncomeStatementExportRows(reports);
  const incomeSheet = workbook.addWorksheet('Resultados');
  incomeSheet.columns = [
    { header: 'Cuenta', key: 'Cuenta', width: 14 },
    { header: 'Nombre', key: 'Nombre', width: 32 },
    { header: 'Tipo', key: 'Tipo', width: 16 },
    { header: 'Monto', key: 'Monto', width: 18 },
  ];
  incomeRows.forEach((row) => incomeSheet.addRow(row));
  applySheetHeaderStyling(
    incomeSheet,
    `Estado de resultados - ${periodLabel}`,
    incomeRows.length,
  );
  formatCurrencyColumns(
    incomeSheet,
    ['Cuenta', 'Nombre', 'Tipo', 'Monto'],
    ['Monto'],
  );

  const balanceSheetRows = buildBalanceSheetExportRows(reports);
  const balanceSheetSheet = workbook.addWorksheet('Balance general');
  balanceSheetSheet.columns = [
    { header: 'Grupo', key: 'Grupo', width: 18 },
    { header: 'Cuenta', key: 'Cuenta', width: 14 },
    { header: 'Nombre', key: 'Nombre', width: 32 },
    { header: 'Balance', key: 'Balance', width: 18 },
  ];
  balanceSheetRows.forEach((row) => balanceSheetSheet.addRow(row));
  applySheetHeaderStyling(
    balanceSheetSheet,
    `Balance general - ${periodLabel}`,
    balanceSheetRows.length,
  );
  formatCurrencyColumns(
    balanceSheetSheet,
    ['Grupo', 'Cuenta', 'Nombre', 'Balance'],
    ['Balance'],
  );

  await downloadWorkbook(
    workbook,
    buildFinancialReportExportFileName(periodKey),
  );
};
