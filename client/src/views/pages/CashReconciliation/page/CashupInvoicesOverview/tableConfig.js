export const tableData = {
    title: 'Reporte de ventas',
    headers: [
      {
        name: 'RNC',
        align: 'left',
        description: 'Nombre del vendedor que realizó la venta',
        max: '1.4fr',
        min: '150px',
      },
      {
        name: 'Cliente',
        align: 'left',
        description: 'Nombre del cliente que realizó la compra',
        max: '1.8fr',
        min: '170px',
      },
      {
        name: 'Fecha',
        align: 'left',
        description: 'Fecha en que se realizó la compra',
        max: '1fr',
        min: '160px',
      },
      {
        name: 'ITBIS',
        align: 'right',
        description: 'Impuesto sobre las ventas',
        max: '1fr',
        min: '100px',
      },
      {
        name: 'Pago con',
        align: 'right',
        description: 'Forma de pago utilizada',
        max: '1fr',
        min: '100px',
      },
      {
        name: 'Cambio',
        align: 'right',
        description: 'Cambio entregado al cliente',
        max: '1fr',
        min: '100px',
      },
      {
        name: 'TOTAL',
        align: 'right',
        description: 'Monto total de la compra',
        max: '1fr',
        min: '100px',
      },
  
      {
      
        name: 'ver',
        align: 'right',
        description: 'Nombre del vendedor que realizó la venta',
        max: '0.5fr',
        min: '50px'
  
      }
    ],
    messageNoData: 'No hay datos para mostrar',
  };