import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  batchCommitCalls,
  batchSetCalls,
  collectionQueries,
  collectionSnapshots,
  makeQuery,
  MockHttpsError,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => {
  const hoistedCollectionSnapshots = new Map();
  const hoistedCollectionQueries = [];
  const hoistedBatchSetCalls = [];
  const hoistedBatchCommitCalls = [];

  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const makeDocSnapshot = (collectionPath, entry) => ({
    id: entry.id,
    ref: { path: `${collectionPath}/${entry.id}` },
    data: () => entry.data,
  });

  const makeQuery = (collectionPath, options = {}) => ({
    collectionPath,
    options,
    orderBy(field) {
      return makeQuery(collectionPath, { ...options, orderBy: field });
    },
    startAfter(docId) {
      return makeQuery(collectionPath, { ...options, startAfter: docId });
    },
    limit(queryLimit) {
      return makeQuery(collectionPath, { ...options, queryLimit });
    },
    async get() {
      hoistedCollectionQueries.push({ collectionPath, options });
      let entries = [
        ...(hoistedCollectionSnapshots.get(collectionPath) ?? []),
      ].sort((left, right) => left.id.localeCompare(right.id));

      if (options.startAfter) {
        entries = entries.filter((entry) => entry.id > options.startAfter);
      }

      if (options.queryLimit != null) {
        entries = entries.slice(0, options.queryLimit);
      }

      const docs = entries.map((entry) =>
        makeDocSnapshot(collectionPath, entry),
      );
      return {
        empty: docs.length === 0,
        size: docs.length,
        docs,
      };
    },
  });

  return {
    assertUserAccessMock: vi.fn(),
    batchCommitCalls: hoistedBatchCommitCalls,
    batchSetCalls: hoistedBatchSetCalls,
    collectionQueries: hoistedCollectionQueries,
    collectionSnapshots: hoistedCollectionSnapshots,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: vi.fn(),
    makeQuery,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_options, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  FieldPath: {
    documentId: () => '__name__',
  },
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-05-17T12:00:00.000Z'));
    }

    toMillis() {
      return this.millis;
    }
  },
  db: {
    collection: (path) => makeQuery(path),
    batch: () => ({
      set: (ref, data, options) => {
        batchSetCalls.push({ ref, data, options });
      },
      commit: async () => {
        batchCommitCalls.push({ committed: true });
      },
    }),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    ACCOUNTING_ADMIN: ['owner', 'admin', 'controller'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: vi.fn(async () => ({
    generalAccountingEnabled: true,
    rolloutEnabled: true,
  })),
  isAccountingRolloutEnabledForBusiness: vi.fn(() => true),
}));

import {
  backfillJournalEntryAccountIds,
  deriveJournalEntryAccountIds,
  journalEntryAccountIdsAreCurrent,
} from './backfillJournalEntryAccountIds.js';

describe('backfillJournalEntryAccountIds', () => {
  beforeEach(() => {
    collectionSnapshots.clear();
    collectionQueries.length = 0;
    batchSetCalls.length = 0;
    batchCommitCalls.length = 0;
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('controller-1');
    assertUserAccessMock.mockResolvedValue(undefined);
  });

  it('populates unique accountIds from journal entry lines', async () => {
    collectionSnapshots.set('businesses/business-1/journalEntries', [
      {
        id: 'entry-1',
        data: {
          lines: [
            { accountId: 'cash' },
            { accountId: 'revenue' },
            { accountId: 'cash' },
          ],
        },
      },
    ]);

    const result = await backfillJournalEntryAccountIds({
      data: {
        businessId: 'business-1',
        dryRun: false,
        pageSize: 50,
        maxPages: 1,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        processed: 1,
        updated: 1,
        skipped: 0,
        errors: 0,
      }),
    );
    expect(batchSetCalls).toHaveLength(1);
    expect(batchSetCalls[0]).toEqual(
      expect.objectContaining({
        ref: { path: 'businesses/business-1/journalEntries/entry-1' },
        data: expect.objectContaining({
          accountIds: ['cash', 'revenue'],
          accountIdsBackfill: expect.objectContaining({
            version: 'journal-entry-account-ids-v1',
            updatedBy: 'controller-1',
          }),
        }),
        options: { merge: true },
      }),
    );
    expect(batchCommitCalls).toHaveLength(1);
  });

  it('does not rewrite entries with correct accountIds', async () => {
    collectionSnapshots.set('businesses/business-1/journalEntries', [
      {
        id: 'entry-1',
        data: {
          accountIds: ['revenue', 'cash'],
          lines: [{ accountId: 'cash' }, { accountId: 'revenue' }],
        },
      },
    ]);

    const result = await backfillJournalEntryAccountIds({
      data: {
        businessId: 'business-1',
        dryRun: false,
        pageSize: 50,
        maxPages: 1,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        processed: 1,
        updated: 0,
        skipped: 1,
        errors: 0,
      }),
    );
    expect(batchSetCalls).toHaveLength(0);
    expect(batchCommitCalls).toHaveLength(0);
  });

  it('reports and skips entries with empty lines', async () => {
    collectionSnapshots.set('businesses/business-1/journalEntries', [
      {
        id: 'entry-1',
        data: {
          lines: [],
        },
      },
    ]);

    const result = await backfillJournalEntryAccountIds({
      data: {
        businessId: 'business-1',
        dryRun: false,
      },
    });

    expect(result.errors).toBe(1);
    expect(result.errorSamples[0]).toEqual(
      expect.objectContaining({
        entryId: 'entry-1',
        code: 'empty_lines',
      }),
    );
    expect(batchSetCalls).toHaveLength(0);
  });

  it('reports and skips entries with a line missing accountId', async () => {
    collectionSnapshots.set('businesses/business-1/journalEntries', [
      {
        id: 'entry-1',
        data: {
          lines: [{ accountId: 'cash' }, { debit: 100 }],
        },
      },
    ]);

    const result = await backfillJournalEntryAccountIds({
      data: {
        businessId: 'business-1',
        dryRun: false,
      },
    });

    expect(result.errors).toBe(1);
    expect(result.errorSamples[0]).toEqual(
      expect.objectContaining({
        entryId: 'entry-1',
        code: 'missing_line_account_id',
        missingLineIndexes: [2],
      }),
    );
    expect(batchSetCalls).toHaveLength(0);
  });

  it('does not cross businessId boundaries', async () => {
    collectionSnapshots.set('businesses/business-1/journalEntries', [
      {
        id: 'entry-1',
        data: {
          lines: [{ accountId: 'cash' }],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-2/journalEntries', [
      {
        id: 'entry-2',
        data: {
          lines: [{ accountId: 'bank' }],
        },
      },
    ]);

    await backfillJournalEntryAccountIds({
      data: {
        businessId: 'business-1',
        dryRun: false,
      },
    });

    expect(collectionQueries).toEqual([
      expect.objectContaining({
        collectionPath: 'businesses/business-1/journalEntries',
      }),
    ]);
    expect(batchSetCalls.map((call) => call.ref.path)).toEqual([
      'businesses/business-1/journalEntries/entry-1',
    ]);
  });

  it('is safe to run repeatedly once accountIds are current', async () => {
    const firstDerivation = deriveJournalEntryAccountIds({
      lines: [{ accountId: 'cash' }, { accountId: 'revenue' }],
    });

    expect(firstDerivation).toEqual({
      ok: true,
      accountIds: ['cash', 'revenue'],
    });
    expect(
      journalEntryAccountIdsAreCurrent(
        ['revenue', 'cash'],
        firstDerivation.accountIds,
      ),
    ).toBe(true);
  });
});
