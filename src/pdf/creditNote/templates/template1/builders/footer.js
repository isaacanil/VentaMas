import { money, getProductsIndividualDiscounts, hasIndividualDiscounts } from '../utils/formatters.js';

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
  /* Calcular descuentos */
  const individualDiscounts = getProductsIndividualDiscounts(d.items || []);
  const hasIndividualDisc = hasIndividualDiscounts(d.items || []);

  /* Tabla de totales para nota de crédito */
  const subtotal = (d.totalAmount || 0) / 1.18;
  const itbis = (d.totalAmount || 0) - subtotal;

  const totalsBody = [
    ['Sub-Total:', { text: money(subtotal), style: 'totalsValue', margin: [0, 0] }],
    ['ITBIS (18%):', { text: money(itbis), style: 'totalsValue', margin: [0, 0] }],
    hasIndividualDisc && [
      'Descuentos Productos:', { text: `-${money(individualDiscounts)}`, style: 'totalsValue', margin: [0, 0] }
    ],
    [
      { text: 'Total Acreditado:', bold: true, margin: [0, 4, 0, 2] },
      { text: money(d.totalAmount || 0), style: 'totalsValue', bold: true, margin: [0, 4, 0, 2] }
    ]
  ].filter(Boolean);

  /* devolución de la función factory */
  return () => ({
    margin: [32, 0, 32, 0],
    stack: [
      {
        columnGap: 25,
        columns: [
          { width: '*', stack: [signatureBlock('Autorizado Por:')] },
          { width: '*', stack: [signatureBlock('Recibido Conforme:', 'NOTA DE CRÉDITO')] },          
          {
            width: '*',
            margin: [0, 2, 0, 0],
            table: { widths: ['*', '*'], body: totalsBody },
            layout: 'noBorders'
          }
        ]
      },
      ...(d.reason ? [{ text: `Motivo: ${d.reason}`, margin: [0, 8, 0, 0] }] : []),
      ...(biz?.invoice?.invoiceMessage
        ? [{ text: biz.invoice.invoiceMessage, margin: [0, 4, 0, 0] }]
        : [])
    ]
  });
} 