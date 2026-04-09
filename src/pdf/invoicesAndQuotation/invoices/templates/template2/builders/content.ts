import {
  money,
  getProductIndividualDiscount,
  resolvePdfCurrency,
} from '../utils/formatters.js';

import type { PdfContent, PdfTableBody, PdfTableRow } from '@/pdf/types';
import type {
  InvoicePdfData,
  InvoicePdfProduct,
} from '@/pdf/invoicesAndQuotation/types';

const DEFAULT_BRAND = 'Sin marca';

/* ──────────────────────────────────────────────── */
export function buildContent(d: InvoicePdfData): PdfContent[] {
  const currency = resolvePdfCurrency(d);
  /* cabecera de la tabla */
  const headerRow: PdfTableRow = [
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
  const products: InvoicePdfProduct[] =
    d && Array.isArray(d.products) ? d.products : [];
  const body: PdfTableBody = [
    headerRow,
    ...products.flatMap((p) => {
      const price = +p.pricing?.price || 0;
      const taxP = +p.pricing?.tax || 0; // porcentaje
      const tax = price * (taxP / 100);
      const tot = (price + tax) * (+p.amountToBuy || 0);
      const brand = typeof p?.brand === 'string' ? p.brand.trim() : '';
      const hasBrand =
        brand && brand.toLowerCase() !== DEFAULT_BRAND.toLowerCase();
      const descriptionCell = hasBrand
        ? {
            stack: [
              { text: p.name || 'Producto sin nombre', margin: [0, 0, 0, 2] },
              { text: `Marca: ${brand}`, fontSize: 9, color: '#555555' },
            ],
          }
        : p.name || 'Producto sin nombre';

      const formatCurrencyCell = (value) => ({
        text: money(value, currency).replace('RD$', 'RD$\u00A0'),
        alignment: 'right',
        noWrap: true,
      });

      const productRow = [
        { text: p.amountToBuy, alignment: 'center', noWrap: true },
        { text: p.barcode || '-', alignment: 'left', noWrap: true },
        descriptionCell,
        formatCurrencyCell(price),
        formatCurrencyCell(tax),
        formatCurrencyCell(tot),
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
            text: `Descuento: -${money(discountAmount, currency)} (${discountType})`,
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
      table: { headerRows: 1, widths: [38, 90, '*', 72, 72, 72], body },
      layout: {
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
      },
    },
  ];
}
