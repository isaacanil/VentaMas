import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  invoiceOperatorRoles,
  resolveCallableAuthUidMock,
  resolveSubscriptionOperationAccessMock,
} = vi.hoisted(() => ({
  assertBusinessSubscriptionAccessMock: vi.fn(),
  assertUserAccessMock: vi.fn(),
  invoiceOperatorRoles: new Set(['owner', 'admin', 'manager', 'cashier']),
  resolveCallableAuthUidMock: vi.fn(),
  resolveSubscriptionOperationAccessMock: vi.fn(),
}));

vi.mock('../../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../config/limitOperations.config.js', () => ({
  resolveSubscriptionOperationAccess: (...args) =>
    resolveSubscriptionOperationAccessMock(...args),
}));

vi.mock('../../auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    INVOICE_OPERATOR: invoiceOperatorRoles,
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('./subscriptionAccess.util.js', () => ({
  assertBusinessSubscriptionAccess: (...args) =>
    assertBusinessSubscriptionAccessMock(...args),
}));

import { prepareLimitedCreateOperation } from './limitedCreateOperation.util.js';

describe('limitedCreateOperation.util', () => {
  beforeEach(() => {
    assertBusinessSubscriptionAccessMock.mockReset();
    assertUserAccessMock.mockReset();
    resolveCallableAuthUidMock.mockReset();
    resolveSubscriptionOperationAccessMock.mockReset();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
    assertUserAccessMock.mockResolvedValue({ role: 'cashier' });
    resolveSubscriptionOperationAccessMock.mockReturnValue({
      metricKey: 'clientsTotal',
      incrementBy: 1,
    });
  });

  it('resolves the callable uid, business input, access checks and usage metric', async () => {
    const client = { businessID: ' business-1 ', name: 'ACME' };

    const result = await prepareLimitedCreateOperation({
      request: { data: { client } },
      inputKey: 'client',
      operation: 'client.create',
      inputBusinessIdKeys: ['businessID'],
    });

    expect(result).toEqual(
      expect.objectContaining({
        authUid: 'user-1',
        businessId: 'business-1',
        input: client,
        metricKey: 'clientsTotal',
        incrementBy: 1,
      }),
    );
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: invoiceOperatorRoles,
    });
    expect(assertBusinessSubscriptionAccessMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      action: 'write',
      operation: 'client.create',
    });
    expect(resolveSubscriptionOperationAccessMock).toHaveBeenCalledWith(
      'client.create',
    );
  });

  it('keeps the existing unauthenticated error contract', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);

    await expect(
      prepareLimitedCreateOperation({
        request: { data: { businessId: 'business-1', provider: {} } },
        inputKey: 'provider',
        operation: 'supplier.create',
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
      message: 'Usuario no autenticado',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(assertBusinessSubscriptionAccessMock).not.toHaveBeenCalled();
  });

  it('keeps businessId validation ahead of input validation', async () => {
    await expect(
      prepareLimitedCreateOperation({
        request: { data: {} },
        inputKey: 'warehouse',
        operation: 'warehouse.create',
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'businessId es requerido',
    });
  });

  it('uses the callable input key in the required input error', async () => {
    await expect(
      prepareLimitedCreateOperation({
        request: { data: { businessId: 'business-1' } },
        inputKey: 'provider',
        operation: 'supplier.create',
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'provider es requerido',
    });
  });

  it('falls back to incrementBy 1 when operation config has a non-finite value', async () => {
    resolveSubscriptionOperationAccessMock.mockReturnValue({
      metricKey: 'warehousesTotal',
      incrementBy: Number.NaN,
    });

    await expect(
      prepareLimitedCreateOperation({
        request: {
          data: {
            businessID: 'business-1',
            warehouse: { name: 'Principal' },
          },
        },
        inputKey: 'warehouse',
        operation: 'warehouse.create',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        metricKey: 'warehousesTotal',
        incrementBy: 1,
      }),
    );
  });
});
