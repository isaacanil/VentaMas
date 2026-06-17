import { describe, expect, it } from 'vitest';

import {
  DEFAULT_BANK_INSTITUTION_COUNTRY_CODE,
  findBankInstitutionByName,
  normalizeBankInstitutionCatalogRecord,
  normalizeBankInstitutionCode,
  normalizeBankInstitutionCountryCode,
  normalizeBankInstitutionName,
  resolveBankInstitution,
  sortBankInstitutionCatalog,
} from './bankInstitutionCatalog';

describe('bankInstitutionCatalog', () => {
  it('normalizes names, codes and country codes through shared text helpers', () => {
    expect(normalizeBankInstitutionName('  Banco Múltiple Ñandú  ')).toBe(
      'banco multiple nandu',
    );
    expect(normalizeBankInstitutionCode('  BHD  ')).toBe('bhd');
    expect(normalizeBankInstitutionCode(' custom ')).toBe('CUSTOM');
    expect(normalizeBankInstitutionCountryCode(' do ')).toBe('DO');
    expect(normalizeBankInstitutionCountryCode(null)).toBe(
      DEFAULT_BANK_INSTITUTION_COUNTRY_CODE,
    );
  });

  it('normalizes persisted records and rejects incomplete custom records', () => {
    expect(
      normalizeBankInstitutionCatalogRecord('bank-1', {
        code: '  Reservas  ',
        countryCode: 'do',
        name: '  Banco de Reservas  ',
        status: ' ACTIVE ',
      }),
    ).toEqual({
      code: 'reservas',
      countryCode: 'DO',
      id: 'bank-1',
      isSystemBuiltin: null,
      name: 'Banco de Reservas',
      normalizedName: 'banco de reservas',
      source: null,
      status: 'active',
    });

    expect(
      normalizeBankInstitutionCatalogRecord('custom', {
        code: 'CUSTOM',
        name: 'Banco manual',
      }),
    ).toBeNull();
  });

  it('sorts and resolves entries by normalized name and code', () => {
    const catalog = sortBankInstitutionCatalog([
      { code: 'popular', countryCode: 'DO', name: 'Banco Popular' },
      { code: 'reservas', countryCode: 'DO', name: 'Banco de Reservas' },
    ]);

    expect(catalog.map((item) => item.code)).toEqual(['reservas', 'popular']);
    expect(resolveBankInstitution(catalog, 'do', ' POPULAR ')).toEqual(
      catalog[1],
    );
    expect(findBankInstitutionByName(catalog, ' banco multiple popular ', 'DO'))
      .toBeNull();
    expect(findBankInstitutionByName(catalog, 'banco popular', 'DO')).toEqual(
      catalog[1],
    );
  });
});
