import { saveAs } from 'file-saver';

import {
  addReportHeader,
  addTotalsRow,
  applyProfessionalStyling,
  formatCurrencyColumns,
} from '@/hooks/exportToExcel/exportConfig';
import type {
  ServiceCommissionRecord,
  ServiceCommissionSource,
  ServiceCommissionType,
} from '@/types/commissions';

import {
  formatReportDate,
  formatReportMoney,
  getCollaboratorLabel,
  getInvoiceLabel,
  getServiceLabel,
  toDateKey,
} from './reportDisplay';

type ServiceCommissionExportRow = {
  Colaborador: string;
  Comision: number;
  Estado: string;
  Factura: string;
  Fecha: string;
  Origen: string;
  Servicio: string;
  Tasa: string;
  Tipo: string;
  Vendido: number;
};

const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const SERVICE_COMMISSION_TYPE_LABELS: Record<ServiceCommissionType, string> = {
  fixed: 'Monto fijo',
  percentage: 'Porcentaje',
};

const SERVICE_COMMISSION_SOURCE_LABELS: Record<
  ServiceCommissionSource,
  string
> = {
  'business-default': 'Negocio',
  collaborator: 'Colaborador',
  manual: 'Manual',
  service: 'Servicio',
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
  'Vendido',
  'Comision',
  'Tipo',
  'Tasa',
  'Origen',
  'Estado',
];

const sanitizeFileNamePart = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_+/g, '_') || 'actual';

const formatCommissionRate = (
  type?: ServiceCommissionType,
  rateValue?: number | null,
): string => {
  const safeRate = Number.isFinite(Number(rateValue)) ? Number(rateValue) : 0;
  return type === 'fixed' ? formatReportMoney(safeRate) : `${safeRate}%`;
};

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
    const commissionSource = row.commission?.source;

    return {
      Fecha: formatReportDate(row.date),
      Factura: getInvoiceLabel(row),
      Servicio: getServiceLabel(row),
      Colaborador: getCollaboratorLabel(row),
      Vendido: Number(row.billedAmount ?? row.amountFactured ?? 0),
      Comision: Number(row.commissionAmount || 0),
      Tipo: commissionType
        ? SERVICE_COMMISSION_TYPE_LABELS[commissionType]
        : 'N/A',
      Tasa: formatCommissionRate(commissionType, row.commission?.rateValue),
      Origen: commissionSource
        ? SERVICE_COMMISSION_SOURCE_LABELS[commissionSource]
        : 'N/A',
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
    { header: 'Vendido', key: 'Vendido', width: 16 },
    { header: 'Comision', key: 'Comision', width: 16 },
    { header: 'Tipo', key: 'Tipo', width: 16 },
    { header: 'Tasa', key: 'Tasa', width: 14 },
    { header: 'Origen', key: 'Origen', width: 18 },
    { header: 'Estado', key: 'Estado', width: 14 },
  ];

  exportRows.forEach((row) => worksheet.addRow(row));

  applyProfessionalStyling(worksheet, exportRows.length);
  addTotalsRow(worksheet, exportRows, EXPORT_COLUMNS, ['Vendido', 'Comision']);
  addReportHeader(
    worksheet,
    `Reporte de comisiones de servicios ${toDateKey(startDate)} a ${toDateKey(
      endDate,
    )}`,
  );
  formatCurrencyColumns(worksheet, EXPORT_COLUMNS, ['Vendido', 'Comision']);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: XLSX_MIME_TYPE }),
    buildServiceCommissionsReportFileName({ endDate, startDate }),
  );
};
