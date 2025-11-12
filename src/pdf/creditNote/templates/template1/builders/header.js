import { formatDate } from '../utils/formatters.js';

import { buildClientBlock } from './clientBlock.js';

/* ───── utilitario título/etiqueta para notas de crédito ───── */
function getComprobanteInfo(ncf) {
  if (!ncf) return { title: 'NOTA DE CRÉDITO', label: 'Número de Nota' };
  if (ncf.startsWith('B04')) return { title: 'NOTA DE CRÉDITO FISCAL', label: 'NCF' };
  return { title: 'NOTA DE CRÉDITO', label: 'NCF' };
}

/* ──────────────────────────────────────────────── */
export function buildHeader(biz, d, images) {
  return () => {
    const clientBlock = buildClientBlock(d);
    const { title: comprobanteTitle, label: comprobanteLabel } =
      getComprobanteInfo(d.ncf);

    /* columna izquierda (datos del negocio) */
    const leftStack = [
      {
        text: biz.name,
        style: 'title'
      },
      biz.address && {
        text: biz.address,
        style: 'headerInfo'
      },
      biz.tel && {
        text: `Tel: ${biz.tel}`,
        style: 'headerInfo'
      },
      biz.email && {
        text: biz.email,
        style: 'headerInfo'
      },
      biz.rnc && {
        text: `RNC: ${biz.rnc}`,
        style: 'headerInfo',
        bold: true
      }
    ].filter(Boolean);

    /* columna derecha (datos de la nota de crédito) */
    const rightStack = [
      {
        text: comprobanteTitle,
        style: 'title',
        alignment: 'right'
      },
      {
        text: `Fecha: ${formatDate(d.createdAt)}`,
        style: 'headerInfo',
        alignment: 'right'
      },
      {
        text: `${comprobanteLabel}: ${d.ncf || '-'}`,
        style: 'headerInfo',
        alignment: 'right',
        bold: true
      },
      d.number && {
        text: `Ref: ${d.number}`,
        style: 'headerInfo',
        alignment: 'right'
      },
      d.invoiceNcf && {
        text: `NCF Afectado: ${d.invoiceNcf}`,
        style: 'headerInfo',
        alignment: 'right',
        bold: true,
        color: '#d32f2f'
      }
    ].filter(Boolean);

    const rows = [];

    /* fila del logo */
    if (images.logo) {
      rows.push([{
        image: 'logo',
        margin: [0, 0, 0, 8],
        colSpan: 2,
        width: 200,
        height: 80, // Altura fija
        fit: [140, 80]
      },
      {}
      ]);
    }

    /* fila con columnas de datos */
    rows.push([
      {
        columns: [
          { width: '*', stack: leftStack },
          { width: 'auto', stack: rightStack }
        ],
        colSpan: 2
      },
      {}
    ]);

    /* separador horizontal */
    rows.push([
      {
        canvas: [{
          type: 'line',
          x1: 0, y1: 0,
          x2: 530, y2: 0, // Ajustado de 545 a 530
          lineWidth: 0.3,
          lineColor: '#cccccc'
        }], colSpan: 2,
        margin: [0, 4, 0, 6]
      },
      {}
    ]);

    /* bloque de cliente (si existe) */
    if (clientBlock) {
      rows.push([
        {
        columns: [
            {
                width: '*',
              stack: clientBlock.columns[0].stack
            },
            {
              width: 'auto',
              stack: clientBlock.columns[1].stack
            }
          ],
          columnGap: 10,
          colSpan: 2,
          margin: [0, 3, 0, 6]
        },
        {}
      ]);
    }

    return {
      margin: [32, 12, 32, 0],
      table: { widths: ['*', '*'], body: rows },
      layout: 'noBorders'
    };
}; 
} 