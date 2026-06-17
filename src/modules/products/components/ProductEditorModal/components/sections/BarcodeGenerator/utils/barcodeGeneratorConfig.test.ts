import { describe, expect, it } from 'vitest';

import {
  buildConfigFromCompanyPrefix,
  getBarcodePreferenceDefaults,
  getCompanyPrefixValidationStatus,
  isCompanyPrefixConfigValid,
  validateInternalItemReference,
  validateItemReference,
} from './barcodeGeneratorConfig';

describe('barcodeGeneratorConfig', () => {
  it('treats an empty company prefix as a valid unconfigured state', () => {
    expect(isCompanyPrefixConfigValid('')).toBe(true);
    expect(getCompanyPrefixValidationStatus('', true)).toEqual({
      status: '',
      message: '',
    });
  });

  it('validates company prefix digits and length', () => {
    expect(isCompanyPrefixConfigValid('48AB')).toBe(false);
    expect(isCompanyPrefixConfigValid('488')).toBe(false);
    expect(isCompanyPrefixConfigValid('4887')).toBe(true);
    expect(isCompanyPrefixConfigValid('4887123')).toBe(true);
    expect(isCompanyPrefixConfigValid('48871234')).toBe(false);

    expect(getCompanyPrefixValidationStatus('48AB', false)).toEqual({
      status: 'error',
      message: 'Solo se permiten números',
    });
    expect(getCompanyPrefixValidationStatus('488', false)).toEqual({
      status: 'error',
      message: 'Mínimo 4 dígitos (tienes 3)',
    });
    expect(getCompanyPrefixValidationStatus('48871234', false)).toEqual({
      status: 'error',
      message: 'Máximo 7 dígitos (tienes 8)',
    });
    expect(getCompanyPrefixValidationStatus('4887', true)).toEqual({
      status: 'success',
      message: '✓ Configuración válida (4 dígitos)',
    });
  });

  it('builds automatic config values from valid company prefix lengths', () => {
    expect(buildConfigFromCompanyPrefix(null, '4887')).toMatchObject({
      companyPrefix: '4887',
      companyPrefixLength: 4,
      itemReferenceLength: 5,
      maxProducts: 100000,
      name: 'Empresa 4+5',
      description: `Configuración automática para ${(100000).toLocaleString()} productos`,
    });

    expect(buildConfigFromCompanyPrefix(null, '4887123')).toMatchObject({
      companyPrefix: '4887123',
      companyPrefixLength: 7,
      itemReferenceLength: 2,
      maxProducts: 100,
      name: 'Empresa 7+2',
      description: 'Configuración automática para 100 productos',
    });
  });

  it('preserves base config when the prefix cannot derive automatic lengths', () => {
    expect(
      buildConfigFromCompanyPrefix(
        {
          companyPrefixLength: 4,
          itemReferenceLength: 5,
          name: 'Original',
        },
        '123',
      ),
    ).toEqual({
      companyPrefix: '123',
      companyPrefixLength: 4,
      itemReferenceLength: 5,
      name: 'Original',
    });
  });

  it('validates manual item references against the selected settings', () => {
    expect(validateItemReference('', { itemReferenceLength: 5 })).toBeNull();
    expect(validateItemReference('12A45', { itemReferenceLength: 5 })).toBe(
      false,
    );
    expect(validateItemReference('1234', { itemReferenceLength: 5 })).toBe(
      false,
    );
    expect(validateItemReference('12345', { itemReferenceLength: 5 })).toBe(
      true,
    );
  });

  it('validates internal item references as exactly nine digits', () => {
    expect(validateInternalItemReference('')).toBeNull();
    expect(validateInternalItemReference('12345678')).toBe(false);
    expect(validateInternalItemReference('123456789')).toBe(true);
    expect(validateInternalItemReference('12345678A')).toBe(false);
  });

  it('resolves saved preference defaults with safe fallbacks', () => {
    expect(getBarcodePreferenceDefaults(null)).toEqual({
      autoModeDefault: true,
      useCompanyPrefixDefault: false,
    });
    expect(
      getBarcodePreferenceDefaults({
        autoModeDefault: false,
        useCompanyPrefixDefault: true,
      }),
    ).toEqual({
      autoModeDefault: false,
      useCompanyPrefixDefault: true,
    });
  });
});
