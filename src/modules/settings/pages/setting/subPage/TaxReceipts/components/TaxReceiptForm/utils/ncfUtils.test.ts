import { describe, expect, it } from 'vitest';

import { formatLedgerEntryNcf, formatNcfDigits } from './ncfUtils';

describe('ncfUtils NCF formatting helpers', () => {
  it('formats raw digits with the provided prefix and sequence length', () => {
    expect(
      formatNcfDigits('00043', { prefix: 'B01', sequenceLength: 8 }),
    ).toBe('B0100000043');
  });

  it('falls back to the normalized digit length when sequence length is missing', () => {
    expect(formatNcfDigits('00043', { prefix: 'B01' })).toBe('B0143');
  });

  it('formats ledger entries from normalized digits before other fields', () => {
    expect(
      formatLedgerEntryNcf(
        {
          normalizedDigits: '00043',
          number: 99,
          ncf: 'B0100000099',
        },
        { prefix: 'B01', sequenceLength: 8 },
      ),
    ).toBe('B0100000043');
  });

  it('uses the ledger entry number when normalized digits are missing', () => {
    expect(
      formatLedgerEntryNcf({ number: 43 }, { prefix: 'B01', sequenceLength: 8 }),
    ).toBe('B0100000043');
  });

  it('preserves the existing prefixed NCF segment when extracting from NCF text', () => {
    expect(
      formatLedgerEntryNcf(
        { ncf: 'Factura b01-00000043' },
        { prefix: 'B01', sequenceLength: 8 },
      ),
    ).toBe('B01-00000043');
  });

  it('falls back to the original NCF when no digits can be extracted', () => {
    expect(
      formatLedgerEntryNcf(
        { ncf: 'Factura sin NCF' },
        { prefix: 'B01', sequenceLength: 8 },
      ),
    ).toBe('Factura sin NCF');
  });
});
