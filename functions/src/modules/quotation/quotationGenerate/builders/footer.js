import {
  getDiscount,
  money,
  getProductsIndividualDiscounts,
  hasIndividualDiscounts,
} from '../utils/formatters.js';

export function buildFooter(biz, d) {
  return (currentPage, pageCount) => {
    /* Calcular descuentos */
    const individualDiscounts = getProductsIndividualDiscounts(
      d.products || [],
    );
    const hasIndividualDisc = hasIndividualDiscounts(d.products || []);
    const generalDiscount = hasIndividualDisc ? 0 : getDiscount(d);

    /* Tabla de totales */
    const totalsBody = [
      [
        'Sub-Total:',
        {
          text: money(d.totalPurchaseWithoutTaxes?.value ?? 0),
          style: 'totalsValue',
          margin: [0, 0],
        },
      ],
      [
        'ITBIS:',
        {
          text: money(d.totalTaxes?.value ?? 0),
          style: 'totalsValue',
          margin: [0, 0],
        },
      ],
      !hasIndividualDisc &&
        d.discount?.value && [
          'Descuento General:',
          {
            text: `-${money(generalDiscount)}`,
            style: 'totalsValue',
            margin: [0, 0],
          },
        ],
      hasIndividualDisc && [
        'Descuentos Productos:',
        {
          text: `-${money(individualDiscounts)}`,
          style: 'totalsValue',
          margin: [0, 0],
        },
      ],
      d.delivery?.status && [
        'Delivery:',
        {
          text: money(d.delivery?.value ?? 0),
          style: 'totalsValue',
          margin: [0, 0],
        },
      ],
      [
        { text: 'Total:', bold: true, margin: [0, 4, 0, 2] },
        {
          text: money(d.totalPurchase?.value ?? 0),
          style: 'totalsValue',
          bold: true,
          margin: [0, 4, 0, 2],
        },
      ],
    ].filter(Boolean);

    return {
      margin: [32, 0, 32, 0],
      stack: [
        {
          columnGap: 25,
          columns: [
            { width: '*', text: '' }, // Columna vacía
            { width: '*', text: '' }, // Columna vacía donde estaría la firma
            {
              width: '*',
              margin: [0, 2, 0, 0],
              table: { widths: ['*', '*'], body: totalsBody },
              layout: 'noBorders',
            },
          ],
        },
        ...(d.invoiceComment
          ? [{ text: d.invoiceComment, margin: [0, 8, 0, 0] }]
          : []),
        ...(biz?.quotation?.footerMessage
          ? [{ text: biz.quotation.footerMessage, margin: [0, 4, 0, 0] }]
          : []),
        ...(pageCount > 1
          ? [
              {
                text: `Página ${currentPage} de ${pageCount}`,
                alignment: 'right',
                margin: [0, 4, 0, 0],
              },
            ]
          : []),
      ],
    };
  };
}
