import { describe, expect, it } from 'vitest';

import { shouldSelectZeroPriceInput } from '@/domain/products/priceInputFocus';
import { isUnsetOptionalPriceValue } from './pricingSectionValidation';

describe('ProductStudio PricingSection validation helpers', () => {
  it('treats zero optional prices as unset instead of invalid below-cost values', () => {
    expect(isUnsetOptionalPriceValue({}, 0)).toBe(true);
    expect(isUnsetOptionalPriceValue({}, '0')).toBe(true);
    expect(isUnsetOptionalPriceValue({}, '')).toBe(true);
    expect(isUnsetOptionalPriceValue({}, 12)).toBe(false);
  });

  it('keeps required prices subject to normal validation', () => {
    expect(isUnsetOptionalPriceValue({ required: true }, 0)).toBe(false);
  });

  it('selects only rendered zero values when a price input receives focus', () => {
    expect(shouldSelectZeroPriceInput('0')).toBe(true);
    expect(shouldSelectZeroPriceInput('0.00')).toBe(true);
    expect(shouldSelectZeroPriceInput(' 0 ')).toBe(true);
    expect(shouldSelectZeroPriceInput('9')).toBe(false);
    expect(shouldSelectZeroPriceInput('')).toBe(false);
  });
});
