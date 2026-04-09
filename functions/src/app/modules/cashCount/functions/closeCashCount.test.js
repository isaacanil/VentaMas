import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {},
  onCall: (handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: vi.fn(() => ({
      set: vi.fn(),
    })),
  },
  FieldValue: {
    arrayUnion: vi.fn(),
  },
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-04-08T12:00:00.000Z'));
    }

    static fromMillis(millis) {
      return new MockTimestamp(millis);
    }

    toMillis() {
      return this.millis;
    }
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: vi.fn(),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: vi.fn(),
  isAccountingRolloutEnabledForBusiness: vi.fn(),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingEvent.util.js', () => ({
  buildAccountingEvent: vi.fn((input) => ({
    id: `${input.eventType}__${input.sourceId}`,
    ...input,
  })),
}));

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    INVOICE_OPERATOR: ['owner'],
  },
  assertUserAccess: vi.fn(),
}));

vi.mock('../../../versions/v2/billing/services/usage.service.js', () => ({
  incrementBusinessUsageMetric: vi.fn(),
}));

import { buildCashOverShortAccountingEvent } from './closeCashCount.js';

describe('buildCashOverShortAccountingEvent', () => {
  it('returns null when there is no discrepancy', () => {
    const result = buildCashOverShortAccountingEvent({
      businessId: 'business-1',
      cashCountId: 'cash-1',
      cashCount: {
        totalDiscrepancy: 0,
      },
      accountingSettings: {
        functionalCurrency: 'DOP',
      },
      authUid: 'user-1',
      occurredAt: Date.parse('2026-04-08T12:00:00.000Z'),
    });

    expect(result).toBeNull();
  });

  it('builds an over event with signed monetary amount', () => {
    const result = buildCashOverShortAccountingEvent({
      businessId: 'business-1',
      cashCountId: 'cash-1',
      cashCount: {
        totalDiscrepancy: 25.5,
        totalSystem: 100,
        totalRegister: 125.5,
      },
      accountingSettings: {
        functionalCurrency: 'DOP',
      },
      authUid: 'user-1',
      occurredAt: Date.parse('2026-04-08T12:00:00.000Z'),
    });

    expect(result).toMatchObject({
      eventType: 'cash_over_short.recorded',
      sourceType: 'cashCount',
      sourceId: 'cash-1',
      monetary: {
        amount: 25.5,
        functionalAmount: 25.5,
      },
      treasury: {
        cashCountId: 'cash-1',
        paymentChannel: 'cash',
      },
      payload: expect.objectContaining({
        discrepancyAmount: 25.5,
        discrepancyDirection: 'over',
      }),
    });
  });

  it('builds a short event preserving the negative sign', () => {
    const result = buildCashOverShortAccountingEvent({
      businessId: 'business-1',
      cashCountId: 'cash-1',
      cashCount: {
        totalDiscrepancy: -12.75,
        totalSystem: 100,
        totalRegister: 87.25,
      },
      accountingSettings: {
        functionalCurrency: 'DOP',
      },
      authUid: 'user-1',
      occurredAt: Date.parse('2026-04-08T12:00:00.000Z'),
    });

    expect(result).toMatchObject({
      monetary: {
        amount: -12.75,
        functionalAmount: -12.75,
      },
      payload: expect.objectContaining({
        discrepancyAmount: -12.75,
        discrepancyDirection: 'short',
      }),
    });
  });
});
