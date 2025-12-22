import { money, getProductIndividualDiscount } from '../utils/formatters.js';

export function buildContent(d) {
  /* cabecera de la tabla */
  const headerRow = [
    'CANT',
    'CODIGO',
    'DESCRIPCIÓN',
    'PRECIO',
    'ITBIS',
    'TOTAL',
  ].map((t) => ({
    text: t,
    style: 'tableHeader',
    fillColor: '#4a4a4a',
    alignment: 'center',
    noWrap: true,
  }));

  /* cuerpo */
  const body = [
    headerRow,
    ...(d && Array.isArray(d.products) ? d.products : []).flatMap((p) => {
      const price = +p.pricing?.price || 0;
      const taxP = +p.pricing?.tax || 0; // porcentaje
      const tax = price * (taxP / 100);
      const tot = (price + tax) * (+p.amountToBuy || 0);

      const productRow = [
        { text: p.amountToBuy, alignment: 'center' },
        p.barcode || '-',
        p.name,
        { text: money(price), alignment: 'right' },
        { text: money(tax), alignment: 'right' },
        { text: money(tot), alignment: 'right' },
      ];

      const extraRows = [];

      /* línea extra para descuento individual */
      if (p.discount && p.discount.value > 0) {
        const discountAmount = getProductIndividualDiscount(p);
        const discountType =
          p.discount.type === 'percentage'
            ? `${p.discount.value}%`
            : 'Monto fijo';
        extraRows.push([
          {
            text: `Descuento: -${money(discountAmount)} (${discountType})`,
            colSpan: 6,
            color: '#52c41a',
            bold: true,
            margin: [0, 1, 0, 1],
          },
          {},
          {},
          {},
          {},
          {},
        ]);
      }

      /* línea extra para comentarios del producto */
      if (p.comment) {
        extraRows.push([
          {
            text: p.comment,
            colSpan: 6,
            margin: [0, 1, 0, 3],
            preserveLeadingSpaces: true,
          },
          {},
          {},
          {},
          {},
          {},
        ]);
      }

      return [productRow, ...extraRows];
    }),
  ];

  return [
    {
      margin: [0, 12, 0, 0],
      table: { headerRows: 1, widths: [40, 55, '*', 55, 55, 55], body },
      layout: {
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
      },
    },
  ];
}
