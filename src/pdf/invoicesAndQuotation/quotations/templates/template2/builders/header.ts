// @ts-nocheck
import { formatDate } from '../utils/formatters.js';

import { buildClientBlock } from './clientBlock.js';

export function buildHeader(biz, d) {
  return () => {
    const clientBlock = buildClientBlock(d);

    const headerCols = [
      {
        width: '*',
        stack: [
          { text: biz.name, style: 'title' },
          biz.address && { text: biz.address, style: 'headerInfo' },
          biz.tel && { text: `Tel: ${biz.tel}`, style: 'headerInfo' },
          biz.email && { text: biz.email, style: 'headerInfo' },
          biz.rnc && { text: `RNC: ${biz.rnc}`, style: 'headerInfo' },
        ].filter(Boolean),
      },
      {
        width: 'auto',
        alignment: 'right',
        stack: [
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
        ].filter(Boolean),
      },
    ];

    const rows = [];

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
      rows.push([
        {
          columns: [
            { width: '*', stack: clientBlock.columns[0].stack },
            { width: '*', stack: clientBlock.columns[1].stack },
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
