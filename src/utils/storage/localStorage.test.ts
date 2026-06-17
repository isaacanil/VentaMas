import { afterEach, describe, expect, it, vi } from 'vitest';

import { readLocalStorageBoolean } from './localStorage';

describe('readLocalStorageBoolean', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('reads persisted boolean values', () => {
    localStorage.setItem('preference', 'true');

    expect(readLocalStorageBoolean('preference')).toBe(true);

    localStorage.setItem('preference', 'false');

    expect(readLocalStorageBoolean('preference')).toBe(false);
  });

  it('returns the fallback for missing or non-boolean values', () => {
    expect(readLocalStorageBoolean('missing', true)).toBe(true);

    localStorage.setItem('preference', JSON.stringify({ enabled: true }));

    expect(readLocalStorageBoolean('preference', false)).toBe(false);
  });

  it('does not throw when stored JSON is malformed', () => {
    localStorage.setItem('preference', '{bad-json');

    expect(readLocalStorageBoolean('preference', true)).toBe(true);
  });

  it('uses the fallback when storage access is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(readLocalStorageBoolean('preference', false)).toBe(false);
  });
});
