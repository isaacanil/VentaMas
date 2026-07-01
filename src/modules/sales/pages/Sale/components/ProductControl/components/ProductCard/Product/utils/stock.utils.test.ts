import { describe, expect, it } from 'vitest';

import {
  isStockInsufficientForNextUnit,
  isStockExceeded,
  isStockLow,
  resolveRemainingStockForStatus,
  resolveRequestedBaseQuantity,
  shouldLabelStockAsBaseUnits,
} from './stock.utils';

describe('stock utils', () => {
  it('usa baseQuantity explicita antes de calcular la cantidad solicitada', () => {
    expect(resolveRequestedBaseQuantity({ baseQuantity: 2.5 } as any)).toBe(
      2.5,
    );
  });

  it('usa el peso como cantidad base para productos vendidos por peso', () => {
    expect(
      resolveRequestedBaseQuantity({
        weightDetail: { isSoldByWeight: true, weight: 1.25 },
      } as any),
    ).toBe(1.25);
  });

  it('convierte peso visible en libras a cantidad base antes de evaluar stock', () => {
    const product = {
      restrictSaleWithoutStock: true,
      stock: 1,
      weightDetail: {
        isSoldByWeight: true,
        weight: 3,
        weightUnit: 'lb',
      },
    } as any;

    expect(resolveRequestedBaseQuantity(product)).toBe(1.360777);
    expect(isStockInsufficientForNextUnit(product)).toBe(true);
  });

  it('calcula cantidad base desde presentacion seleccionada', () => {
    expect(
      resolveRequestedBaseQuantity({
        amountToBuy: 2,
        selectedSaleUnit: { conversionFactorToBase: 12 },
      } as any),
    ).toBe(24);
  });

  it('evalua stock bajo y exceso con cantidad base', () => {
    const product = {
      restrictSaleWithoutStock: true,
      stock: 30,
      amountToBuy: 2,
      selectedSaleUnit: { conversionFactorToBase: 12 },
    } as any;

    expect(resolveRemainingStockForStatus(true, product)).toBe(6);
    expect(isStockLow(product, 10)).toBe(true);
    expect(isStockExceeded(true, product)).toBe(false);
    expect(
      isStockExceeded(true, {
        ...product,
        amountToBuy: 3,
      }),
    ).toBe(true);
  });

  it('marca una presentacion completa como insuficiente si el stock base no alcanza', () => {
    expect(
      isStockInsufficientForNextUnit({
        restrictSaleWithoutStock: true,
        stock: 10,
        amountToBuy: 1,
        selectedSaleUnit: { conversionFactorToBase: 12 },
      } as any),
    ).toBe(true);

    expect(
      isStockInsufficientForNextUnit({
        restrictSaleWithoutStock: true,
        stock: 10,
        amountToBuy: 1,
        selectedSaleUnit: null,
      } as any),
    ).toBe(false);
  });

  it('marca stock visible como unidades base cuando es una presentacion derivada', () => {
    expect(
      shouldLabelStockAsBaseUnits({
        selectedSaleUnit: { conversionFactorToBase: 12 },
      } as any),
    ).toBe(true);

    expect(
      shouldLabelStockAsBaseUnits({
        selectedSaleUnit: { conversionFactorToBase: 1 },
      } as any),
    ).toBe(false);

    expect(shouldLabelStockAsBaseUnits({ selectedSaleUnit: null } as any)).toBe(
      false,
    );
  });
});
