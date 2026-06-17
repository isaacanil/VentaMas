import { describe, expect, it } from 'vitest';

import { normalizePhoneToE164 } from './phone.util.js';

describe('phone.util', () => {
  it('normalizes Dominican local phone values to E.164', () => {
    expect(normalizePhoneToE164('809-123-4567')).toBe('+18091234567');
    expect(normalizePhoneToE164('(829) 222-3333')).toBe('+18292223333');
    expect(normalizePhoneToE164(8496503586)).toBe('+18496503586');
  });

  it('preserves valid international E.164-style values', () => {
    expect(normalizePhoneToE164('+1 (829) 222-3333')).toBe('+18292223333');
    expect(normalizePhoneToE164('1 849 650 3586')).toBe('+18496503586');
    expect(normalizePhoneToE164('34 612 345 678')).toBe('+34612345678');
  });

  it('returns null for empty or unsupported values', () => {
    expect(normalizePhoneToE164('')).toBeNull();
    expect(normalizePhoneToE164('   ')).toBeNull();
    expect(normalizePhoneToE164('abc')).toBeNull();
    expect(normalizePhoneToE164('1234567')).toBeNull();
    expect(normalizePhoneToE164('1234567890123456')).toBeNull();
    expect(normalizePhoneToE164(false)).toBeNull();
  });
});
