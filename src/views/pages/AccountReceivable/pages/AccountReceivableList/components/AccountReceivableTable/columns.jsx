import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';
import { getTimeElapsed } from '../../../../../../../hooks/useFormatTime';

import AccountActionsCell from './AccountActionsCell';

export const getColumns = (isPharmacy) => {
  const baseColumns = [
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
      Header: 'Factura',
      accessor: 'invoiceNumber',
      sortable: true,
      align: 'left',
      maxWidth: '1fr',
      minWidth: '120px',
    },
    {
      Header: 'Fecha',
      accessor: 'date',
      sortable: true,
      align: 'left',
      cell: ({ value }) => {
        const time = value.seconds * 1000;
        return getTimeElapsed(time, 0);
      },
      maxWidth: '1fr',
      minWidth: '160px',
    },
    {
      Header: 'Monto inicial',
      accessor: 'initialAmount',
      align: 'right',
      cell: ({ value }) => useFormatPrice(value),
      maxWidth: '1fr',
      minWidth: '120px',
    },
    {
      Header: 'Último pago',
      accessor: 'lastPaymentDate',
      align: 'left',
      cell: ({ value }) => {
        return value ? getTimeElapsed(value.seconds * 1000, 0) : 'Sin pagos';
      },
      maxWidth: '1fr',
      minWidth: '160px',
    },
    {
      Header: 'Total pagado',
      accessor: 'totalPaid',
      align: 'right',
      cell: ({ value }) => useFormatPrice(value),
      maxWidth: '1fr',
      minWidth: '120px',
    },
    {
      Header: 'Balance',
      accessor: 'balance',
      align: 'right',
      cell: ({ value }) => useFormatPrice(value),
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
      cell: ({ value }) => <AccountActionsCell value={value} />,
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
      cell: ({ value }) => value || 'N/A',
    });
  }

  return baseColumns;
};
