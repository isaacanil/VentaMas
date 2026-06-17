import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: vi.fn((path) => ({ path })),
  },
}));

import { db } from '../../../core/config/firebase.js';
import {
  asRecord,
  resolveCashCountEmployeeId,
  toMillis,
  toUserRef,
} from './cashCountCallable.util.js';

describe('cashCountCallable.util', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('asRecord', () => {
    it('returns objects and normalizes non-record values to an empty object', () => {
      const record = { id: 'cash-count-1' };

      expect(asRecord(record)).toBe(record);
      expect(asRecord(null)).toEqual({});
      expect(asRecord(undefined)).toEqual({});
      expect(asRecord(['not-a-record'])).toEqual({});
      expect(asRecord('not-a-record')).toEqual({});
    });
  });

  describe('toMillis', () => {
    it('returns milliseconds from an object with toMillis', () => {
      expect(
        toMillis({
          toMillis: () => 1712587200000,
        }),
      ).toBe(1712587200000);
    });

    it('returns finite numeric values', () => {
      expect(toMillis(1712587200000)).toBe(1712587200000);
      expect(toMillis('1712587200000')).toBe(1712587200000);
    });

    it('returns null for invalid or falsy values', () => {
      expect(toMillis(null)).toBeNull();
      expect(toMillis(undefined)).toBeNull();
      expect(toMillis('')).toBeNull();
      expect(toMillis(0)).toBeNull();
      expect(toMillis('invalid-date')).toBeNull();
      expect(toMillis(Number.NaN)).toBeNull();
    });
  });

  describe('toUserRef', () => {
    it('returns null for blank or null user ids without reading Firestore', () => {
      expect(toUserRef(null)).toBeNull();
      expect(toUserRef('   ')).toBeNull();
      expect(db.doc).not.toHaveBeenCalled();
    });

    it('trims the user id and returns the expected users document reference', () => {
      const ref = toUserRef(' user-1 ');

      expect(db.doc).toHaveBeenCalledTimes(1);
      expect(db.doc).toHaveBeenCalledWith('users/user-1');
      expect(ref).toEqual({ path: 'users/user-1' });
    });
  });

  describe('resolveCashCountEmployeeId', () => {
    it('returns null for empty employee values', () => {
      expect(resolveCashCountEmployeeId(null)).toBeNull();
      expect(resolveCashCountEmployeeId(undefined)).toBeNull();
      expect(resolveCashCountEmployeeId('')).toBeNull();
      expect(resolveCashCountEmployeeId('users/   ')).toBeNull();
    });

    it('resolves string paths and trims the final segment', () => {
      expect(resolveCashCountEmployeeId('users/cashier-1')).toBe('cashier-1');
      expect(resolveCashCountEmployeeId(' cashier-2 ')).toBe('cashier-2');
    });

    it('resolves Firestore path internals used by document references', () => {
      expect(
        resolveCashCountEmployeeId({
          _path: {
            segments: ['users', 'cashier-3'],
          },
        }),
      ).toBe('cashier-3');
      expect(
        resolveCashCountEmployeeId({
          _key: {
            path: {
              segments: ['users', 'cashier-4'],
            },
          },
        }),
      ).toBe('cashier-4');
    });

    it('falls back to common id fields on plain records', () => {
      expect(resolveCashCountEmployeeId({ id: ' cashier-5 ' })).toBe(
        'cashier-5',
      );
      expect(resolveCashCountEmployeeId({ uid: 'cashier-6' })).toBe(
        'cashier-6',
      );
      expect(resolveCashCountEmployeeId({ userId: 'cashier-7' })).toBe(
        'cashier-7',
      );
    });
  });
});
