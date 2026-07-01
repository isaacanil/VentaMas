import { describe, expect, it } from 'vitest';

import { normalizeSaleUnitsChangeForModal } from './useGeneralProductForm.helpers';

describe('normalizeSaleUnitsChangeForModal', () => {
  it('usa allValues para no perder filas completas cuando Form.List emite cambios parciales', () => {
    const result = normalizeSaleUnitsChangeForModal(
      {
        saleUnits: [
          {
            pricing: {
              listPrice: 250,
            },
          },
        ],
      } as any,
      {
        saleUnits: [
          {
            id: 'box',
            unitName: 'Caja',
            conversionFactorToBase: 12,
            pricing: {
              listPrice: 250,
            },
            barcode: '123',
            active: true,
          },
          {
            id: 'half',
            unitName: 'Media libra',
            conversionFactorToBase: 0.5,
            allowFractional: true,
            pricing: {
              listPrice: 40,
            },
            active: true,
          },
        ],
      } as any,
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'box',
      unitName: 'Caja',
      conversionFactorToBase: 12,
      quantity: 12,
      barcode: '123',
      active: true,
    });
    expect(result[1]).toMatchObject({
      id: 'half',
      unitName: 'Media libra',
      conversionFactorToBase: 0.5,
      quantity: 0.5,
      allowFractional: true,
    });
  });
});
