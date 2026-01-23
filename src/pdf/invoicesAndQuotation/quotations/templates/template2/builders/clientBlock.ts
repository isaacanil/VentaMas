import type { PdfColumnsBlock, PdfContent } from '@/pdf/types';
import type { QuotationData } from '@/pdf/invoicesAndQuotation/types';

export function buildClientBlock(d: QuotationData): PdfColumnsBlock | null {
  const name =
    !d.client?.name || d.client.name.toLowerCase() === 'generic client'
      ? 'Cliente Genérico'
      : d.client.name;

  const left: PdfContent[] = [
    { text: `Cliente: ${name}`, style: 'headerInfo' },
  ];
  if (d.client?.address && name !== 'Cliente Genérico')
    left.push({ text: `Dirección: ${d.client.address}`, style: 'headerInfo' });

  const right: PdfContent[] = [];
  if (d.client?.tel && name !== 'Cliente Genérico')
    right.push({ text: `Tel: ${d.client.tel}`, style: 'headerInfo' });
  if (d.client?.personalID && name !== 'Cliente Genérico')
    right.push({
      text: `RNC cliente: ${d.client.personalID}`,
      style: 'headerInfo',
    });

  if (!left.length && !right.length) return null;

  return {
    columns: [
      { width: '*', stack: left },
      { width: '*', stack: right },
    ],
  };
}
