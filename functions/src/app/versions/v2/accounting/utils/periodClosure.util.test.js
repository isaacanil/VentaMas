import { describe, expect, it, vi } from 'vitest';

const docMock = vi.fn();

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => docMock(...args),
  },
}));

import {
  assertAccountingPeriodOpenInTransaction,
  buildAccountingPeriodKey,
} from './periodClosure.util.js';

describe('periodClosure.util', () => {
  it('builds the accounting period key from the effective date', () => {
    expect(
      buildAccountingPeriodKey(new Date('2026-03-10T12:00:00.000Z')),
    ).toBe('2026-03');
  });

  it('throws a friendly error when the period is closed', async () => {
    const closureRef = {
      path: 'businesses/business-1/accountingPeriodClosures/2026-03',
    };
    docMock.mockReturnValueOnce(closureRef);

    const transaction = {
      get: vi.fn(async () => ({ exists: true })),
    };

    await expect(
      assertAccountingPeriodOpenInTransaction({
        transaction,
        businessId: 'business-1',
        effectiveDate: new Date('2026-03-10T12:00:00.000Z'),
        settings: {
          generalAccountingEnabled: true,
        },
        rolloutEnabled: true,
        operationLabel: 'registrar este cobro',
      }),
    ).rejects.toThrow(
      'No puedes registrar este cobro con fecha de marzo de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
    );

    expect(transaction.get).toHaveBeenCalledWith(closureRef);
  });

  it('returns null when accounting period validation is disabled', async () => {
    const transaction = {
      get: vi.fn(),
    };

    await expect(
      assertAccountingPeriodOpenInTransaction({
        transaction,
        businessId: 'business-1',
        effectiveDate: new Date('2026-03-10T12:00:00.000Z'),
        settings: {
          generalAccountingEnabled: false,
        },
        rolloutEnabled: true,
        operationLabel: 'registrar este cobro',
      }),
    ).resolves.toBeNull();

    expect(transaction.get).not.toHaveBeenCalled();
  });

  it('returns the period key when the period is open', async () => {
    const closureRef = {
      path: 'businesses/business-1/accountingPeriodClosures/2026-03',
    };
    docMock.mockReturnValueOnce(closureRef);

    const transaction = {
      get: vi.fn(async () => ({ exists: false })),
    };

    await expect(
      assertAccountingPeriodOpenInTransaction({
        transaction,
        businessId: 'business-1',
        effectiveDate: new Date('2026-03-10T12:00:00.000Z'),
        settings: {
          generalAccountingEnabled: true,
        },
        rolloutEnabled: true,
        operationLabel: 'registrar este cobro',
      }),
    ).resolves.toBe('2026-03');
  });
});
