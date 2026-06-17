import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PRODUCT_ITEM_TYPE,
  PRODUCT_ITEM_TYPE_OPTIONS,
  convertTimeToSpanish,
  initTaxes,
  taxLabel,
} from './productDefaults';

describe('productDefaults', () => {
  it('expone opciones de tipo de item y default canonico', () => {
    expect(PRODUCT_ITEM_TYPE_OPTIONS).toEqual([
      { value: 'product', label: 'Producto' },
      { value: 'service', label: 'Servicio' },
      { value: 'combo', label: 'Combo' },
    ]);
    expect(DEFAULT_PRODUCT_ITEM_TYPE).toBe('product');
  });

  it('convierte unidades de garantia conocidas a español', () => {
    expect(convertTimeToSpanish(1, 'day')).toBe('1 día');
    expect(convertTimeToSpanish(2, 'days')).toBe('2 días');
    expect(convertTimeToSpanish('3', 'weeks')).toBe('3 semanas');
    expect(convertTimeToSpanish(4, 'month')).toBe('4 mes');
    expect(convertTimeToSpanish(5, 'years')).toBe('5 años');
  });

  it('documenta la pluralidad actual segun la unidad recibida', () => {
    expect(convertTimeToSpanish(1, 'days')).toBe('1 días');
    expect(convertTimeToSpanish(2, 'day')).toBe('2 día');
  });

  it('usa fallback cuando la unidad no se reconoce', () => {
    expect(convertTimeToSpanish(1, 'hours')).toBe('Unidad no reconocida');
    expect(convertTimeToSpanish(1, '')).toBe('Unidad no reconocida');
  });

  it('convierte cantidades invalidas a cero conservando la unidad conocida', () => {
    expect(convertTimeToSpanish('abc', 'months')).toBe('0 meses');
    expect(convertTimeToSpanish(Number.NaN, 'year')).toBe('0 año');
  });

  it('mapea etiquetas de impuestos y conserva el fallback exento', () => {
    expect(initTaxes).toEqual([0, 16, 18]);
    expect(taxLabel(0)).toBe('Exento');
    expect(taxLabel(16)).toBe('IVA 16%');
    expect(taxLabel(18)).toBe('IVA 18%');
    expect(taxLabel(12)).toBe('Exento');
  });
});
