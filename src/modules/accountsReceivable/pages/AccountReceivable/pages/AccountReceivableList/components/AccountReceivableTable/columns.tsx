import { getTimeElapsed } from '@/hooks/useFormatTime';
import { formatPrice } from '@/utils/format';

import AccountActionsCell from './AccountActionsCell';
import { DocumentCell } from './DocumentCell';
import { PaymentSummaryCell } from './PaymentSummaryCell';

import type {
  AccountReceivableRow,
  TimestampLike,
} from '@/utils/accountsReceivable/types';
import type { AdvancedTableColumn } from '@/components/ui/AdvancedTable/AdvancedTable';

type AccountReceivableRowRecord = AccountReceivableRow &
  Record<string, unknown>;

const toMillis = (value?: TimestampLike): number | null => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const asNum = Number(value);
    return Number.isNaN(asNum) ? new Date(value).getTime() : asNum;
  }
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
  }
  return null;
};

export const getColumns = (
  isPharmacy: boolean,
): AdvancedTableColumn<AccountReceivableRowRecord>[] => {
  const baseColumns: AdvancedTableColumn<AccountReceivableRowRecord>[] = [
    {
      Header: 'Cliente',
      accessor: 'client',
      sortable: true,
      align: 'left',
      maxWidth: '1.8fr',
      minWidth: '200px',
      fixed: 'left', // Fijar la primera columna a la izquierda
    },
    {
      Header: 'Cédula/RNC',
      accessor: 'rnc',
      sortable: true,
      align: 'left',
      maxWidth: '1.2fr',
      minWidth: '130px',
    },
    {
      Header: 'Documento',
      accessor: 'invoiceNumber',
      sortable: true,
      align: 'left',
      maxWidth: '1fr',
      minWidth: '130px',
      cell: ({ row }) => {
        const r = row as AccountReceivableRowRecord | undefined;
        return (
          <DocumentCell
            documentType={r?.documentType}
            documentNumber={r?.documentNumber ?? r?.invoiceNumber}
          />
        );
      },
    },
    {
      Header: 'Fecha',
      accessor: 'date',
      sortable: true,
      align: 'left',
      cell: ({ value }) => {
        const time = toMillis(value as TimestampLike | undefined);
        return time ? getTimeElapsed(time, 0) : 'N/A';
      },
      maxWidth: '1fr',
      minWidth: '160px',
    },
    {
      Header: 'Pagos',
      accessor: 'totalPaid',
      align: 'right',
      cell: ({ row }) => {
        const r = row as AccountReceivableRowRecord | undefined;
        return (
          <PaymentSummaryCell
            totalPaid={Number(r?.totalPaid ?? 0)}
            initialAmount={Number(r?.initialAmount ?? 0)}
            lastPaymentDate={r?.lastPaymentDate as TimestampLike | undefined}
          />
        );
      },
      maxWidth: '1.4fr',
      minWidth: '180px',
    },
    {
      Header: 'Balance',
      accessor: 'balance',
      align: 'right',
      cell: ({ value }) => formatPrice(Number(value ?? 0)),
      maxWidth: '1fr',
      minWidth: '120px',
    },
    {
      Header: 'Acciones',
      align: 'center',
      accessor: 'actions',
      maxWidth: '1fr',
      minWidth: '120px',
      fixed: 'right', // Fijar la última columna a la derecha
      clickable: false,
      cell: ({ value }) => (
        <AccountActionsCell
          value={value as AccountReceivableRowRecord['actions']}
        />
      ),
    },
  ];

  if (isPharmacy) {
    // Inserta la columna de Aseguradora después de la columna de Cédula/RNC
    baseColumns.splice(2, 0, {
      Header: 'Aseguradora',
      accessor: 'insurance',
      sortable: true,
      align: 'left',
      maxWidth: '1.5fr',
      minWidth: '180px',
      cell: ({ value }) => (typeof value === 'string' && value ? value : 'N/A'),
    });
  }

  return baseColumns;
};
