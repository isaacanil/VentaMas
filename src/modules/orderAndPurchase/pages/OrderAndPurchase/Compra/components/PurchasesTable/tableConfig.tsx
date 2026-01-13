import {
  getOrderConditionByID,
  getOrderStateByID,
} from '@/constants/orderAndPurchaseState';
import type { ReactElement } from 'react';
import type { ColumnConfig } from '@/components/ui/AdvancedTable/types/ColumnTypes';
import { ProviderCell, PurchaseActionButtons } from './tableCells';

type CellRenderer = (args: { value: unknown }) => ReactElement | null;

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
    Header: 'Fecha Pago',
    accessor: 'paymentAt',
    minWidth: '140px',
    maxWidth: '140px',
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
    minWidth: '150px',
    maxWidth: '150px',
    format: 'price',
    type: 'badge',
  },
  {
    Header: 'Acción',
    accessor: 'action',
    maxWidth: '120px',
    minWidth: '120px',
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
    format: (value) => `${getOrderStateByID(value as string)?.name || ''}`,
  },
  {
    label: 'Condición',
    accessor: 'condition',
    format: (value) => `${getOrderConditionByID(value as string) || ''}`,
  },
];
