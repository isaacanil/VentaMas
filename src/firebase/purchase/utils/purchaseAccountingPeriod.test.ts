import { beforeEach, describe, expect, it, vi } from 'vitest';

const assertAccountingPeriodOpenForBusinessMock = vi.fn();

vi.mock('@/utils/accounting/periodClosures', () => ({
  assertAccountingPeriodOpenForBusiness: (...args: unknown[]) =>
    assertAccountingPeriodOpenForBusinessMock(...args),
}));

import {
  assertPurchaseCompletionAccountingPeriodOpen,
  resolvePurchaseCompletionEffectiveDate,
} from './purchaseAccountingPeriod';

describe('purchaseAccountingPeriod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the completion date as the period source when available', () => {
    expect(
      resolvePurchaseCompletionEffectiveDate({
        completedAt: 1710374400000,
        deliveryAt: 1710115200000,
        dates: {
          deliveryDate: 1709856000000,
        },
      }),
    ).toBe(1710374400000);
  });

  it('falls back to the delivery date when there is no explicit completion date', () => {
    expect(
      resolvePurchaseCompletionEffectiveDate({
        deliveryAt: 1710115200000,
        dates: {
          deliveryDate: 1709856000000,
        },
      }),
    ).toBe(1710115200000);
  });

  it('delegates the allowed validation to the shared accounting-period utility', async () => {
    assertAccountingPeriodOpenForBusinessMock.mockResolvedValue('2026-03');

    await expect(
      assertPurchaseCompletionAccountingPeriodOpen({
        businessId: 'business-1',
        purchase: {
          completedAt: 1710374400000,
        },
      }),
    ).resolves.toBe('2026-03');

    expect(assertAccountingPeriodOpenForBusinessMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      effectiveDate: 1710374400000,
      operationLabel: 'completar esta compra',
    });
  });

  it('propagates the blocked message from the shared accounting-period utility', async () => {
    assertAccountingPeriodOpenForBusinessMock.mockRejectedValue(
      new Error(
        'No puedes completar esta compra con fecha de marzo de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
      ),
    );

    await expect(
      assertPurchaseCompletionAccountingPeriodOpen({
        businessId: 'business-1',
        purchase: {
          completedAt: 1710374400000,
        },
      }),
    ).rejects.toThrow(
      'No puedes completar esta compra con fecha de marzo de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
    );
  });
});
