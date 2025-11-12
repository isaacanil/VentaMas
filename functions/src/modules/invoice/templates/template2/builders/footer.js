import { getDiscount, money } from '../utils/formatters.js';

const PAYMENT_METHODS = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
};

// ---------- Firma (línea + texto [+ opcional ‘COPIA’]) -------------------
function signatureBlock(label, extraLine) {
  return {
    stack: [
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }],
        margin: [0, 0, 0, 8], // espacio bajo la línea
      },
      { text: label },
      extraLine && {
        text: extraLine,
        alignment: 'center',
        margin: [0, 4, 0, 0],
      },
    ].filter(Boolean),
  };
}

// -------------------------------------------------------------------------
export function buildFooter(biz, d) {
  const paymentStack = d.paymentMethod?.length
    ? [
        // ⚫ Ahora sí en negrita
        { text: 'Métodos de Pago:', bold: true, margin: [0, 0, 0, 4] },
        ...d.paymentMethod
          .filter((m) => m?.status)
          .map((m) => ({
            text:
              `${PAYMENT_METHODS[m.method?.toLowerCase()] || m.method}: ` +
              money(m.value || 0) +
              (m.reference ? ` - Ref: ${m.reference}` : ''),
            margin: [0, 0, 0, 0],
          })),
      ]
    : [];

  // ---------- Tabla de totales ------------------------------------------
  const totalsBody = [
    [
      'Sub-Total:',
      {
        text: money(d.totalPurchaseWithoutTaxes.value),
        style: 'totalsValue',
        margin: [0, 2],
      },
    ],
    [
      'ITBIS:',
      { text: money(d.totalTaxes.value), style: 'totalsValue', margin: [0, 2] },
    ],
    d.discount?.value && [
      'Descuento:',
      {
        text: `-${money(getDiscount(d))}`,
        style: 'totalsValue',
        margin: [0, 2],
      },
    ],
    d.delivery?.status && [
      'Delivery:',
      { text: money(d.delivery.value), style: 'totalsValue', margin: [0, 2] },
    ],
    // ⚫ Total en negrita
    [
      { text: 'Total:', bold: true, margin: [0, 4, 0, 2] },
      {
        text: money(d.totalPurchase.value),
        style: 'totalsValue',
        bold: true,
        margin: [0, 4, 0, 2],
      },
    ],
  ].filter(Boolean);

  return () => ({
    margin: [40, 0, 40, 0],
    // en lugar de columns directo, usamos stack
    stack: [
      {
        // ─── el bloque original de columnas ───
        columnGap: 25,
        columns: [
          {
            width: '*',
            stack: [signatureBlock('Despachado Por:'), ...paymentStack],
          },
          {
            width: '*',
            stack: [
              signatureBlock('Recibido Conforme:', d.copyType || 'COPIA'),
            ],
          },
          {
            width: '*',
            margin: [0, 8, 0, 0],
            table: {
              widths: ['*', '*'],
              body: totalsBody,
            },
            layout: 'noBorders',
          },
        ],
      },

      // ─── Insertamos después, si existen, los comentarios ───
      ...(d.invoiceComment
        ? [{ text: d.invoiceComment, margin: [0, 8, 0, 0] }]
        : []),
      ...(biz?.invoice?.invoiceMessage
        ? [{ text: biz.invoice.invoiceMessage, margin: [0, 4, 0, 0] }]
        : []),
    ],
  });
}
