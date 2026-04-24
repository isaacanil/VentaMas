import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  collectionSnapshots,
  documentRefs,
  documentSnapshots,
  getDocRef,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
  runTransactionMock,
} = vi.hoisted(() => {
  const hoistedDocumentSnapshots = new Map();
  const hoistedCollectionSnapshots = new Map();
  const hoistedDocumentRefs = new Map();
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      hoistedDocumentRefs.set(path, {
        path,
        get: vi.fn(async () => ({
          exists: hoistedDocumentSnapshots.has(path),
          id: path.split('/').at(-1) ?? null,
          data: () => hoistedDocumentSnapshots.get(path),
        })),
        set: vi.fn(async (data) => {
          hoistedDocumentSnapshots.set(path, data);
        }),
        update: vi.fn(async (data) => {
          const current = hoistedDocumentSnapshots.get(path) ?? {};
          hoistedDocumentSnapshots.set(path, { ...current, ...data });
        }),
        delete: vi.fn(async () => {
          hoistedDocumentSnapshots.delete(path);
        }),
      });
    }

    return hoistedDocumentRefs.get(path);
  };

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    collectionSnapshots: hoistedCollectionSnapshots,
    documentRefs: hoistedDocumentRefs,
    documentSnapshots: hoistedDocumentSnapshots,
    getDocRef: hoistedGetDocRef,
    getPilotAccountingSettingsForBusinessMock:
      hoistedGetPilotAccountingSettingsForBusinessMock,
    isAccountingRolloutEnabledForBusinessMock:
      hoistedIsAccountingRolloutEnabledForBusinessMock,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: hoistedRunTransactionMock,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (...args) => (typeof args[0] === 'function' ? args[0] : args[1]),
}));

