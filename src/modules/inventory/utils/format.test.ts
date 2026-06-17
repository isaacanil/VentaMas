import { describe, expect, it } from 'vitest';

import { DEFAULT_COUNT_LOCALE } from '@/utils/formatCounts';

import {
  NO_BATCH_LABEL,
  formatBatchLabel,
  formatInventoryQuantity,
  formatNumber,
  type InventoryQuantityDisplayValue,
} from './format';

const formatInventoryQuantityLegacy = (
  value: InventoryQuantityDisplayValue,
): string =>
  new Intl.NumberFormat(DEFAULT_COUNT_LOCALE).format(
    Number.isFinite(Number(value)) ? Number(value) : 0,
  );

describe('inventory format utils', () => {
  describe('formatInventoryQuantity', () => {
    it('formats inventory quantities with the shared Dominican locale', () => {
      const values: InventoryQuantityDisplayValue[] = [
        1234,
        1234.5,
        '1234.50',
        '0',
        '',
        null,
        undefined,
        -9876.543,
        'not-a-number',
      ];

      for (const value of values) {
        expect(formatInventoryQuantity(value)).toBe(
          formatInventoryQuantityLegacy(value),
        );
      }
    });

    it('formats inventory numbers with up to two decimal places', () => {
      expect(formatNumber('1234.567')).toBe(
        new Intl.NumberFormat(DEFAULT_COUNT_LOCALE, {
          maximumFractionDigits: 2,
        }).format(1234.567),
      );
    });
  });

  describe('formatBatchLabel', () => {
    it('formats batch labels with the requested prefix', () => {
      expect(formatBatchLabel('A-100')).toBe('A-100');
      expect(formatBatchLabel('A-100', { prefix: '#' })).toBe('#A-100');
      expect(formatBatchLabel('A-100', { prefix: '# ' })).toBe('# A-100');
      expect(formatBatchLabel(25, { prefix: 'Lote #' })).toBe('Lote #25');
    });

    it('keeps the existing no-batch label for missing batch values', () => {
      expect(formatBatchLabel(null)).toBe(NO_BATCH_LABEL);
      expect(formatBatchLabel(undefined)).toBe(NO_BATCH_LABEL);
      expect(formatBatchLabel('')).toBe(NO_BATCH_LABEL);
      expect(formatBatchLabel('   ')).toBe(NO_BATCH_LABEL);
      expect(formatBatchLabel(0)).toBe('0');
    });

    it('allows surfaces to preserve their custom empty labels', () => {
      expect(formatBatchLabel(null, { noBatchLabel: 'N/A' })).toBe('N/A');
      expect(
        formatBatchLabel(undefined, { noBatchLabel: 'Sin lote asignado' }),
      ).toBe('Sin lote asignado');
      expect(
        formatBatchLabel(null, {
          prefix: 'Lote #',
          noBatchLabel: 'Lote #N/A',
        }),
      ).toBe('Lote #N/A');
      expect(
        formatBatchLabel(undefined, {
          prefix: 'Lote #',
          noBatchLabel: 'Lote #-',
        }),
      ).toBe('Lote #-');
    });
  });
});
