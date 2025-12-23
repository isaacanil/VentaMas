import {
  getListPriceTotal,
  getAvgPriceTotal,
  getMinPriceTotal,
  getCardPriceTotal,
  getOfferPriceTotal,
} from '@/utils/pricing';

export function extraerPreciosConImpuesto(pricing, taxReceiptEnabled = true) {
  const { listPrice, avgPrice, minPrice, cardPrice, offerPrice } =
    pricing || {};

  const preciosConImpuesto = [
    {
      label: 'Precio de Lista',
      value: listPrice || 'N/A',
      valueWithTax: getListPriceTotal({ pricing }, taxReceiptEnabled),
      pricing,
      type: 'listPrice',
      enabled: pricing?.listPriceEnabled ?? true,
    },
    {
      label: 'Precio Promedio',
      value: avgPrice || 'N/A',
      valueWithTax: getAvgPriceTotal({ pricing }, taxReceiptEnabled),
      type: 'avgPrice',
      pricing,
      enabled: pricing?.avgPriceEnabled ?? true,
    },
    {
      label: 'Precio Mínimo',
      value: minPrice || 'N/A',
      valueWithTax: getMinPriceTotal({ pricing }, taxReceiptEnabled),
      type: 'minPrice',
      pricing,
      enabled: pricing?.minPriceEnabled ?? true,
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
