import { describe, expect, it } from 'vitest';

import {
  formatStockQuantity,
  toStockDateMs,
  type StockQuantityDisplayValue,
} from './stockDisplay';

const formatStockQuantityLegacy = (value: StockQuantityDisplayValue): string =>
  Number(value ?? 0).toLocaleString();

describe('stockDisplay', () => {
  describe('toStockDateMs', () => {
    it('matches the previous timestamp conversion for supported values', () => {
      const date = new Date('2026-06-15T10:30:45.123Z');

      expect(toStockDateMs(date)).toBe(date.getTime());
      expect(toStockDateMs(date.getTime())).toBe(date.getTime());
      expect(toStockDateMs('2026-06-15T10:30:45.123Z')).toBe(date.getTime());
      expect(toStockDateMs({ seconds: 1772492281 })).toBe(1772492281000);
      expect(toStockDateMs({ toDate: () => date })).toBe(date.getTime());
    });

    it('keeps falsy and invalid date values hidden', () => {
      expect(toStockDateMs(null)).toBeNull();
      expect(toStockDateMs(undefined)).toBeNull();
      expect(toStockDateMs(0)).toBeNull();
      expect(toStockDateMs('')).toBeNull();
      expect(toStockDateMs(new Date('not-a-date'))).toBeNull();
      expect(toStockDateMs('not-a-date')).toBeNull();
      expect(toStockDateMs({ toDate: () => new Date('not-a-date') })).toBeNull();
    });

    it('preserves legacy seconds-field behavior for non-finite numbers', () => {
      expect(Number.isNaN(toStockDateMs({ seconds: Number.NaN }))).toBe(true);
    });
  });

  describe('formatStockQuantity', () => {
    it('matches Number(value ?? 0).toLocaleString() for stock quantities', () => {
      const values: StockQuantityDisplayValue[] = [
        1234,
        1234.5,
        '1234.50',
        '0',
        '',
        null,
        undefined,
        -9876.543,
      ];

      for (const value of values) {
        expect(formatStockQuantity(value)).toBe(formatStockQuantityLegacy(value));
      }
    });
  });
});