vi.mock('../../../core/config/firebase.js', () => ({
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-04-05T15:00:00.000Z'));
    }

    static fromMillis(millis) {
      return new MockTimestamp(millis);
    }

    toMillis() {
      return this.millis;
    }

    toDate() {
      return new Date(this.millis);
    }
  },
  db: {
    doc: (path) => getDocRef(path),
    collection: (path) => ({
      path,
      get: vi.fn(async () => ({
        docs: (collectionSnapshots.get(path) ?? []).map((entry) => ({
          id: entry.id,
          data: () => entry.data,
        })),
      })),
    }),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    INVOICE_OPERATOR: ['invoice_operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: (...args) =>
    getPilotAccountingSettingsForBusinessMock(...args),
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

import { replayAccountingEventProjection } from './replayAccountingEventProjection.js';

describe('replayAccountingEventProjection', () => {
  beforeEach(() => {
    documentSnapshots.clear();
    documentRefs.clear();
    collectionSnapshots.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: vi.fn(async (ref) => ({
          exists: documentSnapshots.has(ref.path),
          id: ref.path.split('/').at(-1) ?? null,
          data: () => documentSnapshots.get(ref.path),
        })),
        set: vi.fn((ref, data) => {
          documentSnapshots.set(ref.path, data);
        }),
        update: vi.fn((ref, data) => {
          const current = documentSnapshots.get(ref.path) ?? {};
          documentSnapshots.set(ref.path, { ...current, ...data });
        }),
      }),
    );
  });

  it('replays a failed event and creates the missing journal entry', async () => {
    documentSnapshots.set('businesses/business-1/accountingEvents/event-1', {
      id: 'event-1',
      businessId: 'business-1',
      eventType: 'purchase.committed',
      eventVersion: 1,
      sourceType: 'purchase',
      sourceId: 'purchase-1',
      sourceDocumentType: 'purchase',
      sourceDocumentId: 'purchase-1',
      monetary: {
        amount: 100,
        functionalAmount: 6200,
      },
      projection: {
        status: 'failed',
        attemptCount: 1,
        replayCount: 0,
      },
    });
    documentSnapshots.set(
      'businesses/business-1/accountingEventProjectionDeadLetters/event-1',
      {
        id: 'event-1',
        projectionStatus: 'failed',
      },
    );
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-1',
        data: {
          id: 'profile-1',
          name: 'Compra registrada',
          description: 'Compra proyectada',
          eventType: 'purchase.committed',
          status: 'active',
          priority: 10,
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'inventory',
              amountSource: 'purchase_total',
            },
            {
              id: 'l2',
              side: 'credit',
              accountSystemKey: 'accounts_payable',
              amountSource: 'purchase_total',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'inventory-1',
        data: {
          id: 'inventory-1',
          code: '1130',
          name: 'Inventario',
          status: 'active',
          postingAllowed: true,
          systemKey: 'inventory',
        },
      },
      {
        id: 'ap-1',
        data: {
          id: 'ap-1',
          code: '2100',
          name: 'Cuentas por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_payable',
        },
      },
    ]);

    const response = await replayAccountingEventProjection({
      data: {
        businessId: 'business-1',
        eventId: 'event-1',
      },
    });

    expect(response).toMatchObject({
      ok: true,
      eventId: 'event-1',
      status: 'projected',
      journalEntryId: 'event-1',
      reusedExistingEntry: false,
    });
    expect(
      documentSnapshots.get('businesses/business-1/journalEntries/event-1'),
    ).toMatchObject({
      id: 'event-1',
      eventId: 'event-1',
      eventType: 'purchase.committed',
    });
    expect(
      documentSnapshots.get('businesses/business-1/accountingEvents/event-1'),
    ).toMatchObject({
      projection: expect.objectContaining({
        status: 'projected',
        journalEntryId: 'event-1',
        attemptCount: 2,
        replayCount: 1,
      }),
      'metadata.journalEntryId': 'event-1',
    });
    expect(
      documentSnapshots.has(
        'businesses/business-1/accountingEventProjectionDeadLetters/event-1',
      ),
    ).toBe(false);
  });

  it('repairs projection state without duplicating the journal entry when it already exists', async () => {
    documentSnapshots.set('businesses/business-1/accountingEvents/event-2', {
      id: 'event-2',
      businessId: 'business-1',
      eventType: 'purchase.committed',
      sourceType: 'purchase',
      sourceId: 'purchase-2',
      sourceDocumentType: 'purchase',
      sourceDocumentId: 'purchase-2',
      monetary: {
        amount: 100,
        functionalAmount: 6200,
      },
      projection: {
        status: 'failed',
        attemptCount: 1,
        replayCount: 0,
      },
    });
    documentSnapshots.set('businesses/business-1/journalEntries/event-2', {
      id: 'event-2',
      eventId: 'event-2',
      eventType: 'purchase.committed',
    });
    documentSnapshots.set(
      'businesses/business-1/accountingEventProjectionDeadLetters/event-2',
      {
        id: 'event-2',
        projectionStatus: 'failed',
      },
    );
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', []);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', []);

    const response = await replayAccountingEventProjection({
      data: {
        businessId: 'business-1',
        eventId: 'event-2',
      },
    });

    expect(response).toMatchObject({
      ok: true,
      eventId: 'event-2',
      status: 'projected',
      journalEntryId: 'event-2',
      reusedExistingEntry: true,
    });
    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(
      documentSnapshots.get('businesses/business-1/journalEntries/event-2'),
    ).toMatchObject({
      id: 'event-2',
      eventId: 'event-2',
    });
    expect(
      documentSnapshots.get('businesses/business-1/accountingEvents/event-2'),
    ).toMatchObject({
      projection: expect.objectContaining({
        status: 'projected',
        journalEntryId: 'event-2',
        attemptCount: 2,
        replayCount: 1,
      }),
      'metadata.journalEntryId': 'event-2',
    });
    expect(
      documentSnapshots.has(
        'businesses/business-1/accountingEventProjectionDeadLetters/event-2',
      ),
    ).toBe(false);
  });
});
