import {
  addReportHeader,
  applyProfessionalStyling,
  formatCurrencyColumns,
} from '@/hooks/exportToExcel/exportConfig';
import exportToExcel from '@/hooks/exportToExcel/useExportToExcel';
import { formatDate } from './formatters';

import type {
  ReceivableAuditInvoice,
  ReceivablesLookup,
} from '@/utils/accountsReceivable/types';

type BaseExportRow = {
  Número: string | number;
  Cliente: string;
  NCF: string;
  'Monto total': number;
  Fecha: string;
  Estado: string;
  'Tiene CxC': 'Sí' | 'No';
};

type DeveloperExportRow = BaseExportRow & {
  'ID Factura': string;
};

export type AccountReceivableAuditExportRow =
  | BaseExportRow
  | DeveloperExportRow;

export const buildAccountReceivableAuditExportRows = ({
  invoices,
  isDeveloperUser,
  receivablesByInvoice,
}: {
  invoices: ReceivableAuditInvoice[];
  isDeveloperUser: boolean;
  receivablesByInvoice: ReceivablesLookup;
}): AccountReceivableAuditExportRow[] => {
  return invoices.map((invoice) => {
    const baseRow: BaseExportRow = {
      Número: invoice.number ?? 'N/D',
      Cliente: invoice.clientName,
      NCF: invoice.ncf ?? 'N/D',
      'Monto total': Number(invoice.totalAmount || 0),
      Fecha: invoice.createdAt ? formatDate(invoice.createdAt) : 'N/D',
      Estado: invoice.status || 'N/D',
      'Tiene CxC': receivablesByInvoice[invoice.invoiceId] ? 'Sí' : 'No',
    };

    if (!isDeveloperUser) {
      return baseRow;
    }

    return {
      'ID Factura': invoice.invoiceId,
      ...baseRow,
    };
  });
};

export const exportAccountReceivableAuditRows = async (
  rows: AccountReceivableAuditExportRow[],
) => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .split('.')[0];

  await (exportToExcel as any)(
    rows,
    'Facturas CxC',
    `auditoria-cxc-${timestamp}.xlsx`,
    (worksheet: any, dataSet: unknown[], columns: any[]) => {
      applyProfessionalStyling(
        worksheet,
        Array.isArray(dataSet) ? dataSet.length : 0,
      );
      formatCurrencyColumns(worksheet, columns, ['Monto total']);
      addReportHeader(worksheet, 'Auditoría de Cuentas por Cobrar');
    },
  );
};
