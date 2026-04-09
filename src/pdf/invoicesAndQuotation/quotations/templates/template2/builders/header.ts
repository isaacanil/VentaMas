import { formatDate } from '../utils/formatters.js';

import { buildClientBlock } from './clientBlock.js';

import type { PdfContent, PdfHeaderFooter, PdfTableBody } from '@/pdf/types';
import type {
  InvoicePdfBusiness,
  QuotationData,
} from '@/pdf/invoicesAndQuotation/types';

const compact = <T>(items: Array<T | null | undefined | false>): T[] =>
  items.filter(Boolean) as T[];

export function buildHeader(
  biz: InvoicePdfBusiness,
  d: QuotationData,
): PdfHeaderFooter {
  return () => {
    const clientBlock = buildClientBlock(d);

    const headerCols = [
      {
        width: '*',
        stack: compact<PdfContent>([
          { text: biz.name, style: 'title' },
          biz.address && { text: biz.address, style: 'headerInfo' },
          biz.tel && { text: `Tel: ${biz.tel}`, style: 'headerInfo' },
          biz.email && { text: biz.email, style: 'headerInfo' },
          biz.rnc && { text: `RNC: ${biz.rnc}`, style: 'headerInfo' },
        ]),
      },
      {
        width: 'auto',
        alignment: 'right',
        stack: compact<PdfContent>([
          { text: 'Cotización', style: 'title', alignment: 'right' },
          {
            text: `Fecha: ${formatDate(d.date)}`,
            style: 'headerInfo',
            alignment: 'right',
          },
          {
            text: `No: ${d.numberID || '-'}`,
            style: 'headerInfo',
            alignment: 'right',
          },
          d.expirationDate && {
            text: `Vence: ${formatDate(d.expirationDate)}`,
            style: 'headerInfo',
            alignment: 'right',
          },
        ]),
      },
    ];

    const rows: PdfTableBody = [];

    if (biz.logo) {
      rows.push([
        { image: 'logo', width: 120, margin: [0, 0, 0, 8], colSpan: 2 },
        {},
      ]);
    }

    rows.push([{ columns: headerCols, colSpan: 2 }, {}]);

    rows.push([
      { text: '', style: 'separator', margin: [0, 8, 0, 8], colSpan: 2 },
      {},
    ]);

    if (clientBlock) {
      const [leftColumn, rightColumn] = clientBlock.columns;
      const leftStack = leftColumn?.stack ?? [];
      const rightStack = rightColumn?.stack ?? [];
      rows.push([
        {
          columns: [
            { width: '*', stack: leftStack },
            { width: '*', stack: rightStack },
          ],
          colSpan: 2,
        },
        {},
      ]);
    }

    return {
      margin: [40, 20, 40, 0],
      table: {
        widths: ['*', '*'],
        body: rows,
      },
      layout: 'noBorders',
    };
  };
}
