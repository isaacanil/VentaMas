import type { InvoiceBusinessInfo } from '@/types/invoice';
import type { QuotationData } from '@/pdf/invoicesAndQuotation/types';

// src/utils/layoutCalculators.js
export function calcHeaderHeight(
  biz: InvoiceBusinessInfo | null | undefined,
  d: QuotationData | null | undefined,
): number {
  let lines = 0;
  if (biz?.logoUrl) lines++;
  lines++; // nombre
  if (biz?.address) lines++;
  if (biz?.tel) lines++;
  if (biz?.email) lines++;
  if (biz?.rnc) lines++;

  lines++; // COTIZACIÓN
  lines++; // Fecha
  lines++; // No
  if (d?.expirationDate) lines++;

  if (d?.client?.name || d?.client?.address) lines++;
  if (d?.client?.tel || d?.client?.personalID) lines++;
  //   if (d?.comprobante)                      lines++

  const lineH = 20;
  return lines * lineH + 16 * 2;
}

export function calcFooterHeight(d: QuotationData | null | undefined): number {
  let rows = 3; // Sub-Total, ITBIS, Total
  if (d?.discount?.value) rows++;
  if (d?.delivery?.status) rows++;
  const rowH = 16;
  return rows * rowH + 16 * 2;
}
