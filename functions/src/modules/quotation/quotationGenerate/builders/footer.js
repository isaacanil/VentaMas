
import { getDiscount, money, getProductsIndividualDiscounts, hasIndividualDiscounts } from "../utils/formatters.js";

/* Mapeo a texto de los métodos de pago */
const PAYMENT_METHODS = {
  cash:     'Efectivo',
  transfer: 'Transferencia',
  card:     'Tarjeta',
  creditNote: 'Nota de Crédito'
};

export function buildFooter(biz, d) {
  return (current, total) => {
    /* Métodos de pago */
    const paymentStack = d.paymentMethod?.filter(m => m?.status).length
      ? [
          { text: 'Métodos de Pago:', bold: true, margin: [0, 0, 0, 4] },
          {
            ul: d.paymentMethod
              .filter(m => m?.status)
              .map(m => ({
                text:
                  `${PAYMENT_METHODS[m.method?.toLowerCase()] || m.method}: ` +
                  money(m.value || 0) +
                  (m.reference ? ` - Ref: ${m.reference}` : ''),
                margin: [0, 0, 0, 0]
              }))
          }
        ]
      : [];

    /* Notas de crédito aplicadas */
    const creditNotesStack = d.creditNotePayment?.length
      ? [
          { text: 'Notas de Crédito Aplicadas:', bold: true, margin: [0, 8, 0, 4] },
          {
            ul: d.creditNotePayment.map(note => ({
              text: `NCF: ${note.ncf} - ${money(note.amountUsed)}`,
              margin: [0, 0, 0, 0]
            }))
          }
        ]
      : [];

    /* Calcular descuentos */
    const individualDiscounts = getProductsIndividualDiscounts(d.products || []);
    const hasIndividualDisc = hasIndividualDiscounts(d.products || []);
    const generalDiscount = hasIndividualDisc ? 0 : getDiscount(d);

    /* Tabla de totales */
    const totalsBody = [
      ['Sub-Total:', { text: money(d.totalPurchaseWithoutTaxes.value), style: 'totalsValue', margin: [0, 0] }],
      ['ITBIS:',     { text: money(d.totalTaxes.value),                style: 'totalsValue', margin: [0, 0] }],
      !hasIndividualDisc && d.discount?.value && [
        'Descuento General:', { text: `-${money(generalDiscount)}`, style: 'totalsValue', margin: [0, 0] }
      ],
      hasIndividualDisc && [
        'Descuentos Productos:', { text: `-${money(individualDiscounts)}`, style: 'totalsValue', margin: [0, 0] }
      ],
      d.delivery?.status && [
        'Delivery:', { text: money(d.delivery.value), style: 'totalsValue', margin: [0, 0] }
      ],
      [
        { text: 'Total:', bold: true, margin: [0, 4, 0, 2] },
        { text: money(d.totalPurchase.value), style: 'totalsValue', bold: true, margin: [0, 4, 0, 2] }
      ]
    ].filter(Boolean);

    return {
      margin: [32, 0, 32, 0],
      stack: [
        {
          columnGap: 25,
          columns: [
            { width: '*', stack: [...paymentStack, ...creditNotesStack] },
            { width: '*', text: '' }, // Columna vacía donde estaría la firma
            {
              width: '*',
              margin: [0, 2, 0, 0],
              table: { widths: ['*', '*'], body: totalsBody },
              layout: 'noBorders'
            }
          ]
        },
        ...(d.invoiceComment ? [{ text: d.invoiceComment, margin: [0, 8, 0, 0] }] : [])
      ]
    };
  };
}
