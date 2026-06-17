import { describe, expect, it } from 'vitest';

import {
  getBusinessCountryFormOptions,
  getBusinessCountryPhoneCode,
  getBusinessSubdivisionLabel,
  getBusinessSubdivisionOptions,
  isBusinessSubdivisionValueSupported,
  normalizeBusinessCountryCode,
  normalizeBusinessSubdivisionForStorage,
} from './businessLocations';

describe('businessLocations', () => {
  it('exposes only the supported business countries for now', () => {
    expect(getBusinessCountryFormOptions()).toEqual([
      { id: 'do', name: 'República Dominicana' },
      { id: 've', name: 'Venezuela' },
    ]);
  });

  it('resolves Dominican province aliases to canonical stored values', () => {
    expect(normalizeBusinessCountryCode('RD')).toBe('do');
    expect(getBusinessSubdivisionLabel('do')).toBe('Provincia');
    expect(isBusinessSubdivisionValueSupported('do', 'San Cristóbal')).toBe(
      true,
    );
    expect(normalizeBusinessSubdivisionForStorage('do', 'San Cristobal')).toBe(
      'San Cristóbal',
    );
  });

  it('returns Venezuelan states when the business country is Venezuela', () => {
    expect(normalizeBusinessCountryCode('Venezuela')).toBe('ve');
    expect(getBusinessCountryPhoneCode('ve')).toBe('VE');
    expect(getBusinessSubdivisionLabel('ve')).toBe('Estado');
    expect(getBusinessSubdivisionOptions('ve')).toContainEqual({
      label: 'La Guaira',
      value: 'La Guaira',
    });
  });
});
