import { describe, expect, it } from 'vitest';

import {
  normalizeValidDominicanTaxId,
  validateDominicanTaxId,
} from './dominicanTaxId.util.js';

describe('dominicanTaxId.util', () => {
  it('validates RNC check digits', () => {
    expect(validateDominicanTaxId('132619201')).toMatchObject({
      digits: '132619201',
      isValid: true,
      kind: 'rnc',
    });
  });

  it('validates cedula check digits', () => {
    expect(validateDominicanTaxId('001-1391820-5')).toMatchObject({
      digits: '00113918205',
      isValid: true,
      kind: 'cedula',
    });
  });

  it('rejects 11 digit cedula values with a wrong check digit', () => {
    expect(validateDominicanTaxId('00201660332')).toMatchObject({
      digitCount: 11,
      digits: '00201660332',
      isValid: false,
      kind: 'cedula',
      reason: 'invalid-checksum',
    });
  });

  it('normalizes only valid Dominican tax ids', () => {
    expect(normalizeValidDominicanTaxId('00201660332')).toBeNull();
    expect(normalizeValidDominicanTaxId('00201660339')).toBe('00201660339');
  });
});
