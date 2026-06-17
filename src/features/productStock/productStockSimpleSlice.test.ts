import { describe, expect, it } from 'vitest';

import reducer, {
  closeProductStockSimple,
  openProductStockSimple,
} from './productStockSimpleSlice';

describe('productStockSimpleSlice', () => {
  it('opens with the legacy product payload', () => {
    const state = reducer(
      undefined,
      openProductStockSimple({
        id: 'product-1',
        name: 'Ace',
      }),
    );

    expect(state).toEqual(
      expect.objectContaining({
        isOpen: true,
        productId: 'product-1',
        product: expect.objectContaining({ id: 'product-1' }),
        initialStocks: [],
        initialStocksProductId: '',
      }),
    );
  });

  it('stores initial stocks for the opened product and clears them on close', () => {
    const opened = reducer(
      undefined,
      openProductStockSimple({
        product: {
          id: 'product-1',
          name: 'Ace',
        },
        initialStocks: [
          {
            id: 'stock-1',
            productId: 'product-1',
            quantity: 5,
          },
        ],
      }),
    );

    expect(opened.initialStocks).toHaveLength(1);
    expect(opened.initialStocksProductId).toBe('product-1');

    const closed = reducer(opened, closeProductStockSimple());

    expect(closed).toEqual(
      expect.objectContaining({
        isOpen: false,
        productId: '',
        product: null,
        initialStocks: [],
        initialStocksProductId: '',
      }),
    );
  });
});
