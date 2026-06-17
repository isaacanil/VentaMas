import { describe, expect, it } from 'vitest';

import { getAccountCardKey } from './getAccountCardKey';

describe('getAccountCardKey', () => {
  it('prefers arId over display numbers and id', () => {
    expect(
      getAccountCardKey({
        arId: 'ar-123',
        accountNumber: 'ACC-001',
        id: 'doc-123',
        numberId: 'N-001',
      }),
    ).toBe('ar-123');
  });

  it('falls back through accountNumber, id, then numberId', () => {
    expect(getAccountCardKey({ accountNumber: 'ACC-001' })).toBe('ACC-001');
    expect(getAccountCardKey({ id: 'doc-123', numberId: 'N-001' })).toBe(
      'doc-123',
    );
    expect(getAccountCardKey({ numberId: 'N-001' })).toBe('N-001');
  });
});
