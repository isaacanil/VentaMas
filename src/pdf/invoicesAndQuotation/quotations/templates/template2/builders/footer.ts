import {
  getDiscount,
  money,
  getProductsIndividualDiscounts,
  hasIndividualDiscounts,
} from '../utils/formatters.js';

import type { PdfHeaderFooter } from '@/pdf/types';
import type { QuotationData } from '@/pdf/invoicesAndQuotation/types';

export function buildFooter(d: QuotationData): PdfHeaderFooter {
  /* Calcular descuentos */
  const individualDiscounts = getProductsIndividualDiscounts(d.products || []);
  const hasIndividualDisc = hasIndividualDiscounts(d.products || []);
  const generalDiscount = hasIndividualDisc ? 0 : getDiscount(d);

  return (_current, _total) => ({
    margin: [40, 0, 40, 0],
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        table: {
          body: [
            [
              'Sub-Total:',
              {
                text: money(d.totalPurchaseWithoutTaxes?.value ?? 0),
                style: 'totalsValue',
              },
            ],
            [
              'ITBIS:',
              { text: money(d.totalTaxes?.value ?? 0), style: 'totalsValue' },
            ],
            !hasIndividualDisc &&
            d.discount?.value && [
              'Descuento General:',
              { text: `-${money(generalDiscount)}`, style: 'totalsValue' },
            ],
            hasIndividualDisc && [
              'Descuentos Productos:',
              { text: `-${money(individualDiscounts)}`, style: 'totalsValue' },
            ],
            d.delivery?.status && [
              'Delivery:',
              { text: money(d.delivery?.value ?? 0), style: 'totalsValue' },
            ],
            [
              { text: 'Total:', style: 'totalsLabel' },
              {
                text: money(d.totalPurchase?.value ?? 0),
                style: 'totalsValue',
              },
            ],
          ].filter(Boolean),
        },
        layout: 'noBorders',
      },
    ],
  });
}
