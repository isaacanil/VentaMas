import {
  getOrderConditionByID,
  getOrderStateByID,
} from '@/constants/orderAndPurchaseState';
import type { ReactElement } from 'react';
import type { ColumnConfig } from '@/components/ui/AdvancedTable/types/ColumnTypes';
import { OrderActionButtons } from './tableCells';

type CellRenderer = (args: { value: unknown }) => ReactElement | null;

type OrderTableColumn = Omit<ColumnConfig, 'cell'> & { cell?: CellRenderer };

interface FilterConfigItem {
  label: string;
  accessor: string;
  format?: (value: unknown) => string;
  defaultValue?: string;
}

export const columns: OrderTableColumn[] = [
  {
    Header: '#',
    accessor: 'number',
    minWidth: '50px',
    maxWidth: '50px',
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
    minWidth: '150px',
    accessor: 'provider',
  },
  {
    Header: 'Fecha Pedido',
    accessor: 'createdAt',
    maxWidth: '140px',
    minWidth: '140px',
    type: 'date',
  },
  {
    Header: 'Fecha Pago',
    accessor: 'paymentDate',
    maxWidth: '140px',
    minWidth: '140px',
    type: 'dateStatus',
  },
  {
    Header: 'Evidencia',
    accessor: 'fileList',
    maxWidth: '90px',
    minWidth: '90px',
    align: 'right',
    type: 'file',
  },
  {
    Header: 'Nota',
    accessor: 'note',
    maxWidth: '70px',
    minWidth: '70px',
    keepWidth: true,
    type: 'note',
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
    Header: 'Total',
    accessor: 'total',
    align: 'right',
    minWidth: '120px',
    maxWidth: '120px',
    format: 'price',
    type: 'badge',
  },
  {
    Header: 'Acción',
    accessor: 'action',
    align: 'right',
    keepWidth: true,
    maxWidth: '120px',
    minWidth: '120px',
    fixed: 'right',
    cell: ({ value }) => <OrderActionButtons order={value as { id?: string }} />,
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
    format: (value) => `${getOrderStateByID(value as string)?.name || ''}`,
    defaultValue: 'state_2',
  },
  {
    label: 'Condición',
    accessor: 'condition',
    format: (value) => `${getOrderConditionByID(value as string) || ''}`,
  },
];
