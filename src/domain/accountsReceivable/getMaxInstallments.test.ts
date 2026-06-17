import { describe, expect, it } from 'vitest';

import { getMaxInstallments } from './getMaxInstallments';

describe('getMaxInstallments', () => {
  it('caps monthly credit plans at 36 installments', () => {
    expect(getMaxInstallments('monthly')).toBe(36);
  });

  it('caps weekly credit plans at 104 installments', () => {
    expect(getMaxInstallments('weekly')).toBe(104);
  });

  it('uses monthly cap as safe fallback for unknown frequencies', () => {
    expect(getMaxInstallments('biweekly')).toBe(36);
    expect(getMaxInstallments('custom-frequency')).toBe(36);
  });
});
