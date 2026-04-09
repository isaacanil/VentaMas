import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../core/config/firebase.js', () => {
  class MockTimestamp {
    constructor(value) {
      this.value = value;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-03-30T12:00:00.000Z'));
    }

    static fromMillis(value) {
      return new MockTimestamp(value);
    }

    toMillis() {
      return this.value;
    }
  }

  return {
    Timestamp: MockTimestamp,
    db: {},
  };
});

import {
  buildPilotBaseCurrencyMonetarySnapshot,
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from './accountingRollout.util.js';

describe('accountingRollout.util', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses buy rateType for base-currency purchase snapshots', () => {
    const snapshot = buildPilotBaseCurrencyMonetarySnapshot({
      documentCurrency: 'DOP',
      functionalCurrency: 'DOP',
      total: 118,
      paid: 0,
      balance: 118,
      operationType: 'purchase',
      capturedBy: 'user-1',
    });

    expect(snapshot?.exchangeRateSnapshot?.rateType).toBe('buy');
  });

  it('uses buy rateType for base-currency payable-payment snapshots', () => {
    const snapshot = buildPilotBaseCurrencyMonetarySnapshot({
      documentCurrency: 'DOP',
      functionalCurrency: 'DOP',
      total: 118,
      paid: 118,
      balance: 0,
      operationType: 'payable-payment',
      capturedBy: 'user-1',
    });

    expect(snapshot?.exchangeRateSnapshot?.rateType).toBe('buy');
  });

  it('keeps sell rateType for base-currency sale snapshots', () => {
    const snapshot = buildPilotBaseCurrencyMonetarySnapshot({
      documentCurrency: 'DOP',
      functionalCurrency: 'DOP',
      total: 118,
      paid: 118,
      balance: 0,
      operationType: 'sale',
      capturedBy: 'user-1',
    });

    expect(snapshot?.exchangeRateSnapshot?.rateType).toBe('sell');
  });

  it('enables rollout for non-pilot businesses when settings/accounting has rolloutEnabled', () => {
    expect(
      isAccountingRolloutEnabledForBusiness('legacy-business', {
        rolloutEnabled: true,
      }),
    ).toBe(true);
  });

  it('keeps non-pilot businesses disabled when settings/accounting does not opt them in', () => {
    expect(
      isAccountingRolloutEnabledForBusiness('legacy-business', {
        bankAccountsEnabled: false,
      }),
    ).toBe(false);
  });

  it('preserves generalAccountingEnabled when normalizing rollout settings', async () => {
    const settings = await getPilotAccountingSettingsForBusiness(
      'legacy-business',
      {
        settings: {
          rolloutEnabled: true,
          generalAccountingEnabled: true,
        },
      },
    );

    expect(settings?.generalAccountingEnabled).toBe(true);
  });
});
