import { beforeEach, describe, expect, it, vi } from 'vitest';

const docMock = vi.fn();
const getDocMock = vi.fn();
const getAccountingSettingsForBusinessMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: { __name: 'db' },
}));

vi.mock('@/utils/accounting/monetary', () => ({
  getAccountingSettingsForBusiness: (...args: unknown[]) =>
    getAccountingSettingsForBusinessMock(...args),
}));

import {
  assertAccountingPeriodOpenForBusiness,
  assertAccountingPeriodOpenForBusinessInTransaction,
  isAccountingPeriodClosed,
  resolveAccountingPeriodStatus,
  resolveAccountingPeriodStatusFromPeriodKey,
} from './periodClosures';

describe('periodClosures', () => {
  beforeEach(() => {
    docMock.mockReset();
    getDocMock.mockReset();
    getAccountingSettingsForBusinessMock.mockReset();
  });

  it('skips validation when the business is not in accounting rollout', async () => {
    getAccountingSettingsForBusinessMock.mockResolvedValue(null);

    await expect(
      assertAccountingPeriodOpenForBusiness({
        businessId: 'business-1',
        effectiveDate: new Date('2026-03-10T12:00:00.000Z'),
        operationLabel: 'registrar este cobro',
      }),
    ).resolves.toBeNull();

    expect(getAccountingSettingsForBusinessMock).toHaveBeenCalledTimes(1);
    expect(getDocMock).not.toHaveBeenCalled();
  });

  it('throws a friendly error when the accounting period is closed', async () => {
    getAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
    });
    docMock.mockReturnValue({
      path: 'businesses/business-1/accountingPeriodClosures/2026-03',
    });
    getDocMock.mockResolvedValue({
      exists: () => true,
    });

    await expect(
      assertAccountingPeriodOpenForBusiness({
        businessId: 'business-1',
        effectiveDate: new Date('2026-03-10T12:00:00.000Z'),
        operationLabel: 'registrar este cobro',
      }),
    ).rejects.toThrow(
      'No puedes registrar este cobro con fecha de marzo de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
    );
  });

  it('resolves a closed period status from the effective date', () => {
    const closure = {
      id: '2026-03',
      periodKey: '2026-03',
      closedAt: 1710000000000,
    };

    expect(
      resolveAccountingPeriodStatus(
        new Date('2026-03-10T12:00:00.000Z'),
        [closure],
      ),
    ).toEqual({
      periodKey: '2026-03',
      isClosed: true,
      closure,
    });
  });

  it('returns the open period key when no closure exists', async () => {
    getAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
    });
    docMock.mockReturnValue({
      path: 'businesses/business-1/accountingPeriodClosures/2026-03',
    });
    getDocMock.mockResolvedValue({
      exists: () => false,
    });

    await expect(
      assertAccountingPeriodOpenForBusiness({
        businessId: 'business-1',
        effectiveDate: new Date('2026-03-10T12:00:00.000Z'),
        operationLabel: 'registrar este cobro',
      }),
    ).resolves.toBe('2026-03');

    expect(getDocMock).toHaveBeenCalledTimes(1);
  });

  it('resolves an open period status from a period key', () => {
    expect(
      resolveAccountingPeriodStatusFromPeriodKey('2026-04', [
        { periodKey: '2026-03' },
      ]),
    ).toEqual({
      periodKey: '2026-04',
      isClosed: false,
      closure: null,
    });
    expect(
      isAccountingPeriodClosed('2026-03', [{ periodKey: '2026-03' }]),
    ).toBe(true);
  });

  it('supports a custom message builder inside a transaction', async () => {
    getAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
    });
    docMock.mockReturnValue({
      path: 'businesses/business-1/accountingPeriodClosures/2026-03',
    });
    const transaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
      }),
    };

    await expect(
      assertAccountingPeriodOpenForBusinessInTransaction({
        transaction: transaction as never,
        businessId: 'business-1',
        effectiveDate: new Date('2026-03-10T12:00:00.000Z'),
        operationLabel: 'registrar este gasto',
        buildMessage: () =>
          'El período seleccionado está cerrado. Usa otra fecha o reabre el período.',
      }),
    ).rejects.toThrow(
      'El período seleccionado está cerrado. Usa otra fecha o reabre el período.',
    );

    expect(transaction.get).toHaveBeenCalledWith({
      path: 'businesses/business-1/accountingPeriodClosures/2026-03',
    });
  });
});
