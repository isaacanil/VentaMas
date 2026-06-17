import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveCallableAuthUidMock = vi.hoisted(() => vi.fn());
const dbDocMock = vi.hoisted(() => vi.fn());
const assertUserAccessMock = vi.hoisted(() => vi.fn());
const getLedgerInsightsMock = vi.hoisted(() => vi.fn());

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
  onCall: (handler) => handler,
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  admin: {
    firestore: {
      FieldPath: {
        documentId: () => '__name__',
      },
    },
  },
  db: {
    doc: (...args) => dbDocMock(...args),
    collection: vi.fn(),
  },
}));

vi.mock('../../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    AUDIT: ['audit'],
    FINANCE_CONFIG: ['finance-config'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../services/ncfLedger.service.js', () => ({
  canonicalizeInvoice: vi.fn(),
  extractInvoiceDataFromSnapshot: vi.fn(),
  getLedgerInsights: (...args) => getLedgerInsightsMock(...args),
  rebuildLedgerForInvoice: vi.fn(),
  wipeLedgerPrefixes: vi.fn(),
}));

import { getNcfLedgerInsights } from './getNcfLedgerInsights.controller.js';
import { rebuildNcfLedger } from './rebuildNcfLedger.controller.js';

describe('NCF ledger callable auth boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue(null);
    assertUserAccessMock.mockResolvedValue({
      businessId: 'business-1',
      role: 'owner',
      status: 'active',
      source: 'canonical',
    });
  });

  it('rejects rebuild requests that provide only payload user identity', async () => {
    await expect(
      rebuildNcfLedger({
        data: {
          businessId: 'business-1',
          userId: 'spoofed-user',
          dryRun: true,
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(dbDocMock).not.toHaveBeenCalled();
    expect(assertUserAccessMock).not.toHaveBeenCalled();
  });

  it('rejects rebuild requests with a mismatched payload user id', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('actor-1');

    await expect(
      rebuildNcfLedger({
        auth: { uid: 'actor-1' },
        data: {
          businessId: 'business-1',
          userId: 'spoofed-user',
          dryRun: true,
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(dbDocMock).not.toHaveBeenCalled();
    expect(assertUserAccessMock).not.toHaveBeenCalled();
  });

  it('requires centralized finance access before rebuilding ledger records', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('actor-1');
    const accessError = Object.assign(new Error('Denied'), {
      code: 'permission-denied',
    });
    assertUserAccessMock.mockRejectedValue(accessError);

    await expect(
      rebuildNcfLedger({
        auth: { uid: 'actor-1' },
        data: {
          businessId: 'business-1',
          dryRun: true,
        },
      }),
    ).rejects.toBe(accessError);

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'actor-1',
      businessId: 'business-1',
      allowedRoles: ['finance-config'],
    });
    expect(dbDocMock).not.toHaveBeenCalled();
  });

  it('rejects insights requests that provide only payload user identity', async () => {
    await expect(
      getNcfLedgerInsights({
        data: {
          businessId: 'business-1',
          prefix: 'B01',
          sequenceNumber: 1,
          user: {
            uid: 'spoofed-user',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(dbDocMock).not.toHaveBeenCalled();
    expect(assertUserAccessMock).not.toHaveBeenCalled();
  });

  it('rejects insights requests with a mismatched payload user id', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('actor-1');

    await expect(
      getNcfLedgerInsights({
        auth: { uid: 'actor-1' },
        data: {
          businessId: 'business-1',
          prefix: 'B01',
          sequenceNumber: 1,
          user: {
            uid: 'spoofed-user',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(dbDocMock).not.toHaveBeenCalled();
    expect(assertUserAccessMock).not.toHaveBeenCalled();
  });

  it('requires centralized audit access before returning ledger insights', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('actor-1');
    const accessError = Object.assign(new Error('Denied'), {
      code: 'permission-denied',
    });
    assertUserAccessMock.mockRejectedValue(accessError);

    await expect(
      getNcfLedgerInsights({
        auth: { uid: 'actor-1' },
        data: {
          businessId: 'business-1',
          prefix: 'B01',
          sequenceNumber: 1,
        },
      }),
    ).rejects.toBe(accessError);

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'actor-1',
      businessId: 'business-1',
      allowedRoles: ['audit'],
    });
    expect(getLedgerInsightsMock).not.toHaveBeenCalled();
  });
});
