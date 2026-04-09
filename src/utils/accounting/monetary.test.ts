import { describe, expect, it } from 'vitest';

import {
  buildBaseCurrencyMonetarySnapshot,
  isAccountingRolloutEnabledForBusiness,
} from './monetary';

const getRateType = (snapshot: Record<string, unknown> | null) =>
  (snapshot?.exchangeRateSnapshot as { rateType?: string } | undefined)?.rateType;

describe('accounting monetary', () => {
  it('uses buy rateType for base-currency purchase snapshots', () => {
    const snapshot = buildBaseCurrencyMonetarySnapshot({
      documentCurrency: 'DOP',
      functionalCurrency: 'DOP',
      total: 118,
      paid: 0,
      balance: 118,
      operationType: 'purchase',
    });

    expect(getRateType(snapshot)).toBe('buy');
    expect(
      (snapshot?.functionalTotals as { total?: number } | undefined)?.total,
    ).toBe(118);
  });

  it('uses buy rateType for base-currency payable-payment snapshots', () => {
    const snapshot = buildBaseCurrencyMonetarySnapshot({
      documentCurrency: 'DOP',
      functionalCurrency: 'DOP',
      total: 118,
      paid: 118,
      balance: 0,
      operationType: 'payable-payment',
    });

    expect(getRateType(snapshot)).toBe('buy');
  });

  it('keeps sell rateType for base-currency sale snapshots', () => {
    const snapshot = buildBaseCurrencyMonetarySnapshot({
      documentCurrency: 'DOP',
      functionalCurrency: 'DOP',
      total: 118,
      paid: 118,
      balance: 0,
      operationType: 'sale',
    });

    expect(getRateType(snapshot)).toBe('sell');
  });

  it('enables rollout for non-pilot businesses when settings/accounting opts in', () => {
    expect(
      isAccountingRolloutEnabledForBusiness('legacy-business', {
        rolloutEnabled: true,
      }),
    ).toBe(true);
  });
});
