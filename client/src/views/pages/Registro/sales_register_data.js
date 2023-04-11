export const salesReportData = {
  title: 'Reporte de ventas',
  dateRange: {
    start: /*datesSelected.startDate*/ '',
    end: /*datesSelected.endDate*/ '',
  },
  table: {
    headers: [
      {
        name: 'RNC',
        align: 'left',
        description: 'Nombre del vendedor que realizó la venta',
        minWidth: '10%',
        width: '10%'
      },
      {
        name: 'Cliente',
        align: 'left',
        description: 'Nombre del cliente que realizó la compra',
        minWidth: '10%',
        width: '10%'
      },
      {
        name: 'Fecha',
        align: 'left',
        description: 'Fecha en que se realizó la compra',
        minWidth: '10%',
        width: '10%'
      },

      {
        name: 'ITBIS',
        align: 'right',
        description: 'Impuesto sobre las ventas',
        minWidth: '10%',
        width: '10%'
      },
      {
        name: 'Pago con',
        align: 'right',
        description: 'Forma de pago utilizada',
        minWidth: '10%',
        width: '10%'
      },
      {
        name: 'Cambio',
        align: 'right',
        description: 'Cambio entregado al cliente',
        minWidth: '10%',
        width: '10%'
      },
      {
        name: 'TOTAL',
        align: 'right',
        description: 'Monto total de la compra',
        minWidth: '10%',
        width: '10%'
      },
     
      // {
      //   id: 7,
      //   name: 'ver',
      //   align: 'right',
      //   description: 'Nombre del vendedor que realizó la venta',
      //   minWidth: '10%',
      //   width: '10%'

      // }
    ],
  },
};


