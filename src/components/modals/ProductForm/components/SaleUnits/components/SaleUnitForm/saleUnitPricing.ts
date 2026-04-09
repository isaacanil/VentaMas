import type { PriceCardRow, SaleUnitPricingInput } from './types';

const resolveTaxValue = (value: SaleUnitPricingInput['tax']) => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (typeof value === 'object' && 'tax' in value) {
    const inner = (value as { tax?: number | string }).tax;
    return typeof inner === 'number' ? inner : Number(inner) || 0;
  }
  return 0;
};

export const buildPriceCards = (values: {
  pricing?: Partial<SaleUnitPricingInput>;
}) => {
  const { pricing = {} } = values;
  const {
    tax = 0,
    cost = 0,
    listPrice = 0,
    avgPrice = 0,
    minPrice = 0,
    listPriceEnabled = false,
    avgPriceEnabled = false,
    minPriceEnabled = false,
  } = pricing;

  const calculateRow = (price: number) => {
    const taxRate = resolveTaxValue(tax) / 100;
    const itbis = price * taxRate;
    const total = price + itbis;
    const margin = total - cost;
    const percentBenefits = total > 0 ? (margin / total) * 100 : 0;

    return {
      precioSinItbis: price.toFixed(2),
      itbis: itbis.toFixed(2),
      total: total.toFixed(2),
      margen: margin.toFixed(2),
      porcentajeGanancia: `${percentBenefits.toFixed(0)}%`,
    };
  };

  const rows: PriceCardRow[] = [];
  if (listPriceEnabled) {
    rows.push({
      key: '1',
      tipoPrecio: 'Precio de Lista',
      ...calculateRow(listPrice),
    });
  }
  if (avgPriceEnabled) {
    rows.push({
      key: '2',
      tipoPrecio: 'Precio Promedio',
      ...calculateRow(avgPrice),
    });
  }
  if (minPriceEnabled) {
    rows.push({
      key: '3',
      tipoPrecio: 'Precio Minimo',
      ...calculateRow(minPrice),
    });
  }

  return rows;
};
