export const salesReportData = {
    title: 'Reporte de ventas',
    dateRange: {
      start: /*datesSelected.startDate*/ '',
      end: /*datesSelected.endDate*/ '',
    },
    table: {
      headers: [
        {
          id: 1,
          name: 'Client',
          align: 'left',
          description: 'Nombre del cliente que realizó la compra'
        },
        {
          id: 2,
          name: 'Fecha',
          align: 'left',
          description: 'Fecha en que se realizó la compra'
        },
        {
          id: 3,
          name: 'TOTAL',
          align: 'right',
          description: 'Monto total de la compra'
        },
        {
          id: 4,
          name: 'ITBIS',
          align: 'right',
          description: 'Impuesto sobre las ventas'
        },
        {
          id: 5,
          name: 'Pago con',
          align: 'right',
          description: 'Forma de pago utilizada'
        },
        {
          id: 6,
          name: 'Cambio',
          align: 'right',
          description: 'Cambio entregado al cliente'
        },
      ],
    //   rows: bills.map((bill) => {
    //     const formattedBill = formatBill(bill.data);
    //     return {
    //       id: bill.id,
    //       customer: formattedBill.customer,
    //       date: formattedBill.date,
    //       total: formattedBill.totalPurchase.value,
    //       itbis: formattedBill.itbis,
    //       paymentMethod: formattedBill.paymentMethod,
    //       change: formattedBill.change.value,
    //     }
    //   }),
     
    },
  };
  
