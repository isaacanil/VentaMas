import {
  addReportHeader,
  applyProfessionalStyling,
  formatCurrencyColumns,
  formatNumberColumns,
} from '@/utils/export/excel/exportConfig';
import { saveXlsxFile } from '@/utils/export/xlsx';

import type { Workbook, Worksheet } from 'exceljs';
import type {
  AccountsPayableRow,
  AccountsPayableSummary,
} from './accountsPayableDashboard';
import { buildAccountsPayableSummary } from './accountsPayableDashboard';

export type AccountsPayableExportRow = {
  Compra: string;
  Proveedor: string;
  Condicion: string;
  Vencimiento: string;
  Aging: string;
  Control: string;
  'Motivo control': string;
  Total: number;
  Pagado: number;
  Balance: number;
  'Moneda documento': string;
  'Moneda funcional': string;
  'Contexto moneda': string;
  'Tasa cambio': number | null;
  Pagos: number;
  Evidencias: number;
  NCF: string;
  'Factura proveedor': string;
  'Tipo documento': string;
  'Tipo gasto DGII': string;
  'Fecha factura': string;
  'Estado contable': string;
  'Fecha contable': string;
  'Posteo operativo': string;
  'Naturaleza contable': string;
  'Liquidacion contable': string;
  Subtotal: number | null;
  ITBIS: number | null;
  'Retencion ITBIS': number;
  'Retencion ISR': number;
  'Neto fiscal': number | null;
};

export type AccountsPayableAgingExportRow = {
  Bucket: string;
  Cuentas: number;
  Balance: number;
};

export type AccountsPayableCurrencyExportRow = {
  'Moneda documento': string;
  'Moneda funcional': string;
  Cuentas: number;
  Total: number;
  Pagado: number;
  Balance: number;
  'Neto fiscal': number;
};

export type AccountsPayableExportScope = {
  description: string;
  isClientFilteredQuery?: boolean;
  isQueryLimitReached?: boolean;
  label: string;
  queryLimit?: number;
  queryLimitMax?: number;
  rawDocCount?: number;
};

export type AccountsPayableScopeExportRow = {
  Campo: string;
  Valor: string | number;
};

const MONEY_COLUMNS = [
  'Total',
  'Pagado',
  'Balance',
  'Subtotal',
  'ITBIS',
  'Retencion ITBIS',
  'Retencion ISR',
  'Neto fiscal',
];

const NUMBER_COLUMNS = ['Pagos', 'Evidencias', 'Cuentas', 'Tasa cambio'];
const SCOPE_COLUMNS = ['Campo', 'Valor'];
const TOTAL_COLUMNS = [
  'Total',
  'Pagado',
  'Balance',
  'Pagos',
  'Evidencias',
  'Subtotal',
  'ITBIS',
  'Retencion ITBIS',
  'Retencion ISR',
  'Neto fiscal',
];

const formatExportDate = (value: number | null): string =>
  value
    ? new Intl.DateTimeFormat('es-DO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(value)
    : '';

const formatGeneratedAt = (value: Date): string =>
  new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);

const formatBoolean = (value: boolean | undefined): string =>
  value ? 'Si' : 'No';

const resolveExportCurrencyKey = (row: AccountsPayableExportRow): string =>
  row['Moneda documento'] || 'Sin moneda';

export const buildAccountsPayableExportFileName = (
  generatedAt = new Date(),
): string => {
  const stamp = generatedAt
    .toISOString()
    .slice(0, 16)
    .replace('T', '_')
    .replace(/[-:]/g, '');

  return `cuentas_por_pagar_${stamp}.xlsx`;
};

