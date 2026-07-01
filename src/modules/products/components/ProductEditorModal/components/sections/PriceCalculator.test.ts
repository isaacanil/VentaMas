import { describe, expect, it } from 'vitest';

import { getPriceRules } from './PriceCalculator.rules';

describe('ProductEditorModal PriceCalculator', () => {
  it('solo exige el precio lista contra el costo', () => {
    expect(
      getPriceRules({
        key: 'list',
        cost: 10,
        description: 'Precio Lista',
        name: ['pricing', 'listPrice'],
        amount: 0,
        required: true,
      }),
    ).toEqual([
      { required: true, message: 'Rellenar' },
      { type: 'number', min: 10, message: 'Minimo 10' },
    ]);
  });

  it('permite precios opcionales en cero sin forzarlos por encima del costo', () => {
    expect(
      getPriceRules({
        key: 'offer',
        cost: 10,
        description: 'Precio Oferta',
        name: ['pricing', 'offerPrice'],
        amount: 0,
      }),
    ).toEqual([{ type: 'number', min: 0, message: 'No puede ser negativo.' }]);
  });
});
