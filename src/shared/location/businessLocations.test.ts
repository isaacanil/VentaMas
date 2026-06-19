import { describe, expect, it } from 'vitest';

import {
  getBusinessCountryFormOptions,
  getBusinessCountryPhoneCode,
  getBusinessMunicipalityInputMode,
  getBusinessMunicipalityLabel,
  getBusinessMunicipalityOptions,
  getBusinessSubdivisionLabel,
  getBusinessSubdivisionOptions,
  isBusinessMunicipalityValueSupported,
  isBusinessSubdivisionValueSupported,
  normalizeBusinessMunicipalityForStorage,
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
    expect(getBusinessMunicipalityInputMode('do')).toBe('select');
    expect(getBusinessMunicipalityLabel('do')).toBe('Municipio');
    expect(isBusinessSubdivisionValueSupported('do', 'San Cristóbal')).toBe(
      true,
    );
    expect(normalizeBusinessSubdivisionForStorage('do', 'San Cristobal')).toBe(
      'San Cristóbal',
    );
  });

  it('returns Dominican municipalities filtered by province and stores DGII codes', () => {
    expect(
      getBusinessMunicipalityOptions('do', 'Distrito Nacional'),
    ).toContainEqual({
      label: 'Santo Domingo de Guzmán',
      value: '010100',
    });
    expect(
      normalizeBusinessMunicipalityForStorage(
        'do',
        'Distrito Nacional',
        'Santo Domingo de Guzmán',
      ),
    ).toBe('010100');
    expect(
      isBusinessMunicipalityValueSupported('do', 'Distrito Nacional', '320100'),
    ).toBe(false);
  });

  it('returns Venezuelan states when the business country is Venezuela', () => {
    expect(normalizeBusinessCountryCode('Venezuela')).toBe('ve');
    expect(getBusinessCountryPhoneCode('ve')).toBe('VE');
    expect(getBusinessSubdivisionLabel('ve')).toBe('Estado');
    expect(getBusinessMunicipalityInputMode('ve')).toBe('text');
    expect(getBusinessMunicipalityLabel('ve')).toBe('Municipio');
    expect(getBusinessSubdivisionOptions('ve')).toContainEqual({
      label: 'La Guaira',
      value: 'La Guaira',
    });
    expect(getBusinessMunicipalityOptions('ve', 'La Guaira')).toEqual([]);
    expect(
      normalizeBusinessMunicipalityForStorage('ve', 'La Guaira', 'Vargas'),
    ).toBe('Vargas');
  });
});
