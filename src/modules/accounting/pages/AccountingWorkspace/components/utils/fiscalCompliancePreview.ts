import type { MonthlyComplianceRun } from '../../utils/monthlyCompliance';

export type FiscalSourceRow = Record<string, unknown> & {
  sourceId: string;
  index: number;
};

export const formatMoney = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '-';
};

export const formatCurrency = (value: unknown) => `RD$ ${formatMoney(value)}`;

export const formatShortDate = (value: unknown) => {
  if (typeof value !== 'string' || !value.length) return '-';
  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!isoDateMatch) return '-';
  const [, year, month, day] = isoDateMatch;
  return `${day}/${month}/${year}`;
};

export const toPreviewText = (value: unknown) =>
  typeof value === 'string' && value.trim().length ? value.trim() : '-';

const hasPreviewValue = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0;

export const toSourceRows = (
  sourceRecords: Record<string, unknown>,
  sourceId: string,
): FiscalSourceRow[] => {
  const records = Array.isArray(sourceRecords[sourceId])
    ? sourceRecords[sourceId]
    : [];

  return records.map((record, index) => ({
    ...(record && typeof record === 'object'
      ? (record as Record<string, unknown>)
      : {}),
    sourceId,
    index,
  }));
};

export const getDgii606ExcludedRows = (run: MonthlyComplianceRun) => {
  const sourceRecords = run.sourceSnapshot.sourceRecords;
  return [
    ...toSourceRows(sourceRecords, 'excludedPurchases'),
    ...toSourceRows(sourceRecords, 'excludedExpenses'),
    ...toSourceRows(sourceRecords, 'excludedAccountsPayablePayments'),
  ].sort((left, right) =>
    String(left.issuedAt ?? '').localeCompare(String(right.issuedAt ?? '')),
  );
};

export const getDgii606Rows = (run: MonthlyComplianceRun) => {
  const sourceRecords = run.sourceSnapshot.sourceRecords;
  return [
    ...toSourceRows(sourceRecords, 'purchases'),
    ...toSourceRows(sourceRecords, 'expenses'),
  ].sort((left, right) =>
    String(left.issuedAt ?? '').localeCompare(String(right.issuedAt ?? '')),
  );
};

export const getDgii607Rows = (run: MonthlyComplianceRun) => {
  const sourceRecords = run.sourceSnapshot.sourceRecords;
  return [
    ...toSourceRows(sourceRecords, 'invoices'),
    ...toSourceRows(sourceRecords, 'thirdPartyWithholdings'),
    ...toSourceRows(sourceRecords, 'creditNotes'),
    ...toSourceRows(sourceRecords, 'debitNotes'),
  ]
    .filter((row) => hasPreviewValue(row.documentFiscalNumber))
    .sort((left, right) =>
      String(left.retentionDate ?? left.issuedAt ?? '').localeCompare(
        String(right.retentionDate ?? right.issuedAt ?? ''),
      ),
    );
};

export const getDgii607ExcludedRows = (run: MonthlyComplianceRun) => {
  const sourceRecords = run.sourceSnapshot.sourceRecords;
  return [
    ...toSourceRows(sourceRecords, 'excludedInvoices'),
    ...toSourceRows(sourceRecords, 'excludedThirdPartyWithholdings'),
    ...toSourceRows(sourceRecords, 'excludedCreditNotes'),
    ...toSourceRows(sourceRecords, 'excludedDebitNotes'),
  ].sort((left, right) =>
    String(left.retentionDate ?? left.issuedAt ?? '').localeCompare(
      String(right.retentionDate ?? right.issuedAt ?? ''),
    ),
  );
};

export const getDgii608Rows = (run: MonthlyComplianceRun) => {
  const sourceRecords = run.sourceSnapshot.sourceRecords;
  return [
    ...toSourceRows(sourceRecords, 'invoices'),
    ...toSourceRows(sourceRecords, 'creditNotes'),
    ...toSourceRows(sourceRecords, 'debitNotes'),
  ].sort((left, right) =>
    String(left.issuedAt ?? '').localeCompare(String(right.issuedAt ?? '')),
  );
};

export const resolveDgiiDocumentType = (documentFiscalNumber: unknown) => {
  const ncf = toPreviewText(documentFiscalNumber).toUpperCase();
  if (ncf.startsWith('B01')) return '01';
  if (ncf.startsWith('B02')) return '02';
  if (ncf.startsWith('B03')) return '03';
  if (ncf.startsWith('B04')) return '04';
  if (ncf.startsWith('E31')) return '31';
  if (ncf.startsWith('E32')) return '32';
  if (ncf.startsWith('E33')) return '33';
  if (ncf.startsWith('E34')) return '34';
  return '-';
};

export const resolveExcludedReason = (row: Record<string, unknown>) => {
  if (!hasPreviewValue(row.documentFiscalNumber)) return 'Sin NCF';
  return 'Fuera del reporte';
};

export const getRunRecordCount = (run: MonthlyComplianceRun | null) => {
  if (!run) return 0;
  if (run.reportCode === 'DGII_606') return getDgii606Rows(run).length;
  if (run.reportCode === 'DGII_607') return getDgii607Rows(run).length;
  if (run.reportCode === 'DGII_608') return getDgii608Rows(run).length;

  return run.validationSummary.sourceSummaries.reduce(
    (total, source) => total + source.recordsScanned,
    0,
  );
};

export const getDgii606ItbisTotal = (run: MonthlyComplianceRun | null) =>
  run
    ? getDgii606Rows(run).reduce((total, row) => {
        const parsed = Number(row.itbisTotal);
        return Number.isFinite(parsed) ? total + parsed : total;
      }, 0)
    : 0;
