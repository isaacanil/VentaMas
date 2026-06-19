import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  MockHttpsError,
  dbMock,
  fieldValueMock,
  lookupRncRecordMock,
  onCallMock,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => {
  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }
  const transaction = {
    get: vi.fn(async () => ({
      exists: false,
      get: vi.fn(),
    })),
    set: vi.fn(),
  };
  const bucketDoc = {};
  const bucketsCollection = {
    doc: vi.fn(() => bucketDoc),
  };
  const lookupDoc = {
    collection: vi.fn(() => bucketsCollection),
  };
  const runtimeCollection = {
    doc: vi.fn(() => lookupDoc),
  };
  const db = {
    collection: vi.fn(() => runtimeCollection),
    runTransaction: vi.fn(async (callback) => callback(transaction)),
    _mocks: {
      bucketDoc,
      bucketsCollection,
      lookupDoc,
      runtimeCollection,
      transaction,
    },
  };
  const fieldValue = {
    increment: vi.fn((value) => ({ increment: value })),
    serverTimestamp: vi.fn(() => ({ serverTimestamp: true })),
  };

  return {
    dbMock: db,
    fieldValueMock: fieldValue,
    MockHttpsError: HoistedHttpsError,
    lookupRncRecordMock: vi.fn(),
    onCallMock: vi.fn((_options, handler) => handler),
    resolveCallableAuthUidMock: vi.fn(),
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (...args) => onCallMock(...args),
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: dbMock,
  FieldValue: fieldValueMock,
}));

