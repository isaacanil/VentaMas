import { getTimeElapsed } from '@/hooks/useFormatTime';
import type { ColumnConfig } from '@/components/ui/AdvancedTable/types/ColumnTypes';

import {
  PreorderActionsCell,
  PriceCell,
  StatusCell,
  type PreorderActionCellValue,
} from './tableCells';

export const tableConfig: ColumnConfig[] = [
  {
    Header: 'N°',
    accessor: 'numberID',
    sortable: true,
    align: 'left',
    maxWidth: '0.4fr',
    minWidth: '120px',
  },
  {
    Header: 'Cliente',
    accessor: 'client',
    sortable: true,
    align: 'left',
    maxWidth: '1.6fr',
    minWidth: '170px',
  },
  {
    Header: 'Fecha',
    accessor: 'date',
    sortable: true,
    align: 'left',
    cell: ({ value }: { value: unknown }) => {
      const numValue = value as number | null | undefined;
      if (!numValue || !Number.isFinite(numValue)) {
        return 'Sin fecha';
      }
      const time = numValue * 1000;
      return getTimeElapsed(time, 0);
    },
    maxWidth: '1fr',
    minWidth: '160px',
  },
  {
    Header: 'ITBIS',
    accessor: 'itbis',
    align: 'right',
    cell: ({ value }: { value: unknown }) => (
      <PriceCell value={value as number} />
    ),
    maxWidth: '1fr',
    minWidth: '100px',
  },
  {
    Header: 'Articulos',
    accessor: 'products',
    align: 'right',
    maxWidth: '1fr',
    minWidth: '100px',
  },
  {
    Header: 'Total',
    accessor: 'total',
    align: 'right',
    cell: ({ value }: { value: unknown }) => (
      <PriceCell value={value as number} />
    ),
    maxWidth: '1fr',
    minWidth: '110px',
  },
  {
    Header: 'Estatus',
    accessor: 'status',
    align: 'right',
    maxWidth: '1fr',
    minWidth: '100px',
    cell: ({ value }: { value: unknown }) => (
      <StatusCell value={value as string} />
    ),
  },
  {
    Header: 'Acción',
    align: 'right',
    accessor: 'accion',
    maxWidth: '1fr',
    minWidth: '80px',
    clickable: false,
    cell: ({ value }: { value: unknown }) => (
      <PreorderActionsCell value={value as PreorderActionCellValue} />
    ),
  },
];
