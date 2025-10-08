import { getDiscount, money, getProductsIndividualDiscounts, hasIndividualDiscounts } from '../utils/formatters.js';

/* Mapeo a texto de los métodos de pago */
const PAYMENT_METHODS = {
  cash:     'Efectivo',
  transfer: 'Transferencia',
  card:     'Tarjeta',
  creditNote: 'Nota de Crédito'
};

/* ───── bloque firma + etiqueta opcional ───── */
function signatureBlock(label, extraLine) {
  return {    
    stack: [
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 130, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 6] },
      { text: label || '', bold: true, margin: [0, 0, 0, 10] },
      extraLine && { text: extraLine, alignment: 'center', margin: [0, 4, 0, 0] }
    ].filter(Boolean)
  };
}

/* ───────────────────────────────────────────── */
export function buildFooter(biz, d) {
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
    ['Sub-Total:', { text: money(d.totalPurchaseWithoutTaxes?.value ?? 0), style: 'totalsValue', margin: [0, 0] }],
    ['ITBIS:',     { text: money(d.totalTaxes?.value ?? 0),                style: 'totalsValue', margin: [0, 0] }],
    !hasIndividualDisc && d.discount?.value && [
      'Descuento General:', { text: `-${money(generalDiscount)}`, style: 'totalsValue', margin: [0, 0] }
    ],
    hasIndividualDisc && [
      'Descuentos Productos:', { text: `-${money(individualDiscounts)}`, style: 'totalsValue', margin: [0, 0] }
    ],
    d.delivery?.status && [
      'Delivery:', { text: money(d.delivery?.value ?? 0), style: 'totalsValue', margin: [0, 0] }
    ],
    [
      { text: 'Total:', bold: true, margin: [0, 4, 0, 2] },
      { text: money(d.totalPurchase?.value ?? 0), style: 'totalsValue', bold: true, margin: [0, 4, 0, 2] }
    ]
  ].filter(Boolean);
  /* devolución de la función factory */
  return () => ({
    margin: [32, 0, 32, 0],
    stack: [
      {
        columnGap: 25,
        columns: [
          { width: '*', stack: [signatureBlock('Despachado Por:'), ...paymentStack, ...creditNotesStack] },
          { width: '*', stack: [signatureBlock('Recibido Conforme:', d.copyType || 'COPIA')] },
          {
            width: '*',
            margin: [0, 2, 0, 0],
            table: { widths: ['*', '*'], body: totalsBody },
            layout: 'noBorders'
          }
        ]
      },
      ...(d.invoiceComment ? [{ text: d.invoiceComment,          margin: [0, 8, 0, 0] }] : []),
      ...(biz?.invoice?.invoiceMessage
        ? [{ text: biz.invoice.invoiceMessage, margin: [0, 4, 0, 0] }]
        : [])
    ]
  });
}
