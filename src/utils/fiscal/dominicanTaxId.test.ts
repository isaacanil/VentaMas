import { describe, expect, it } from 'vitest';

import {
  normalizeValidDominicanTaxId,
  validateDominicanTaxId,
} from './dominicanTaxId';

describe('dominicanTaxId', () => {
  it('valida RNC con digito verificador correcto', () => {
    expect(validateDominicanTaxId('132619201')).toMatchObject({
      digits: '132619201',
      isValid: true,
      kind: 'rnc',
    });
  });

  it('valida cedula con digito verificador correcto', () => {
    expect(validateDominicanTaxId('001-1391820-5')).toMatchObject({
      digits: '00113918205',
      isValid: true,
      kind: 'cedula',
    });
  });

  it('rechaza cedula con 11 digitos pero digito verificador incorrecto', () => {
    expect(validateDominicanTaxId('00201660332')).toMatchObject({
      digitCount: 11,
      digits: '00201660332',
      isValid: false,
      kind: 'cedula',
      reason: 'invalid-checksum',
    });
  });

  it('normaliza solo identificaciones fiscales validas', () => {
    expect(normalizeValidDominicanTaxId('00201660332')).toBeNull();
    expect(normalizeValidDominicanTaxId('00201660339')).toBe('00201660339');
  });
});
