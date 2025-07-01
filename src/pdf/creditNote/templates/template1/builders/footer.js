import { money, getProductsIndividualDiscounts, hasIndividualDiscounts, getProductTax, getProductSubtotal } from '../utils/formatters.js';

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

  /* Calcular totales usando las funciones de pricing.js para mantener consistencia */
  let subtotalBeforeDiscounts = 0;
  let totalItbis = 0;
  
  (d.items || []).forEach(item => {
    const price = +item.pricing?.price || 0;
    const quantity = +item.amountToBuy || 1;
    
    // Usar subtotal básico (precio * cantidad)
    subtotalBeforeDiscounts += price * quantity;
    
    // Usar la función de impuestos de la aplicación
    totalItbis += getProductTax(item);
  });
  
  // Aplicar descuentos individuales al subtotal
  const subtotalAfterDiscounts = subtotalBeforeDiscounts - individualDiscounts;
  
  // El total final debe coincidir exactamente con el totalAmount de la aplicación
  const totalFinal = d.totalAmount || (subtotalAfterDiscounts + totalItbis);

  const totalsBody = [
    ['Sub-Total:', { text: money(subtotalBeforeDiscounts), style: 'totalsValue', margin: [0, 0] }],
    hasIndividualDisc && [
      'Descuentos Productos:', { text: `-${money(individualDiscounts)}`, style: 'totalsValue', margin: [0, 0] }
    ],
    hasIndividualDisc && [
      'Sub-Total (c/desc.):', { text: money(subtotalAfterDiscounts), style: 'totalsValue', margin: [0, 0] }
    ],
    ['ITBIS:', { text: money(totalItbis), style: 'totalsValue', margin: [0, 0] }],
    [
      { text: 'Total Acreditado:', bold: true, margin: [0, 4, 0, 2] },
      { text: money(totalFinal), style: 'totalsValue', bold: true, margin: [0, 4, 0, 2] }
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