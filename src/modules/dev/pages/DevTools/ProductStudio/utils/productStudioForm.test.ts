import { describe, expect, it } from 'vitest';

import {
  getChangedProductPatch,
  hasBusinessId,
  hasUserUid,
  isFormValidationError,
  normalizePricingForForm,
  normalizePricingForUpdate,
  normalizeProductForStudioSubmit,
} from './productStudioForm';

describe('productStudioForm guards', () => {
  it('accepts only records with clean user and business identifiers', () => {
    expect(hasBusinessId({ businessID: ' business-1 ' })).toBe(true);
    expect(hasBusinessId({ businessID: '   ' })).toBe(false);
    expect(hasBusinessId([])).toBe(false);

    expect(hasUserUid({ uid: ' user-1 ' })).toBe(true);
    expect(hasUserUid({ uid: '' })).toBe(false);
    expect(hasUserUid(null)).toBe(false);
  });

  it('detects form validation errors without accepting arbitrary objects', () => {
    expect(isFormValidationError({ errorFields: [] })).toBe(true);
    expect(isFormValidationError({ errorFields: null })).toBe(false);
    expect(isFormValidationError('error')).toBe(false);
  });

  it('ignores array payloads when building object patches', () => {
    expect(
      getChangedProductPatch({
        key: 'warranty',
        product: { warranty: { enabled: true } } as never,
        value: ['not-a-warranty-object'],
      }),
    ).toEqual({
      warranty: { enabled: true },
    });
  });

  it('preserves supported product pricing currency through form and update normalization', () => {
    expect(
      normalizePricingForForm({
        currency: 'USD',
        avgPrice: 12,
        cost: 8,
        listPrice: 15,
        tax: '18',
      }),
    ).toEqual({
      currency: 'USD',
      cost: 8,
      listPrice: 15,
      tax: 18,
      midPrice: 12,
    });

    expect(
      normalizePricingForUpdate({
        currency: 'USD',
        cost: '8',
        listPrice: '15',
        midPrice: '12',
        tax: '18',
      }),
    ).toEqual({
      currency: 'USD',
      tax: 18,
      avgPrice: 12,
      cost: 8,
      listPrice: 15,
      price: 15,
    });
  });

  it('keeps ProductStudio list price as the operational price when a stale zero price is present', () => {
    expect(
      normalizePricingForUpdate({
        currency: 'DOP',
        cost: '9',
        listPrice: '15',
        price: 0,
        tax: 0,
      } as never),
    ).toEqual({
      currency: 'DOP',
      tax: 0,
      cost: 9,
      listPrice: 15,
      price: 15,
    });
  });

  it('repairs stale operational price before ProductStudio submit', () => {
    expect(
      normalizeProductForStudioSubmit({
        name: 'Codex prueba',
        pricing: {
          currency: 'DOP',
          cost: 9,
          price: 0,
          listPrice: 15,
          tax: 0,
        },
      })?.pricing,
    ).toEqual({
      currency: 'DOP',
      tax: 0,
      cost: 9,
      listPrice: 15,
      price: 15,
    });
  });

  it('defaults ProductStudio pricing currency to DOP when the value is missing or unsupported', () => {
    expect(normalizePricingForForm({ currency: 'EUR', tax: 0 })?.currency).toBe(
      'DOP',
    );
    expect(normalizePricingForUpdate({ tax: 0 }).currency).toBe('DOP');
  });
});
