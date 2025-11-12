import { getTimeElapsed } from '../../../../../hooks/useFormatTime';

import {
  PreorderActionsCell,
  PriceCell,
  StatusCell,
} from './tableCells.jsx';

export const tableConfig = [
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
    cell: ({ value }) => {
      const time = value * 1000;
      return getTimeElapsed(time, 0);
    },
    maxWidth: '1fr',
    minWidth: '160px',
  },
  {
    Header: 'ITBIS',
    accessor: 'itbis',
    align: 'right',
    cell: ({ value }) => <PriceCell value={value} />,
    maxWidth: '1fr',
    minWidth: '100px',
  },
  {
    Header: 'Articulos',
    accessor: 'products',
    align: 'right',
    description: 'Artículos en la preventa',
    maxWidth: '1fr',
    minWidth: '100px',
  },
  {
    Header: 'Total',
    accessor: 'total',
    align: 'right',
    cell: ({ value }) => <PriceCell value={value} />,
    description: 'Monto total de la preventa',
    maxWidth: '1fr',
    minWidth: '110px',
  },
  {
    Header: 'Estatus',
    accessor: 'status',
    align: 'right',
    description: 'Estatus de la preventa',
    maxWidth: '1fr',
    minWidth: '100px',
    cell: ({ value }) => <StatusCell value={value} />,
  },
  {
    Header: 'Acción',
    align: 'right',
    accessor: 'accion',
    description: 'Acciones disponibles',
    maxWidth: '1fr',
    minWidth: '80px',
    clickable: false,
    cell: ({ value }) => <PreorderActionsCell value={value} />,
  },
];
