import {
  getOrderConditionByID,
  getOrderStateByID,
} from '@/constants/orderAndPurchaseState';
import type { ReactElement } from 'react';
import type { ColumnConfig } from '@/components/ui/AdvancedTable/types/ColumnTypes';
import { DateTime } from 'luxon';
import {
  ProviderCell,
  PurchaseActionButtons,
  TotalPaymentCell,
  DatePaymentCell,
} from './tableCells';

type CellRenderer = (args: {
  value: unknown;
  row: Record<string, unknown>;
}) => ReactElement | null;

type PurchaseTableColumn = Omit<ColumnConfig, 'cell'> & { cell?: CellRenderer };

interface FilterConfigItem {
  label: string;
  accessor: string;
  format?: (value: unknown) => string;
}

export const columns: PurchaseTableColumn[] = [
  {
    Header: '#',
    accessor: 'number',
    type: 'number',
    maxWidth: '50px',
    minWidth: '50px',
    keepWidth: true,
    fixed: 'left',
  },
  {
    Header: 'Estado',
    accessor: 'status',
    type: 'status',
    maxWidth: '150px',
    minWidth: '150px',
  },
  {
    Header: 'Proveedor',
    accessor: 'provider',
    minWidth: '150px',
    cell: ({ value }) => <ProviderCell value={value as string} />,
  },
  {
    Header: 'Fecha Delivery',
    accessor: 'deliveryAt',
    maxWidth: '140px',
    minWidth: '140px',
    type: 'dateStatus',
  },
  {
    Header: 'Pagos',
    accessor: 'paymentAt',
    minWidth: '140px',
    maxWidth: '140px',
    cell: ({ row }) => (
      <DatePaymentCell
        paymentAt={row.paymentAt as number | null}
        nextPaymentAt={row.nextPaymentAt as number | null}
      />
    ),
  },
  {
    Header: 'Items',
    accessor: 'items',
    align: 'right',
    minWidth: '80px',
    maxWidth: '80px',
    type: 'badge',
  },
  {
    Header: 'Balance',
    accessor: 'paymentBalance',
    align: 'right',
    minWidth: '130px',
    maxWidth: '130px',
    format: 'price',
    type: 'badge',
  },
  {
    Header: 'Total',
    accessor: 'total',
    align: 'right',
    minWidth: '150px',
    maxWidth: '150px',
    fixed: 'right',
    right: '60px',
    cell: ({ row }) => (
      <TotalPaymentCell
        total={row.total as number}
        paymentStatus={row.paymentStatus as string}
      />
    ),
  },
  {
    Header: ' ',
    accessor: 'action',
    maxWidth: '60px',
    minWidth: '60px',
    keepWidth: true,
    align: 'right',
    fixed: 'right',
    cell: ({ value }) => (
      <PurchaseActionButtons purchaseData={value as { id?: string }} />
    ),
  },
];

export const filterConfig: FilterConfigItem[] = [
  {
    label: 'Proveedor',
    accessor: 'provider',
  },
  {
    label: 'Estado',
    accessor: 'state',
    format: (value: unknown): string => {
      const state = getOrderStateByID(value as string);
      return (typeof state === 'object' && state !== null ? state.name : (state || '')) as string;
    },
  },
  {
    label: 'Condición',
    accessor: 'condition',
    format: (value: unknown): string => {
      const condition = getOrderConditionByID(value as string);
      return (typeof condition === 'object' && condition !== null ? condition.name : (condition || '')) as string;
    },
  },
];