export const buildAccountsPayableExportRows = (
  rows: AccountsPayableRow[],
): AccountsPayableExportRow[] =>
  rows.map((row) => ({
    Compra: row.reference,
    Proveedor: row.providerName,
    Condicion: row.conditionLabel,
    Vencimiento: formatExportDate(row.dueAt),
    Aging: row.agingLabel,
    Control: row.paymentControl.label,
    'Motivo control': row.paymentControl.reason ?? '',
    Total: row.totalAmount,
    Pagado: row.paidAmount,
    Balance: row.balanceAmount,
    'Moneda documento': row.currencySnapshot.currency ?? '',
    'Moneda funcional': row.currencySnapshot.functionalCurrency ?? '',
    'Contexto moneda': row.currencySnapshot.currencyLabel,
    'Tasa cambio': row.currencySnapshot.exchangeRate,
    Pagos: row.paymentCount,
    Evidencias: row.evidenceCount,
    NCF: row.fiscalSnapshot.ncf ?? '',
    'Factura proveedor': row.fiscalSnapshot.vendorReference ?? '',
    'Tipo documento': row.fiscalSnapshot.documentType ?? '',
    'Tipo gasto DGII': row.fiscalSnapshot.dgii606ExpenseType ?? '',
    'Fecha factura': formatExportDate(row.fiscalSnapshot.billDate),
    'Estado contable': row.accountingSnapshot.statusLabel,
    'Fecha contable': formatExportDate(row.accountingSnapshot.accountingDate),
    'Posteo operativo': formatExportDate(row.accountingSnapshot.postedAt),
    'Naturaleza contable': row.accountingSnapshot.documentNatureLabel,
    'Liquidacion contable': row.accountingSnapshot.settlementTimingLabel,
    Subtotal: row.fiscalSnapshot.subtotalAmount,
    ITBIS: row.fiscalSnapshot.taxAmount,
    'Retencion ITBIS': row.fiscalSnapshot.withholdingITBISAmount ?? 0,
    'Retencion ISR': row.fiscalSnapshot.withholdingISRAmount ?? 0,
    'Neto fiscal': row.fiscalSnapshot.netPayableAmount,
  }));

export const buildAccountsPayableCurrencyExportRows = (
  rows: AccountsPayableExportRow[],
): AccountsPayableCurrencyExportRow[] => {
  const summaryMap = new Map<string, AccountsPayableCurrencyExportRow>();

  rows.forEach((row) => {
    const key = resolveExportCurrencyKey(row);
    const current = summaryMap.get(key) ?? {
      'Moneda documento': row['Moneda documento'] || 'Sin moneda',
      'Moneda funcional': row['Moneda funcional'] || '',
      Cuentas: 0,
      Total: 0,
      Pagado: 0,
      Balance: 0,
      'Neto fiscal': 0,
    };

    current.Cuentas += 1;
    current.Total += row.Total;
    current.Pagado += row.Pagado;
    current.Balance += row.Balance;
    current['Neto fiscal'] += row['Neto fiscal'] ?? 0;
    summaryMap.set(key, current);
  });

  return [...summaryMap.values()].map((row) => ({
    ...row,
    Total: Math.round(row.Total * 100) / 100,
    Pagado: Math.round(row.Pagado * 100) / 100,
    Balance: Math.round(row.Balance * 100) / 100,
    'Neto fiscal': Math.round(row['Neto fiscal'] * 100) / 100,
  }));
};

export const buildAccountsPayableAgingExportRows = (
  summary: AccountsPayableSummary,
): AccountsPayableAgingExportRow[] => [
  ...summary.buckets.map((bucket) => ({
    Bucket: bucket.label,
    Cuentas: bucket.count,
    Balance: bucket.balanceAmount,
  })),
  {
    Bucket: 'Total',
    Cuentas: summary.totalCount,
    Balance: summary.totalBalanceAmount,
  },
];

