import { money } from '../utils/formatters.js';

export function buildContent(d) {
  const headerRow = [
    'CANT',
    'CODIGO',
    'DESCRIPCION',
    'PRECIO',
    'ITBIS',
    'TOTAL',
  ].map((t) => ({
    text: t,
    style: 'tableHeader',
    fillColor: '#4a4a4a',
    alignment: 'center',
  }));

  const body = [
    headerRow,
    ...d.products.flatMap((p) => {
      const price = p.pricing.price;
      const tax = price * (p.pricing.tax / 100);
      const tot = (price + tax) * p.amountToBuy;

      const productRow = [
        { text: p.amountToBuy, alignment: 'center' },
        p.barcode,
        p.name,
        { text: money(price), alignment: 'right' },
        { text: money(tax), alignment: 'right' },
        { text: money(tot), alignment: 'right' },
      ];

      if (p.comment) {
        return [
          productRow,
          [
            { text: p.comment, colSpan: 6, margin: [0, 2, 0, 4] },
            {},
            {},
            {},
            {},
            {},
          ],
        ];
      }

      return [productRow];
    }),
  ];

  return [
    {
      table: {
        headerRows: 1,
        widths: [30, 60, '*', 60, 60, 60],
        body,
      },
      layout: {
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
      },
    },
  ];
}
