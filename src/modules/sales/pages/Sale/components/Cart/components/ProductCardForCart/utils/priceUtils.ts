import {
  getListPriceTotal,
  getAvgPriceTotal,
  getMinPriceTotal,
  getCardPriceTotal,
  getOfferPriceTotal,
} from '@/utils/pricing';

import type { ProductPricing } from '@/types/products';

export type PriceOption = {
  label: string;
  value: number | string;
  valueWithTax: number | string | null | undefined;
  pricing?: ProductPricing;
  type: string;
  enabled: boolean;
};

export function extraerPreciosConImpuesto(
  pricing?: ProductPricing | null,
  taxReceiptEnabled = true,
): PriceOption[] {
  const { listPrice, avgPrice, minPrice, cardPrice, offerPrice } =
    pricing || {};

  const preciosConImpuesto = [
    {
      label: 'Precio de Lista',
      value: listPrice || 'N/A',
      valueWithTax: getListPriceTotal({ pricing }, taxReceiptEnabled),
      pricing,
      type: 'listPrice',
      enabled: pricing?.listPriceEnable ?? true,
    },
    {
      label: 'Precio Promedio',
      value: avgPrice || 'N/A',
      valueWithTax: getAvgPriceTotal({ pricing }, taxReceiptEnabled),
      type: 'avgPrice',
      pricing,
      enabled: pricing?.avgPriceEnable ?? true,
    },
    {
      label: 'Precio Mínimo',
      value: minPrice || 'N/A',
      valueWithTax: getMinPriceTotal({ pricing }, taxReceiptEnabled),
      type: 'minPrice',
      pricing,
      enabled: pricing?.minPriceEnable ?? true,
    },
    {
      label: 'Precio Tarjeta',
      value: cardPrice || 'N/A',
      valueWithTax: getCardPriceTotal({ pricing }, taxReceiptEnabled),
      type: 'cardPrice',
      pricing,
      enabled: true,
    },
    {
      label: 'Precio Oferta',
      value: offerPrice || 'N/A',
      valueWithTax: getOfferPriceTotal({ pricing }, taxReceiptEnabled),
      type: 'offerPrice',
      pricing,
      enabled: true,
    },
  ];
  return preciosConImpuesto;
}
