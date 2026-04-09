import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpsCallable } from 'firebase/functions';

import { fbCashCountClosed } from './fbCashCountClosed';

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

vi.mock('@/firebase/Auth/fbAuthV2/sessionClient', () => ({
  getStoredSession: () => ({ sessionToken: 'session-token' }),
}));

vi.mock('@/firebase/app/getClientBuildInfo', () => ({
  getClientBuildInfo: () =>
    Promise.resolve({
      clientBuildId: 'changelog-123',
      clientAppVersion: '2026-03-04T12:00:00.000Z',
    }),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  functions: { app: 'test-functions' },
}));

vi.mock('@/utils/users/userIdentityAccess', () => ({
  resolveUserIdentityBusinessId: () => 'business-1',
}));

describe('fbCashCountClosed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia un payload serializable aunque el cashCount original tenga ciclos', async () => {
    const callableMock = vi.fn().mockResolvedValue({ data: { ok: true } });
    vi.mocked(httpsCallable).mockReturnValue(callableMock);

    const cyclicEmployee = {
      id: 'employee-1',
      name: 'Cajero',
    } as Record<string, unknown>;
    cyclicEmployee.self = cyclicEmployee;

    const cyclicCashCount = {
      id: 'cash-count-1',
      totalCard: 100,
      totalTransfer: 50,
      totalCharged: 300,
      totalReceivables: 25,
      totalDiscrepancy: 0,
      totalRegister: 375,
      totalSystem: 375,
      opening: {
        employee: cyclicEmployee,
      },
      closing: {
        comments: 'Todo correcto',
        employee: cyclicEmployee,
        approvalEmployee: cyclicEmployee,
        banknotes: [
          {
            ref: '1000',
            value: 1000,
            quantity: '2',
            owner: cyclicEmployee,
          },
        ],
      },
    } as Record<string, unknown>;
    cyclicCashCount.self = cyclicCashCount;
    (cyclicCashCount.closing as Record<string, unknown>).parent = cyclicCashCount;

    const response = await fbCashCountClosed(
      { uid: 'user-1' } as never,
      cyclicCashCount as never,
      'employee-1',
      'manager-1',
      1_709_510_400_000,
    );

    expect(response).toBe('success');
    expect(callableMock).toHaveBeenCalledTimes(1);

    const payload = callableMock.mock.calls[0]?.[0] as {
      businessId: string;
      cashCountId: string;
      cashCount: Record<string, unknown>;
      employeeID: string;
      approvalEmployeeID: string;
      closingDate: number;
      sessionToken: string;
      clientBuildId: string;
      clientAppVersion: string;
    };

    expect(() => JSON.stringify(payload)).not.toThrow();
    expect(payload).toMatchObject({
      businessId: 'business-1',
      cashCountId: 'cash-count-1',
      employeeID: 'employee-1',
      approvalEmployeeID: 'manager-1',
      closingDate: 1_709_510_400_000,
      sessionToken: 'session-token',
      clientBuildId: 'changelog-123',
      clientAppVersion: '2026-03-04T12:00:00.000Z',
      cashCount: {
        id: 'cash-count-1',
        totalCard: 100,
        totalTransfer: 50,
        totalCharged: 300,
        totalReceivables: 25,
        totalDiscrepancy: 0,
        totalRegister: 375,
        totalSystem: 375,
        closing: {
          comments: 'Todo correcto',
          banknotes: [
            {
              ref: '1000',
              value: 1000,
              quantity: '2',
            },
          ],
        },
      },
    });
    expect(payload.cashCount).not.toHaveProperty('self');
    expect(payload.cashCount.closing).not.toHaveProperty('employee');
    expect(payload.cashCount.closing).not.toHaveProperty('approvalEmployee');
  });
});
