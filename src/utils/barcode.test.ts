import { describe, expect, it } from 'vitest';

import {
  extractWeightInfo,
  formatWeight,
  getBarcodeLookupCandidates,
  isVariableWeightBarcode,
  normalizeBarcodeDigits,
  normalizeBarcodeValue,
} from '@/utils/barcode';

describe('barcode helpers', () => {
  it('normalizes scanner payload removing control chars, spaces and AIM prefix', () => {
    const raw = `\r\n]C1  7501031311309\t`;
    expect(normalizeBarcodeValue(raw)).toBe('7501031311309');
  });

  it('normalizes numeric barcode values', () => {
    expect(normalizeBarcodeValue(1234567890123)).toBe('1234567890123');
  });

  it('builds candidates with UPC/EAN fallback', () => {
    const upc = '036000291452';
    const candidates = getBarcodeLookupCandidates(upc);

    expect(candidates).toContain('036000291452');
    expect(candidates).toContain('0036000291452');
  });

  it('builds variable-weight candidates including PLU extraction', () => {
    const candidates = getBarcodeLookupCandidates('2012345006164');
    expect(candidates).toContain('12345');
  });

  it('detects variable weight with expanded prefixes', () => {
    expect(isVariableWeightBarcode('2512345006164')).toBe(true);
    expect(isVariableWeightBarcode('7501031311309')).toBe(false);
  });

  it('extracts and formats weight segment', () => {
    const digits = normalizeBarcodeDigits('20 12345 006164');
    expect(extractWeightInfo(digits)).toBe('006164');
    expect(formatWeight('006164')).toBe(0.616);
  });
});
