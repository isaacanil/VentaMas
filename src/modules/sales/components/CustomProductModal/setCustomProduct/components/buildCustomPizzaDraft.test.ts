import { describe, expect, it, vi } from 'vitest';

import {
  buildCustomPizzaDraft,
  EMPTY_CUSTOM_PIZZA_DRAFT,
} from './buildCustomPizzaDraft';

describe('buildCustomPizzaDraft', () => {
  it('builds a selected pizza draft with the calculated price and size', () => {
    const createId = vi.fn(() => 'pizza-123');

    const draft = buildCustomPizzaDraft({
      productName: 'pizza custom',
      calculatedPrice: 525,
      size: 'large',
      createId,
    });

    expect(draft).toEqual({
      ...EMPTY_CUSTOM_PIZZA_DRAFT,
      id: 'pizza-123',
      name: 'pizza custom',
      pricing: {
        cost: 0,
        price: 525,
        tax: 0,
      },
      size: 'large',
    });
    expect(createId).toHaveBeenCalledOnce();
  });

  it('keeps the existing id and pricing metadata when rebuilding a draft', () => {
    const createId = vi.fn(() => 'unused-id');

    const draft = buildCustomPizzaDraft({
      currentDraft: {
        ...EMPTY_CUSTOM_PIZZA_DRAFT,
        id: 'existing-id',
        amountToBuy: 2,
        name: 'old pizza',
        pricing: {
          cost: 175,
          price: 300,
          tax: 18,
        },
        size: 'small',
      },
      productName: 'updated pizza',
      calculatedPrice: 650,
      size: 'medium',
      createId,
    });

    expect(draft).toEqual({
      id: 'existing-id',
      amountToBuy: 2,
      name: 'updated pizza',
      pricing: {
        cost: 175,
        price: 650,
        tax: 18,
      },
      size: 'medium',
    });
    expect(createId).not.toHaveBeenCalled();
  });

  it('clears product identity and price when no product is selected', () => {
    const createId = vi.fn(() => 'unused-id');

    const draft = buildCustomPizzaDraft({
      currentDraft: {
        ...EMPTY_CUSTOM_PIZZA_DRAFT,
        id: 'existing-id',
        name: 'old pizza',
        pricing: {
          cost: 125,
          price: 375,
          tax: 12,
        },
      },
      productName: '',
      calculatedPrice: 450,
      size: 'medium',
      createId,
    });

    expect(draft).toEqual({
      ...EMPTY_CUSTOM_PIZZA_DRAFT,
      name: '',
      id: '',
      pricing: {
        cost: 125,
        price: 0,
        tax: 12,
      },
      size: 'medium',
    });
    expect(createId).not.toHaveBeenCalled();
  });
});
