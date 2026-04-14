import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  MockHttpsError,
  reserveNcfMock,
  resolveCallableAuthUidMock,
  runTransactionMock,
} = vi.hoisted(() => {
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedReserveNcfMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    MockHttpsError: HoistedHttpsError,
    reserveNcfMock: hoistedReserveNcfMock,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: hoistedRunTransactionMock,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_config, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/ncf.service.js', () => ({
  reserveNcf: (...args) => reserveNcfMock(...args),
}));

import { reserveCreditNoteNcf } from './reserveCreditNoteNcf.js';

describe('reserveCreditNoteNcf', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    reserveNcfMock.mockResolvedValue({
      ncfCode: 'B040100000001',
      usageId: 'usage-1',
    });
    runTransactionMock.mockImplementation(async (callback) =>
      callback({ kind: 'tx' }),
    );
  });

  it('reserva el NCF de nota de credito usando reserveNcf', async () => {
    const result = await reserveCreditNoteNcf({
      data: { businessId: 'business-1' },
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: ['invoice-operator'],
    });
    expect(reserveNcfMock).toHaveBeenCalledWith(
      { kind: 'tx' },
      {
        businessId: 'business-1',
        userId: 'user-1',
        ncfType: 'NOTAS DE CRÉDITO',
      },
    );
    expect(result).toEqual({
      ok: true,
      ncfCode: 'B040100000001',
      usageId: 'usage-1',
      engine: 'backend.reserveNcf',
    });
  });

  it('rechaza cuando falta businessId', async () => {
    await expect(
      reserveCreditNoteNcf({
        data: {},
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'businessId es requerido',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(reserveNcfMock).not.toHaveBeenCalled();
  });
});
