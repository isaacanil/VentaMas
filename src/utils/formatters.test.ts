import { describe, expect, it } from 'vitest';

import {
  formatMoney,
  formatNumber,
  formatPercentage,
  formatQuantity,
} from './formatters';

describe('shared legacy formatters', () => {
  it('formats money through the Dominican currency display with fallback zero', () => {
    expect(formatMoney(1234.5)).toBe('RD$1,234.50');
    expect(formatMoney('not-a-number')).toBe('RD$0.00');
  });

  it('keeps count-style display formatting for number, percentage, and quantity helpers', () => {
    expect(formatNumber('1234.5')).toBe('1,234.50');
    expect(formatNumber('not-a-number')).toBe('0.00');
    expect(formatPercentage(25)).toBe('25%');
    expect(formatQuantity(3, 0)).toBe('3');
  });
});
