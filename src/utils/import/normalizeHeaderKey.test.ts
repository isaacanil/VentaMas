import { describe, expect, it } from 'vitest';

import {
  normalizeCompactHeaderKey,
  normalizeHeaderKey,
} from './normalizeHeaderKey';

describe('normalizeHeaderKey', () => {
  it('normalizes accents, separators, punctuation, and repeated spaces', () => {
    expect(normalizeHeaderKey('  Código-de_Barras!!  ')).toBe(
      'codigo de barras',
    );
  });

  it('compacts normalized headers for alias comparisons', () => {
    expect(normalizeCompactHeaderKey(' Transaction Date ')).toBe(
      'transactiondate',
    );
    expect(normalizeCompactHeaderKey('Débito (RD$)')).toBe('debitord');
  });
});
