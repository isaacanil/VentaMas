import {
  addReportHeader,
  addTotalsRow,
  applyProfessionalStyling,
  formatCurrencyColumns,
} from '@/utils/export/excel/exportConfig';
import type {
  ServiceCommissionRecord,
  ServiceCommissionType,
} from '@/domain/commissions/types';
import { saveXlsxFile } from '@/utils/export/xlsx';

import {
  formatReportDate,
  getCollaboratorLabel,
  getCommissionBaseLabel,
  getCommissionFormulaLabel,
  getCommissionRateLabel,
  getCommissionRuleLabel,
  getInvoiceLabel,
  getServiceLabel,
  toDateKey,
} from './reportDisplay';

type ServiceCommissionExportRow = {
  'Base comisionable': number;
  'Base de cálculo': string;
  Colaborador: string;
  Comisión: number;
  Estado: string;
  Factura: string;
  Fecha: string;
  Fórmula: string;
  'Regla aplicada': string;
  Servicio: string;
  Tasa: string;
  Tipo: string;
};

const SERVICE_COMMISSION_TYPE_LABELS: Record<ServiceCommissionType, string> = {
  fixed: 'Monto fijo',
  percentage: 'Porcentaje',
};

const SERVICE_COMMISSION_STATUS_LABELS: Record<
  ServiceCommissionRecord['status'],
  string
> = {
  active: 'Activa',
  voided: 'Anulada',
};

const EXPORT_COLUMNS = [
  'Fecha',
  'Factura',
  'Servicio',
  'Colaborador',
  'Base comisionable',
  'Base de cálculo',
  'Tasa',
  'Tipo',
  'Regla aplicada',
  'Fórmula',
  'Comisión',
  'Estado',
];

const sanitizeFileNamePart = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_+/g, '_') || 'actual';

export const buildServiceCommissionsReportFileName = ({
  endDate,
  startDate,
}: {
  endDate: Date;
  startDate: Date;
}): string =>
  `reporte_comisiones_servicios_${sanitizeFileNamePart(
    toDateKey(startDate),
  )}_${sanitizeFileNamePart(toDateKey(endDate))}.xlsx`;

export const buildServiceCommissionsReportExportRows = (
  rows: ServiceCommissionRecord[],
): ServiceCommissionExportRow[] =>
  rows.map((row) => {
    const commissionType = row.commission?.type;

    return {
      Fecha: formatReportDate(row.date),
      Factura: getInvoiceLabel(row),
      Servicio: getServiceLabel(row),
      Colaborador: getCollaboratorLabel(row),
      'Base comisionable': Number(row.billedAmount ?? row.amountFactured ?? 0),
      'Base de cálculo': getCommissionBaseLabel(row),
      Tasa: getCommissionRateLabel(row),
      Tipo: commissionType
        ? SERVICE_COMMISSION_TYPE_LABELS[commissionType]
        : 'Sin tipo',
      'Regla aplicada': getCommissionRuleLabel(row),
      Fórmula: getCommissionFormulaLabel(row),
      Comisión: Number(row.commissionAmount || 0),
      Estado: SERVICE_COMMISSION_STATUS_LABELS[row.status] ?? row.status,
    };
  });

export const exportServiceCommissionsReportWorkbook = async ({
  endDate,
  rows,
  startDate,
}: {
  endDate: Date;
  rows: ServiceCommissionRecord[];
  startDate: Date;
}) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Comisiones');
  const exportRows = buildServiceCommissionsReportExportRows(rows);

  worksheet.columns = [
    { header: 'Fecha', key: 'Fecha', width: 14 },
    { header: 'Factura', key: 'Factura', width: 18 },
    { header: 'Servicio', key: 'Servicio', width: 28 },
    { header: 'Colaborador', key: 'Colaborador', width: 28 },
    { header: 'Base comisionable', key: 'Base comisionable', width: 18 },
    { header: 'Base de cálculo', key: 'Base de cálculo', width: 20 },
    { header: 'Tasa', key: 'Tasa', width: 14 },
    { header: 'Tipo', key: 'Tipo', width: 16 },
    { header: 'Regla aplicada', key: 'Regla aplicada', width: 22 },
    { header: 'Fórmula', key: 'Fórmula', width: 32 },
    { header: 'Comisión', key: 'Comisión', width: 16 },
    { header: 'Estado', key: 'Estado', width: 14 },
  ];

  exportRows.forEach((row) => worksheet.addRow(row));

  applyProfessionalStyling(worksheet, exportRows.length);
  addTotalsRow(worksheet, exportRows, EXPORT_COLUMNS, [
    'Base comisionable',
    'Comisión',
  ]);
  addReportHeader(
    worksheet,
    `Reporte de comisiones de servicios ${toDateKey(startDate)} a ${toDateKey(
      endDate,
    )}`,
  );
  formatCurrencyColumns(worksheet, EXPORT_COLUMNS, [
    'Base comisionable',
    'Comisión',
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  saveXlsxFile({
    content: buffer,
    fileName: buildServiceCommissionsReportFileName({ endDate, startDate }),
  });
};
