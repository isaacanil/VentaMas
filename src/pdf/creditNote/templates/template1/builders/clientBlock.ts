import type { PdfColumnsBlock, PdfContent } from '@/pdf/types';
import type { CreditNoteData } from '../../../types.js';

export function buildClientBlock(d: CreditNoteData): PdfColumnsBlock | null {
  const rawName = d.client?.name?.trim() || '';
  const esGenerico = !rawName || rawName.toLowerCase() === 'generic client';
  const name = esGenerico ? 'Cliente Genérico' : rawName;

  const left: PdfContent[] = [
    {
      text: [
        { text: 'Cliente:  ', bold: true },
        { text: name, color: '#111' },
      ],
      style: 'headerInfo',
    },
    ...(!esGenerico && d.client?.address?.trim()
      ? [
          {
            text: [
              { text: 'Dirección:  ', bold: true },
              { text: d.client.address.trim(), color: '#111' },
            ],
            style: 'headerInfo',
          },
        ]
      : []),
  ];

  const right: PdfContent[] = [
    ...(!esGenerico && d.client?.tel?.trim()
      ? [
          {
            text: [
              { text: 'Tel:  ', bold: true },
              { text: d.client.tel.trim(), color: '#111' },
            ],
            style: 'headerInfo',
            noWrap: true,
          },
        ]
      : []),
    ...(!esGenerico && (d.client?.rnc?.trim() || d.client?.personalID?.trim())
      ? [
          {
            text: [
              { text: 'RNC cliente:  ', bold: true },
              {
                text: (d.client.rnc || d.client.personalID).trim(),
                color: '#111',
              },
            ],
            style: 'headerInfo',
            noWrap: true,
          },
        ]
      : []),
  ];

  if (!left.length && !right.length) return null;

  return {
    columns: [
      { width: '*', stack: left },
      { width: 'auto', stack: right },
    ],
  };
}
