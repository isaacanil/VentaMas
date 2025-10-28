import { formatDate } from '../utils/formatters.js';

import { buildClientBlock } from './clientBlock.js';
import { resolveDocumentIdentity } from '../../../../../../utils/invoice/documentIdentity.js';

const CLIENT_BLOCK_MIN_HEIGHT = 70;

/* ──────────────────────────────────────────────── */
export function buildHeader(biz, d, images) {
  return () => {
    const clientBlock = buildClientBlock(d);
    const {
      title: comprobanteTitle,
      label: comprobanteLabel,
      value: comprobanteValue,
      type: comprobanteType
    } = resolveDocumentIdentity(d);
    const referenceLabel = comprobanteType === 'preorder'
      ? 'Preventa'
      : comprobanteTitle || 'Factura';
    const referenceValue = comprobanteType === 'preorder'
      ? (comprobanteValue || d.preorderDetails?.numberID || d.numberID || '-')
      : (d.numberID || '-');
     

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

    /* columna derecha (datos de la factura / recibo) */
    const rightStack = [
      {
        text: comprobanteTitle,
        style: 'title',
        alignment: 'right'
      },
      d.date && {
        text: `Fecha: ${formatDate(d.date)}`,
        style: 'headerInfo',
        alignment: 'right'
      },
      comprobanteLabel && comprobanteType !== 'preorder' && {
        text: `${comprobanteLabel}: ${comprobanteValue || '-'}`,
        style: 'headerInfo',
        alignment: 'right',
        bold: true
      },
      {
        text: `${referenceLabel} # ${referenceValue}`,
        style: 'headerInfo',
        alignment: 'right',
        bold: true
      },
      d.type === 'preorder' && d.preorderDetails?.date && {
        text: `Fecha de Pedido: ${formatDate(d.preorderDetails.date)}`,
        style: 'headerInfo',
        alignment: 'right'
      },
      d.dueDate && {
        text: `Vence: ${formatDate(d.dueDate)}`,
        style: 'headerInfo',
        alignment: 'right',
        bold: true
      }
    ].filter(Boolean);

    const rows = [];    /* fila del logo */
    if (images.logo) {
      rows.push([{
        image: 'logo',
        width: 120,
        margin: [0, 0, 0, 8],
        colSpan: 2,
        width: 200,
        height: 80, // Altura fija
        fit: [200, 80]
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
    ]);    /* separador horizontal */
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
    ]);    /* bloque de cliente (si existe) */
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
          minHeight: CLIENT_BLOCK_MIN_HEIGHT,
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
