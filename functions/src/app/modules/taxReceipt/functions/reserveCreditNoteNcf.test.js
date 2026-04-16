import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  businessDocGetMock,
  MockHttpsError,
  reserveNcfMock,
  resolveCallableAuthUidMock,
  runTransactionMock,
  serverTimestampMock,
  txSetMock,
} = vi.hoisted(() => {
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedBusinessDocGetMock = vi.fn();
  const hoistedReserveNcfMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();
  const hoistedServerTimestampMock = vi.fn(() => 'server-timestamp');
  const hoistedTxSetMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    businessDocGetMock: hoistedBusinessDocGetMock,
    MockHttpsError: HoistedHttpsError,
    reserveNcfMock: hoistedReserveNcfMock,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: hoistedRunTransactionMock,
    serverTimestampMock: hoistedServerTimestampMock,
    txSetMock: hoistedTxSetMock,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_config, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    runTransaction: (...args) => runTransactionMock(...args),
    doc: (path) => ({
      id: path.split('/').at(-1),
      path,
      get: (...args) => businessDocGetMock(path, ...args),
    }),
  },
  FieldValue: {
    serverTimestamp: (...args) => serverTimestampMock(...args),
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
    businessDocGetMock.mockImplementation(async (path) => {
      if (path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            business: {
              features: {
                fiscal: {
                  sequenceEngineV2Enabled: true,
                },
              },
            },
          }),
        };
      }

      return {
        exists: true,
        data: () => ({}),
      };
    });
    reserveNcfMock.mockResolvedValue({
      ncfCode: 'B040100000001',
      usageId: 'usage-1',
      taxReceiptRef: {
        id: 'receipt-1',
      },
    });
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        kind: 'tx',
        set: txSetMock,
      }),
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
      { kind: 'tx', set: txSetMock },
      {
        businessId: 'business-1',
        userId: 'user-1',
        ncfType: 'NOTAS DE CRÉDITO',
      },
    );
    expect(serverTimestampMock).toHaveBeenCalledTimes(1);
    expect(txSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'usage-1',
        path: 'businesses/business-1/fiscalSequenceAudit/usage-1',
      }),
      {
        id: 'usage-1',
        businessId: 'business-1',
        usageId: 'usage-1',
        userId: 'user-1',
        eventType: 'credit_note_ncf_reserved',
        sourceType: 'creditNote',
        sourceFunction: 'reserveCreditNoteNcf',
        taxReceiptName: 'NOTAS DE CRÉDITO',
        taxReceiptId: 'receipt-1',
        ncfCode: 'B040100000001',
        ncfPrefix: 'B04',
        ncfSequence: '0100000001',
        ncfSequenceNumber: 100000001,
        ncfSequenceLength: 10,
        engine: 'backend.reserveNcf',
        status: 'reserved',
        createdAt: 'server-timestamp',
      },
    );
    expect(result).toEqual({
      ok: true,
      ncfCode: 'B040100000001',
      usageId: 'usage-1',
      engine: 'backend.reserveNcf',
    });
  });

  it('rechaza cuando el rollout fiscal no habilita el motor de secuencia v2', async () => {
    businessDocGetMock.mockImplementation(async (path) => {
      if (path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            business: {
              features: {
                fiscal: {
                  sequenceEngineV2Enabled: false,
                },
              },
            },
          }),
        };
      }

      return {
        exists: true,
        data: () => ({}),
      };
    });

    await expect(
      reserveCreditNoteNcf({
        data: { businessId: 'business-1' },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'El motor fiscal v2 no está habilitado para este negocio.',
    });

    expect(reserveNcfMock).not.toHaveBeenCalled();
    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(txSetMock).not.toHaveBeenCalled();
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