export const buildAccountsPayableScopeExportRows = ({
  generatedAt,
  rowCount,
  scope,
}: {
  generatedAt: Date;
  rowCount: number;
  scope?: AccountsPayableExportScope;
}): AccountsPayableScopeExportRow[] => {
  const rows: AccountsPayableScopeExportRow[] = [
    {
      Campo: 'Alcance',
      Valor: scope?.label ?? 'Lote visible',
    },
    {
      Campo: 'Descripcion',
      Valor:
        scope?.description ??
        'Cuentas por pagar visibles con los filtros aplicados al momento de exportar.',
    },
    {
      Campo: 'Registros exportados',
      Valor: rowCount,
    },
    {
      Campo: 'Generado',
      Valor: formatGeneratedAt(generatedAt),
    },
    {
      Campo: 'Consulta acotada',
      Valor: formatBoolean(scope?.isQueryLimitReached),
    },
    {
      Campo: 'Modo compatibilidad',
      Valor: formatBoolean(scope?.isClientFilteredQuery),
    },
  ];

  if (typeof scope?.rawDocCount === 'number') {
    rows.push({
      Campo: 'Registros leidos',
      Valor: scope.rawDocCount,
    });
  }

  if (typeof scope?.queryLimit === 'number') {
    rows.push({
      Campo: 'Limite de consulta',
      Valor: scope.queryLimit,
    });
  }

  if (typeof scope?.queryLimitMax === 'number') {
    rows.push({
      Campo: 'Maximo operativo',
      Valor: scope.queryLimitMax,
    });
  }

  return rows;
};

const addAccountsPayableTotalsRow = (
  worksheet: Worksheet,
  rows: AccountsPayableExportRow[],
  columns: string[],
) => {
  const totalsRow: Record<string, string | number> = {};
  const documentCurrencies = new Set(
    rows.map(resolveExportCurrencyKey).filter(Boolean),
  );
  const hasMixedCurrencies = documentCurrencies.size > 1;

  columns.forEach((column) => {
    if (column === 'Compra') {
      totalsRow[column] = 'TOTALES';
      return;
    }

    if (TOTAL_COLUMNS.includes(column)) {
      if (hasMixedCurrencies) {
        totalsRow[column] = '';
        return;
      }

      totalsRow[column] = rows.reduce(
        (sum, row) =>
          sum +
          (typeof row[column as keyof AccountsPayableExportRow] === 'number'
            ? Number(row[column as keyof AccountsPayableExportRow])
            : 0),
        0,
      );
      return;
    }

    if (column === 'Contexto moneda' && hasMixedCurrencies) {
      totalsRow[column] = 'Totales por moneda en hoja separada';
      return;
    }

    totalsRow[column] = '';
  });

  worksheet.addRow({});
  const row = worksheet.addRow(totalsRow);
  row.font = {
    bold: true,
    color: { argb: 'FF333333' },
    size: 11,
  };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEEEEEE' },
  };
  row.height = 30;
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
  });
};

