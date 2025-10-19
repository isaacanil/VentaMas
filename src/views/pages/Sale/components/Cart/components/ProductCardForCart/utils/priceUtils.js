import {
  getListPriceTotal,
  getAvgPriceTotal,
  getMinPriceTotal
} from '../../../../../../../../utils/pricing';

export function extraerPreciosConImpuesto(pricing, taxReceiptEnabled = true) {
  const { listPrice, avgPrice, minPrice } = pricing || {};

  const preciosConImpuesto = [
    {
      label: 'Precio de Lista',
      value: listPrice || 'N/A',
      valueWithTax: getListPriceTotal({ pricing }, taxReceiptEnabled),
      pricing,
      type: 'listPrice',
      enabled: pricing?.listPriceEnabled ?? true
    },
    {
      label: 'Precio Promedio',
      value: avgPrice || 'N/A',
      valueWithTax: getAvgPriceTotal({ pricing }, taxReceiptEnabled),
      type: 'avgPrice',
      pricing,
      enabled: pricing?.avgPriceEnabled ?? true
    },
    {
      label: 'Precio Mínimo',
      value: minPrice || 'N/A',
      valueWithTax: getMinPriceTotal({ pricing }, taxReceiptEnabled),
      type: 'minPrice',
      pricing,
      enabled: pricing?.minPriceEnabled ?? true
    }
  ];
  return preciosConImpuesto;
}