vi.mock('../services/rncLookup.service.js', () => ({
  lookupRncRecord: (...args) => lookupRncRecordMock(...args),
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

import { RncValidationError } from '../utils/rncValidation.util.js';
import { lookupRnc } from './lookupRnc.js';

describe('lookupRnc callable', () => {
  beforeEach(() => {
    delete process.env.RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT;
    delete process.env.RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT_FAIL_OPEN;
    delete process.env.RNC_LOOKUP_RATE_LIMIT_MAX;
    delete process.env.RNC_LOOKUP_RATE_LIMIT_WINDOW_MS;
    dbMock.collection.mockClear();
    dbMock.runTransaction.mockClear();
    dbMock._mocks.bucketsCollection.doc.mockClear();
    dbMock._mocks.lookupDoc.collection.mockClear();
    dbMock._mocks.runtimeCollection.doc.mockClear();
    dbMock._mocks.transaction.get.mockClear();
    dbMock._mocks.transaction.get.mockResolvedValue({
      exists: false,
      get: vi.fn(),
    });
    dbMock._mocks.transaction.set.mockClear();
    fieldValueMock.increment.mockClear();
    fieldValueMock.serverTimestamp.mockClear();
    lookupRncRecordMock.mockReset();
    resolveCallableAuthUidMock.mockReset();
    resolveCallableAuthUidMock.mockResolvedValue('user-1');
  });

  it('delegates callable data to the lookup service', async () => {
    lookupRncRecordMock.mockResolvedValueOnce({
      found: true,
      ok: true,
      record: {
        full_name: 'Empresa Demo',
        rnc_number: '101026042',
      },
      rnc_number: '101026042',
      source: 'unit-test',
      status: 'found',
    });

    await expect(
      lookupRnc({
        data: {
          rnc: '101026042',
          sessionToken: 'session-token-1',
        },
      }),
    ).resolves.toMatchObject({
      found: true,
      ok: true,
      status: 'found',
    });

    expect(lookupRncRecordMock).toHaveBeenCalledWith({
      payload: {
        rnc: '101026042',
      },
    });
    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith({
      data: {
        rnc: '101026042',
        sessionToken: 'session-token-1',
      },
    });
    expect(dbMock.runTransaction).not.toHaveBeenCalled();
  });

  it('defines explicit runtime limits for the callable', () => {
    expect(onCallMock).toHaveBeenCalledWith(
      expect.objectContaining({
        concurrency: 20,
        maxInstances: 10,
        memory: '2GiB',
        timeoutSeconds: 180,
      }),
      expect.any(Function),
    );
  });

  it('uses the optional distributed rate limit when enabled', async () => {
    process.env.RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT = 'true';
    lookupRncRecordMock.mockResolvedValueOnce({
      found: false,
      ok: true,
      record: null,
      rnc_number: '101026042',
      source: 'unit-test',
      status: 'not_found_in_contributors_snapshot',
    });

    await expect(
      lookupRnc({
        data: {
          rnc: '101026042',
        },
      }),
    ).resolves.toMatchObject({
      ok: true,
    });

    expect(dbMock.collection).toHaveBeenCalledWith('runtimeRateLimits');
    expect(dbMock._mocks.lookupDoc.collection).toHaveBeenCalledWith(
      'rncLookupBuckets',
    );
    expect(dbMock.runTransaction).toHaveBeenCalledOnce();
    expect(dbMock._mocks.transaction.set).toHaveBeenCalledWith(
      dbMock._mocks.bucketDoc,
      expect.objectContaining({
        count: { increment: 1 },
        keyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
      { merge: true },
    );
  });

  it('rejects lookups over the configured local rate limit', async () => {
    process.env.RNC_LOOKUP_RATE_LIMIT_MAX = '1';
    process.env.RNC_LOOKUP_RATE_LIMIT_WINDOW_MS = '60000';
    resolveCallableAuthUidMock.mockResolvedValue('rate-limit-user');
    lookupRncRecordMock.mockResolvedValue({
      found: false,
      ok: true,
      record: null,
      rnc_number: '101026042',
      source: 'unit-test',
      status: 'not_found_in_contributors_snapshot',
    });

    await expect(
      lookupRnc({
        data: {
          rnc: '101026042',
        },
      }),
    ).resolves.toMatchObject({
      ok: true,
    });

    await expect(
      lookupRnc({
        data: {
          rnc: '101026042',
        },
      }),
    ).rejects.toMatchObject({
      code: 'resource-exhausted',
    });
  });

  it('fails closed when the distributed rate limit cannot be checked', async () => {
    process.env.RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT = 'true';
    dbMock.runTransaction.mockRejectedValueOnce(new Error('firestore down'));

    await expect(
      lookupRnc({
        data: {
          rnc: '101026042',
        },
      }),
    ).rejects.toMatchObject({
      code: 'unavailable',
      message: 'No se pudo validar el limite distribuido de consultas RNC.',
    });

    expect(lookupRncRecordMock).not.toHaveBeenCalled();
  });

  it('can fail open for distributed rate limit only when explicitly configured', async () => {
    process.env.RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT = 'true';
    process.env.RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT_FAIL_OPEN = 'true';
    dbMock.runTransaction.mockRejectedValueOnce(new Error('firestore down'));
    lookupRncRecordMock.mockResolvedValueOnce({
      found: false,
      ok: true,
      record: null,
      rnc_number: '101026042',
      source: 'unit-test',
      status: 'not_found_in_contributors_snapshot',
    });

    await expect(
      lookupRnc({
        data: {
          rnc: '101026042',
        },
      }),
    ).resolves.toMatchObject({
      ok: true,
    });
  });

  it('rejects unauthenticated requests before reading the SQLite repository', async () => {
    resolveCallableAuthUidMock.mockResolvedValueOnce(null);

    await expect(
      lookupRnc({
        data: {
          rnc: '101026042',
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
      message: 'Usuario no autenticado',
    });

    expect(lookupRncRecordMock).not.toHaveBeenCalled();
  });

  it('maps RNC validation failures to invalid-argument', async () => {
    lookupRncRecordMock.mockRejectedValueOnce(
      new RncValidationError('rnc debe tener exactamente 9 u 11 digitos.', {
        reason: 'invalid-length',
      }),
    );

    await expect(
      lookupRnc({
        data: {
          rnc: '123',
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      details: {
        reason: 'invalid-length',
      },
      message: 'rnc debe tener exactamente 9 u 11 digitos.',
    });
  });

  it('maps unexpected failures to internal', async () => {
    lookupRncRecordMock.mockRejectedValueOnce(new Error('boom'));

    await expect(
      lookupRnc({
        data: {
          rnc: '101026042',
        },
      }),
    ).rejects.toMatchObject({
      code: 'internal',
      message: 'No se pudo consultar el RNC.',
    });
  });
});