const restyleHeaderRow = (worksheet: Worksheet) => {
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

const applyWorksheetFinish = ({
  columns,
  dataLength,
  moneyColumns,
  numberColumns,
  title,
  worksheet,
}: {
  columns: string[];
  dataLength: number;
  moneyColumns: string[];
  numberColumns: string[];
  title: string;
  worksheet: Worksheet;
}) => {
  applyProfessionalStyling(worksheet, dataLength);
  addReportHeader(worksheet, title);
  restyleHeaderRow(worksheet);
  formatCurrencyColumns(worksheet, columns, moneyColumns);
  formatNumberColumns(worksheet, columns, numberColumns);
};

const addAccountsPayableScopeWorksheet = ({
  generatedAt,
  rowCount,
  scope,
  workbook,
}: {
  generatedAt: Date;
  rowCount: number;
  scope?: AccountsPayableExportScope;
  workbook: Workbook;
}) => {
  const scopeRows = buildAccountsPayableScopeExportRows({
    generatedAt,
    rowCount,
    scope,
  });
  const scopeSheet = workbook.addWorksheet('Alcance CxP');
  scopeSheet.columns = SCOPE_COLUMNS.map((column) => ({
    header: column,
    key: column,
    width: column === 'Valor' ? 64 : 22,
  }));
  scopeRows.forEach((row) => scopeSheet.addRow(row));
  applyWorksheetFinish({
    columns: SCOPE_COLUMNS,
    dataLength: scopeRows.length,
    moneyColumns: [],
    numberColumns: [],
    title: 'Alcance del export CxP',
    worksheet: scopeSheet,
  });
  scopeSheet.getColumn(2).alignment = {
    vertical: 'middle',
    wrapText: true,
  };
};

export const exportAccountsPayableWorkbook = async ({
  generatedAt = new Date(),
  rows,
  scope,
}: {
  generatedAt?: Date;
  rows: AccountsPayableRow[];
  scope?: AccountsPayableExportScope;
}) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VentaMax';
  workbook.created = generatedAt;

  const exportRows = buildAccountsPayableExportRows(rows);
  addAccountsPayableScopeWorksheet({
    generatedAt,
    rowCount: exportRows.length,
    scope,
    workbook,
  });

  const accountsPayableSheet = workbook.addWorksheet('CxP visible');
  const accountsPayableColumns = Object.keys(
    exportRows[0] ?? {
      Compra: '',
      Proveedor: '',
      Condicion: '',
      Vencimiento: '',
      Aging: '',
      Control: '',
      'Motivo control': '',
      Total: 0,
      Pagado: 0,
      Balance: 0,
      'Moneda documento': '',
      'Moneda funcional': '',
      'Contexto moneda': '',
      'Tasa cambio': null,
      Pagos: 0,
      Evidencias: 0,
      NCF: '',
      'Factura proveedor': '',
      'Tipo documento': '',
      'Tipo gasto DGII': '',
      'Fecha factura': '',
      'Estado contable': '',
      'Fecha contable': '',
      'Posteo operativo': '',
      'Naturaleza contable': '',
      'Liquidacion contable': '',
      Subtotal: 0,
      ITBIS: 0,
      'Retencion ITBIS': 0,
      'Retencion ISR': 0,
      'Neto fiscal': 0,
    },
  );
  accountsPayableSheet.columns = accountsPayableColumns.map((column) => ({
    header: column,
    key: column,
    width: 18,
  }));
  exportRows.forEach((row) => accountsPayableSheet.addRow(row));
  addAccountsPayableTotalsRow(
    accountsPayableSheet,
    exportRows,
    accountsPayableColumns,
  );
  applyWorksheetFinish({
    columns: accountsPayableColumns,
    dataLength: exportRows.length,
    moneyColumns: MONEY_COLUMNS,
    numberColumns: NUMBER_COLUMNS,
    title: `Cuentas por pagar visibles - ${exportRows.length} registro${
      exportRows.length === 1 ? '' : 's'
    }`,
    worksheet: accountsPayableSheet,
  });

  const currencyRows = buildAccountsPayableCurrencyExportRows(exportRows);
  const currencySheet = workbook.addWorksheet('Resumen moneda');
  const currencyColumns = [
    'Moneda documento',
    'Moneda funcional',
    'Cuentas',
    'Total',
    'Pagado',
    'Balance',
    'Neto fiscal',
  ];
  currencySheet.columns = currencyColumns.map((column) => ({
    header: column,
    key: column,
    width: 18,
  }));
  currencyRows.forEach((row) => currencySheet.addRow(row));
  applyWorksheetFinish({
    columns: currencyColumns,
    dataLength: currencyRows.length,
    moneyColumns: ['Total', 'Pagado', 'Balance', 'Neto fiscal'],
    numberColumns: ['Cuentas'],
    title: 'Resumen por moneda CxP visible',
    worksheet: currencySheet,
  });

  const summary = buildAccountsPayableSummary(rows);
  const agingRows = buildAccountsPayableAgingExportRows(summary);
  const agingSheet = workbook.addWorksheet('Resumen aging');
  const agingColumns = ['Bucket', 'Cuentas', 'Balance'];
  agingSheet.columns = agingColumns.map((column) => ({
    header: column,
    key: column,
    width: 18,
  }));
  agingRows.forEach((row) => agingSheet.addRow(row));
  applyWorksheetFinish({
    columns: agingColumns,
    dataLength: agingRows.length,
    moneyColumns: ['Balance'],
    numberColumns: ['Cuentas'],
    title: 'Resumen aging CxP visible',
    worksheet: agingSheet,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveXlsxFile({
    content: buffer,
    fileName: buildAccountsPayableExportFileName(generatedAt),
  });
};
