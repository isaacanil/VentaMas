import { describe, expect, it } from 'vitest';

import { initialState } from '../default/default';
import { updateAllTotals } from './updateAllTotals';

const buildState = () => structuredClone(initialState);

describe('updateAllTotals', () => {
  it('calculates subtotal, taxes, total, payment and change for a regular sale', () => {
    const state = buildState();
    state.settings.taxReceipt.enabled = true;
    state.settings.fiscal.taxationEnabled = true;
    state.data.products = [
      {
        id: 'product-1',
        cid: 'product-1',
        name: 'Producto demo',
        amountToBuy: 2,
        pricing: {
          currency: 'DOP',
          listPrice: 100,
          price: 100,
          tax: 18,
        },
        cost: {
          total: 0,
        },
      },
    ] as never;

    updateAllTotals(state, 250);

    expect(state.data.totalPurchaseWithoutTaxes.value).toBe(200);
    expect(state.data.totalTaxes.value).toBe(36);
    expect(state.data.totalPurchase.value).toBe(236);
    expect(state.data.totalShoppingItems.value).toBe(2);
    expect(state.data.payment.value).toBe(250);
    expect(state.data.change.value).toBe(14);
    expect(state.data.mixedCurrencySale).toBe(false);
  });

  it('calculates subtotal, taxes and total using weight for weighted products', () => {
    const state = buildState();
    state.settings.taxReceipt.enabled = true;
    state.settings.fiscal.taxationEnabled = true;
    state.data.products = [
      {
        id: 'weighted-1',
        cid: 'weighted-1',
        name: 'Cilantro por libra',
        amountToBuy: 1,
        weightDetail: {
          isSoldByWeight: true,
          weight: 2.5,
          weightUnit: 'lb',
        },
        pricing: {
          currency: 'DOP',
          listPrice: 30,
          price: 30,
          tax: 18,
        },
        cost: {
          total: 0,
        },
      },
    ] as never;

    updateAllTotals(state);

    expect(state.data.totalPurchaseWithoutTaxes.value).toBe(75);
    expect(state.data.totalTaxes.value).toBe(13.5);
    expect(state.data.totalPurchase.value).toBe(88.5);
    expect(state.data.totalShoppingItems.value).toBe(1);
  });

  it('applies individual discounts to weighted products before tax', () => {
    const state = buildState();
    state.settings.taxReceipt.enabled = true;
    state.settings.fiscal.taxationEnabled = true;
    state.data.products = [
      {
        id: 'weighted-discount-1',
        cid: 'weighted-discount-1',
        name: 'Queso por libra',
        amountToBuy: 1,
        weightDetail: {
          isSoldByWeight: true,
          weight: 2.5,
          weightUnit: 'lb',
        },
        pricing: {
          currency: 'DOP',
          listPrice: 100,
          price: 100,
          tax: 18,
        },
        discount: {
          type: 'percentage',
          value: 10,
        },
        cost: {
          total: 0,
        },
      },
    ] as never;

    updateAllTotals(state);

    expect(state.data.totalPurchaseWithoutTaxes.value).toBe(225);
    expect(state.data.totalTaxes.value).toBe(40.5);
    expect(state.data.totalPurchase.value).toBe(265.5);
    expect(state.data.totalShoppingItems.value).toBe(1);
  });

  it('forces the functional currency when the sale mixes currencies and uses active payment methods', () => {
    const state = buildState();
    state.settings.taxReceipt.enabled = true;
    state.settings.fiscal.taxationEnabled = true;
    state.data.documentCurrency = 'USD';
    state.data.functionalCurrency = 'DOP';
    state.data.paymentMethod = [
      {
        method: 'cash',
        value: 500,
        status: true,
      },
      {
        method: 'card',
        value: 50,
        status: false,
      },
    ];
    state.data.products = [
      {
        id: 'product-dop',
        cid: 'product-dop',
        name: 'Producto DOP',
        amountToBuy: 1,
        pricing: {
          currency: 'DOP',
          listPrice: 100,
          price: 100,
          tax: 18,
        },
        cost: {
          total: 0,
        },
      },
      {
        id: 'product-usd',
        cid: 'product-usd',
        name: 'Producto USD',
        amountToBuy: 1,
        pricing: {
          currency: 'USD',
          listPrice: 10,
          price: 10,
          tax: 18,
        },
        monetary: {
          documentCurrency: 'USD',
          functionalCurrency: 'DOP',
          exchangeRate: 60,
          originalUnitPrice: 10,
          functionalUnitPrice: 600,
          source: 'settings-manual-sale',
          effectiveAt: 1,
        },
        cost: {
          total: 0,
        },
      },
    ] as never;

    updateAllTotals(state);

    expect(state.data.functionalCurrency).toBe('DOP');
    expect(state.data.documentCurrency).toBe('DOP');
    expect(state.data.mixedCurrencySale).toBe(true);
    expect(state.data.payment.value).toBe(500);
    expect(state.data.totalPurchase.value).toBe(826);
  });
});
