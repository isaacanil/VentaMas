import { describe, expect, it } from 'vitest';

import {
  getChangedProductPatch,
  hasBusinessId,
  hasUserUid,
  isFormValidationError,
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
});
