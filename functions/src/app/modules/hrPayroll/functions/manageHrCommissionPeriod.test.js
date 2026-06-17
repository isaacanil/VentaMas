import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  collectionSnapshots,
  documentRefs,
  documentSnapshots,
  getDocRef,
  makeQuery,
  MockHttpsError,
  resolveCallableAuthUidMock,
  runTransactionMock,
  setCalls,
} = vi.hoisted(() => {
  const hoistedCollectionSnapshots = new Map();
  const hoistedDocumentRefs = new Map();
  const hoistedDocumentSnapshots = new Map();
  const hoistedSetCalls = [];

  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const toMillis = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value.getTime();
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    return Number(value);
  };

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      hoistedDocumentRefs.set(path, {
        id: path.split('/').at(-1) ?? null,
        path,
      });
    }
    return hoistedDocumentRefs.get(path);
  };

  const toDocSnapshot = (collectionPath, entry) => ({
    exists: entry?.data != null,
    id: entry?.id ?? collectionPath.split('/').at(-1) ?? null,
    ref: hoistedGetDocRef(`${collectionPath}/${entry?.id}`),
    data: () => entry?.data,
  });

  const toSingleSnapshot = (ref) => {
    const data = hoistedDocumentSnapshots.get(ref.path);
    return {
      exists: data != null,
      id: ref.id,
      ref,
      data: () => data,
    };
  };

  const matchesFilter = (entry, filter) => {
    const value = entry.data?.[filter.field];
    if (filter.operator === '==') return value === filter.value;

    const left = toMillis(value);
    const right = toMillis(filter.value);
    if (left == null || right == null) return false;
    if (filter.operator === '>=') return left >= right;
    if (filter.operator === '<=') return left <= right;
    return true;
  };

  const executeQuery = (queryRef) => {
    const entries = hoistedCollectionSnapshots.get(queryRef.path) ?? [];
    const filteredEntries = (queryRef.filters ?? []).reduce(
      (current, filter) =>
        current.filter((entry) => matchesFilter(entry, filter)),
      entries,
    );
    const orderedEntries = queryRef.order
      ? [...filteredEntries].sort((left, right) => {
          const leftValue = toMillis(left.data?.[queryRef.order.field]);
          const rightValue = toMillis(right.data?.[queryRef.order.field]);
          return (leftValue ?? 0) - (rightValue ?? 0);
        })
      : filteredEntries;
    const limitedEntries = orderedEntries.slice(
      0,
      queryRef.queryLimit ?? orderedEntries.length,
    );

    return {
      docs: limitedEntries.map((entry) => toDocSnapshot(queryRef.path, entry)),
    };
  };

  const makeQuery = (path, filters = [], order = null, queryLimit = null) => ({
    path,
    filters,
    order,
    queryLimit,
    where(field, operator, value) {
      return makeQuery(
        path,
        [...filters, { field, operator, value }],
        order,
        queryLimit,
      );
    },
    orderBy(field, direction = 'asc') {
      return makeQuery(path, filters, { direction, field }, queryLimit);
    },
    limit(nextLimit) {
      return makeQuery(path, filters, order, nextLimit);
    },
    get: vi.fn(async () => executeQuery({ path, filters, order, queryLimit })),
  });

  return {
    assertUserAccessMock: vi.fn(),
    collectionSnapshots: hoistedCollectionSnapshots,
    documentRefs: hoistedDocumentRefs,
    documentSnapshots: hoistedDocumentSnapshots,
    getDocRef: hoistedGetDocRef,
    makeQuery,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: vi.fn(),
    runTransactionMock: vi.fn(async (callback) =>
      callback({
        get: vi.fn(async (ref) =>
          ref?.filters ? executeQuery(ref) : toSingleSnapshot(ref),
        ),
        set: vi.fn((ref, data, options) => {
          hoistedSetCalls.push({ data, options, ref });
        }),
      }),
    ),
    setCalls: hoistedSetCalls,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  FieldValue: {
    serverTimestamp: () => 'server-timestamp',
  },
  Timestamp: class MockTimestamp {
    constructor(date) {
      this.date = date;
    }

    static fromDate(date) {
      return new MockTimestamp(date);
    }

    toDate() {
      return this.date;
    }

    toMillis() {
      return this.date.getTime();
    }
  },
  db: {
    collection: (path) => makeQuery(path),
    doc: (path) => ({
      ...getDocRef(path),
      get: vi.fn(async () => {
        const data = documentSnapshots.get(path);
        return {
          exists: data != null,
          id: path.split('/').at(-1) ?? null,
          ref: getDocRef(path),
          data: () => data,
        };
      }),
    }),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    ACCOUNTING_WRITE: ['accounting-write'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

import { manageHrCommissionPeriod } from './manageHrCommissionPeriod.js';

const buildRequest = (data) => ({ data });

const seedActiveBiweeklyRule = () => {
  documentSnapshots.set(
    'businesses/business-1/hrCommissionCutRules/rule-active',
    {
      id: 'rule-active',
      businessId: 'business-1',
      label: 'Corte quincenal',
      frequency: 'biweekly',
      startDay: 1,
      endDay: 15,
      active: true,
    },
  );
};

const buildCommissionEntry = (index, date = '2026-06-10T12:00:00.000Z') => ({
  id: `entry-${index}`,
  data: {
    employeeId: `emp-${index}`,
    employeeCode: `E-${index}`,
    employeeNameSnapshot: `Colaborador ${index}`,
    commissionAmount: 10,
    currency: 'DOP',
    status: 'calculated',
    date: new Date(date),
    periodId: null,
    payrollRunId: null,
  },
});

const seedGeneratedPeriod = (status = 'approved') => {
  collectionSnapshots.set('businesses/business-1/hrCommissionPeriods', [
    {
      id: 'commission_2026-06-01_2026-06-15',
      data: {
        id: 'commission_2026-06-01_2026-06-15',
        businessId: 'business-1',
        cutRuleId: 'rule-active',
        label: 'Primera quincena 2026-06-01 - 2026-06-15',
        status,
        startDateKey: '2026-06-01',
        endDateKey: '2026-06-15',
        businessTimeZone: 'America/Santo_Domingo',
        startDate: new Date('2026-06-01T04:00:00.000Z'),
        endDate: new Date('2026-06-16T03:59:59.999Z'),
      },
    },
  ]);
};

const buildRetroactiveEntry = (
  id = 'entry-retro',
  overrides = {},
  date = '2026-06-10T12:00:00.000Z',
) => ({
  id,
  data: {
    businessId: 'business-1',
    employeeId: 'emp-1',
    employeeCode: 'EMP-001',
    employeeNameSnapshot: 'Ana Perez',
    commissionAmount: 25,
    currency: 'DOP',
    status: 'calculated',
    date: new Date(date),
    periodId: null,
    payrollRunId: null,
    payrollEmployeeLineId: null,
    employeePaymentId: null,
    ...overrides,
  },
});

describe('manageHrCommissionPeriod safeguards', () => {
  beforeEach(() => {
    collectionSnapshots.clear();
    documentRefs.clear();
    documentSnapshots.clear();
    setCalls.length = 0;
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('admin-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-08T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('previews the next cut without writing period or entry changes', async () => {
    seedActiveBiweeklyRule();
    collectionSnapshots.set('businesses/business-1/hrCommissionPeriods', []);
    collectionSnapshots.set('businesses/business-1/hrEmployees', []);
    collectionSnapshots.set('businesses/business-1/hrCommissionEntries', [
      buildCommissionEntry(1),
    ]);

    const result = await manageHrCommissionPeriod(
      buildRequest({
        action: 'preview_next',
        businessId: 'business-1',
        ruleId: 'rule-active',
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      preview: true,
      canCreate: true,
      startDateKey: '2026-06-01',
      endDateKey: '2026-06-15',
      businessTimeZone: 'America/Santo_Domingo',
      entriesCount: 1,
      employeesCount: 1,
      totalEstimatedAmount: 10,
      currency: 'DOP',
      exceedsMaxCutEntries: false,
      hasRetroactiveEntries: false,
    });
    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(setCalls).toHaveLength(0);
  });

  it('returns a blocked preview when eligible entries exceed the cut limit', async () => {
    seedActiveBiweeklyRule();
    collectionSnapshots.set('businesses/business-1/hrCommissionPeriods', []);
    collectionSnapshots.set('businesses/business-1/hrEmployees', []);
    collectionSnapshots.set(
      'businesses/business-1/hrCommissionEntries',
      Array.from({ length: 451 }, (_, index) =>
        buildCommissionEntry(index + 1),
      ),
    );

    const result = await manageHrCommissionPeriod(
      buildRequest({
        action: 'preview_next',
        businessId: 'business-1',
        ruleId: 'rule-active',
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      preview: true,
      blocked: true,
      canCreate: false,
      exceedsMaxCutEntries: true,
      maxCutEntries: 450,
    });
    expect(result.blockedReason).toContain('450');
    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(setCalls).toHaveLength(0);
  });

  it('returns a blocked preview instead of throwing when there are no entries to cut', async () => {
    seedActiveBiweeklyRule();
    collectionSnapshots.set('businesses/business-1/hrCommissionPeriods', []);
    collectionSnapshots.set('businesses/business-1/hrEmployees', []);
    collectionSnapshots.set('businesses/business-1/hrCommissionEntries', []);

    const result = await manageHrCommissionPeriod(
      buildRequest({
        action: 'preview_next',
        businessId: 'business-1',
        ruleId: 'rule-active',
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      preview: true,
      blocked: true,
      canCreate: false,
      entriesCount: 0,
      employeesCount: 0,
      startDateKey: '2026-06-01',
      endDateKey: '2026-06-15',
    });
    expect(result.blockedReason).toContain('No hay comisiones');
    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(setCalls).toHaveLength(0);
  });

  it('reports retroactive entries in generated ranges without creating a cut', async () => {
    seedActiveBiweeklyRule();
    collectionSnapshots.set('businesses/business-1/hrEmployees', []);
    collectionSnapshots.set('businesses/business-1/hrCommissionPeriods', [
      {
        id: 'commission_2026-06-01_2026-06-15',
        data: {
          id: 'commission_2026-06-01_2026-06-15',
          businessId: 'business-1',
          cutRuleId: 'rule-active',
          label: 'Primera quincena 2026-06-01 - 2026-06-15',
          status: 'approved',
          startDateKey: '2026-06-01',
          endDateKey: '2026-06-15',
          businessTimeZone: 'America/Santo_Domingo',
          startDate: new Date('2026-06-01T04:00:00.000Z'),
          endDate: new Date('2026-06-16T03:59:59.999Z'),
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/hrCommissionEntries', [
      buildCommissionEntry(1, '2026-06-10T12:00:00.000Z'),
    ]);

    const result = await manageHrCommissionPeriod(
      buildRequest({
        action: 'preview_next',
        businessId: 'business-1',
        ruleId: 'rule-active',
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      preview: true,
      blocked: true,
      canCreate: false,
      hasRetroactiveEntries: true,
      retroactiveEntriesCount: 1,
      startDateKey: '2026-06-16',
      endDateKey: '2026-06-30',
    });
    expect(result.blockedReason).toContain('retroactivas');
    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(setCalls).toHaveLength(0);
  });

  it('lists retroactive entries from locked periods as adjustment-required', async () => {
    seedActiveBiweeklyRule();
    collectionSnapshots.set('businesses/business-1/hrEmployees', []);
    seedGeneratedPeriod('approved');
    collectionSnapshots.set('businesses/business-1/hrCommissionEntries', [
      buildRetroactiveEntry('entry-approved'),
    ]);

    const result = await manageHrCommissionPeriod(
      buildRequest({
        action: 'list_retroactive_entries',
        businessId: 'business-1',
        ruleId: 'rule-active',
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      targetPeriodId: 'commission_2026-06-16_2026-06-30',
      totalCount: 1,
      adjustmentRequiredCount: 1,
      recalculableCount: 0,
    });
    expect(result.entries[0]).toMatchObject({
      id: 'entry-approved',
      action: 'adjustment_required',
      originalPeriodStatus: 'approved',
      commissionAmount: 25,
    });
  });

  it('lists retroactive entries from draft periods as recalculable', async () => {
    seedActiveBiweeklyRule();
    collectionSnapshots.set('businesses/business-1/hrEmployees', []);
    seedGeneratedPeriod('draft');
    collectionSnapshots.set('businesses/business-1/hrCommissionEntries', [
      buildRetroactiveEntry('entry-draft'),
    ]);

    const result = await manageHrCommissionPeriod(
      buildRequest({
        action: 'list_retroactive_entries',
        businessId: 'business-1',
        ruleId: 'rule-active',
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      totalCount: 1,
      adjustmentRequiredCount: 0,
      recalculableCount: 1,
    });
    expect(result.entries[0]).toMatchObject({
      id: 'entry-draft',
      action: 'recalculable',
      originalPeriodStatus: 'draft',
    });
  });

  it('marks locked-period retroactive entries for the next cut', async () => {
    seedActiveBiweeklyRule();
    collectionSnapshots.set('businesses/business-1/hrEmployees', []);
    seedGeneratedPeriod('approved');
    const retroactiveEntry = buildRetroactiveEntry('entry-retro');
    collectionSnapshots.set('businesses/business-1/hrCommissionEntries', [
      retroactiveEntry,
    ]);
    documentSnapshots.set(
      'businesses/business-1/hrCommissionEntries/entry-retro',
      retroactiveEntry.data,
    );

    const result = await manageHrCommissionPeriod(
      buildRequest({
        action: 'resolve_retroactive_entries',
        businessId: 'business-1',
        ruleId: 'rule-active',
        entryIds: ['entry-retro'],
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      targetPeriodId: 'commission_2026-06-16_2026-06-30',
      resolvedCount: 1,
      entryIds: ['entry-retro'],
    });
    expect(setCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: expect.objectContaining({
            path: 'businesses/business-1/hrCommissionEntries/entry-retro',
          }),
          data: expect.objectContaining({
            isRetroactive: true,
            originalPeriodId: 'commission_2026-06-01_2026-06-15',
            originalPeriodStatus: 'approved',
            retroactiveResolutionStatus: 'selected_for_next_cut',
            retroactiveTargetPeriodId: 'commission_2026-06-16_2026-06-30',
            retroactiveTargetStartDateKey: '2026-06-16',
            retroactiveTargetEndDateKey: '2026-06-30',
          }),
        }),
      ]),
    );
  });

  it('removes a retroactive selection before it is included in a cut', async () => {
    seedActiveBiweeklyRule();
    collectionSnapshots.set('businesses/business-1/hrEmployees', []);
    seedGeneratedPeriod('approved');
    const retroactiveEntry = buildRetroactiveEntry('entry-retro', {
      originalPeriodId: 'commission_2026-06-01_2026-06-15',
      originalPeriodStatus: 'approved',
      retroactiveResolutionStatus: 'selected_for_next_cut',
      retroactiveTargetPeriodId: 'commission_2026-06-16_2026-06-30',
    });
    collectionSnapshots.set('businesses/business-1/hrCommissionEntries', [
      retroactiveEntry,
    ]);
    documentSnapshots.set(
      'businesses/business-1/hrCommissionEntries/entry-retro',
      retroactiveEntry.data,
    );

    const result = await manageHrCommissionPeriod(
      buildRequest({
        action: 'unresolve_retroactive_entries',
        businessId: 'business-1',
        ruleId: 'rule-active',
        entryIds: ['entry-retro'],
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      unresolvedCount: 1,
      entryIds: ['entry-retro'],
    });
    expect(setCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            retroactiveResolutionStatus: null,
            retroactiveTargetPeriodId: null,
            retroactiveTargetRuleId: null,
          }),
        }),
      ]),
    );
  });

  it('creates the next cut with selected retroactive adjustments', async () => {
    seedActiveBiweeklyRule();
    collectionSnapshots.set('businesses/business-1/hrEmployees', []);
    seedGeneratedPeriod('approved');
    const normalEntry = buildCommissionEntry(
      'normal',
      '2026-06-20T12:00:00.000Z',
    );
    normalEntry.data.businessId = 'business-1';
    const retroactiveEntry = buildRetroactiveEntry('entry-retro', {
      originalPeriodId: 'commission_2026-06-01_2026-06-15',
      originalPeriodLabel: 'Primera quincena',
      originalStartDateKey: '2026-06-01',
      originalEndDateKey: '2026-06-15',
      originalPeriodStatus: 'approved',
      retroactiveResolutionStatus: 'selected_for_next_cut',
      retroactiveTargetPeriodId: 'commission_2026-06-16_2026-06-30',
      retroactiveTargetStartDateKey: '2026-06-16',
      retroactiveTargetEndDateKey: '2026-06-30',
    });
    collectionSnapshots.set('businesses/business-1/hrCommissionEntries', [
      normalEntry,
      retroactiveEntry,
    ]);
    documentSnapshots.set(
      'businesses/business-1/hrCommissionEntries/entry-normal',
      normalEntry.data,
    );
    documentSnapshots.set(
      'businesses/business-1/hrCommissionEntries/entry-retro',
      retroactiveEntry.data,
    );

    const result = await manageHrCommissionPeriod(
      buildRequest({
        action: 'create',
        businessId: 'business-1',
        ruleId: 'rule-active',
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      periodId: 'commission_2026-06-16_2026-06-30',
      entriesCount: 2,
      normalEntriesCount: 1,
      retroactiveAdjustmentAmount: 25,
      retroactiveAdjustmentsCount: 1,
    });
    expect(setCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: expect.objectContaining({
            path: 'businesses/business-1/hrCommissionPeriods/commission_2026-06-16_2026-06-30',
          }),
          data: expect.objectContaining({
            entriesCount: 2,
            normalEntriesCount: 1,
            totalCommissionAmount: 10,
            retroactiveAdjustmentAmount: 25,
            hasRetroactiveAdjustments: true,
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            retroactiveEntryIds: ['entry-retro'],
            retroactiveAdjustmentAmount: 25,
          }),
        }),
        expect.objectContaining({
          ref: expect.objectContaining({
            path: 'businesses/business-1/hrCommissionEntries/entry-retro',
          }),
          data: expect.objectContaining({
            status: 'included_in_cut',
            isRetroactive: true,
            retroactiveResolutionStatus: 'included_in_cut',
          }),
        }),
      ]),
    );
  });

  it('aborts when normal and selected retroactive entries exceed the cut limit', async () => {
    seedActiveBiweeklyRule();
    collectionSnapshots.set('businesses/business-1/hrEmployees', []);
    seedGeneratedPeriod('approved');
    const retroactiveEntry = buildRetroactiveEntry('entry-retro', {
      originalPeriodId: 'commission_2026-06-01_2026-06-15',
      originalPeriodStatus: 'approved',
      retroactiveResolutionStatus: 'selected_for_next_cut',
      retroactiveTargetPeriodId: 'commission_2026-06-16_2026-06-30',
    });
    collectionSnapshots.set('businesses/business-1/hrCommissionEntries', [
      ...Array.from({ length: 450 }, (_, index) =>
        buildCommissionEntry(index + 1, '2026-06-20T12:00:00.000Z'),
      ),
      retroactiveEntry,
    ]);

    await expect(
      manageHrCommissionPeriod(
        buildRequest({
          action: 'create',
          businessId: 'business-1',
          ruleId: 'rule-active',
        }),
      ),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('más de 450'),
    });

    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(setCalls).toHaveLength(0);
  });

  it('aborts overflow cuts before creating period documents or entry patches', async () => {
    seedActiveBiweeklyRule();
    collectionSnapshots.set('businesses/business-1/hrCommissionPeriods', []);
    collectionSnapshots.set(
      'businesses/business-1/hrCommissionEntries',
      Array.from({ length: 451 }, (_, index) => ({
        id: `entry-${index + 1}`,
        data: {
          employeeId: `emp-${index + 1}`,
          commissionAmount: 10,
          status: 'calculated',
          date: new Date('2026-06-10T12:00:00.000Z'),
          periodId: null,
          payrollRunId: null,
        },
      })),
    );

    await expect(
      manageHrCommissionPeriod(
        buildRequest({
          action: 'create',
          businessId: 'business-1',
          ruleId: 'rule-active',
        }),
      ),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('más de 450'),
    });

    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(setCalls).toHaveLength(0);
  });

  it('keeps only the newest saved cut rule active', async () => {
    collectionSnapshots.set('businesses/business-1/hrCommissionCutRules', [
      {
        id: 'rule-a',
        data: {
          id: 'rule-a',
          businessId: 'business-1',
          label: 'Regla A',
          frequency: 'biweekly',
          startDay: 1,
          endDay: 15,
          active: true,
        },
      },
    ]);

    await manageHrCommissionPeriod(
      buildRequest({
        action: 'upsert_cut_rule',
        businessId: 'business-1',
        ruleId: 'rule-b',
        label: 'Regla B',
        frequency: 'biweekly',
        startDay: 1,
        endDay: 15,
        active: true,
      }),
    );

    expect(setCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: expect.objectContaining({
            path: 'businesses/business-1/hrCommissionCutRules/rule-a',
          }),
          data: expect.objectContaining({
            active: false,
            replacedByCutRuleId: 'rule-b',
          }),
        }),
        expect.objectContaining({
          ref: expect.objectContaining({
            path: 'businesses/business-1/hrCommissionCutRules/rule-b',
          }),
          data: expect.objectContaining({
            active: true,
            label: 'Regla B',
          }),
        }),
      ]),
    );
  });

  it('reverts an approved unpaid cut back to closed', async () => {
    const period = {
      id: 'period-1',
      businessId: 'business-1',
      status: 'approved',
      payrollRunId: 'run-1',
      accountingEventId: 'event-1',
      entriesCount: 2,
      employeesCount: 1,
      totalCommissionAmount: 100,
      netAmount: 100,
      paidAmount: 0,
      paidLinesCount: 0,
    };
    const line = {
      id: 'line-1',
      businessId: 'business-1',
      periodId: 'period-1',
      payrollRunId: 'run-1',
      status: 'approved',
      netAmount: 100,
      commissionEntryIds: ['entry-regular'],
      retroactiveEntryIds: ['entry-retro'],
    };
    documentSnapshots.set(
      'businesses/business-1/hrCommissionPeriods/period-1',
      period,
    );
    documentSnapshots.set('businesses/business-1/accountingEvents/event-1', {
      id: 'event-1',
      status: 'recorded',
      projection: { status: 'pending' },
      metadata: { generatedBy: 'hrPayroll.manageHrCommissionPeriod' },
    });
    collectionSnapshots.set('businesses/business-1/hrPayrollEmployeeLines', [
      { id: 'line-1', data: line },
    ]);
    collectionSnapshots.set('businesses/business-1/hrEmployeePayments', []);

    const result = await manageHrCommissionPeriod(
      buildRequest({
        action: 'revert_approval',
        businessId: 'business-1',
        periodId: 'period-1',
        comment: 'Corrección de comisión antes de pagar',
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      periodId: 'period-1',
      status: 'closed',
    });
    expect(setCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: expect.objectContaining({
            path: 'businesses/business-1/hrCommissionPeriods/period-1',
          }),
          data: expect.objectContaining({
            status: 'closed',
            accountingEventId: null,
            lastApprovalReversalReason:
              'Corrección de comisión antes de pagar',
          }),
        }),
        expect.objectContaining({
          ref: expect.objectContaining({
            path: 'businesses/business-1/accountingEvents/event-1',
          }),
          data: expect.objectContaining({
            status: 'voided',
            voidedReason: 'Corrección de comisión antes de pagar',
          }),
        }),
        expect.objectContaining({
          ref: expect.objectContaining({
            path: 'businesses/business-1/hrCommissionEntries/entry-regular',
          }),
          data: expect.objectContaining({
            status: 'included_in_cut',
            accountingEventId: null,
          }),
        }),
        expect.objectContaining({
          ref: expect.objectContaining({
            path: 'businesses/business-1/hrCommissionEntries/entry-retro',
          }),
          data: expect.objectContaining({
            status: 'included_in_cut',
            retroactiveResolutionStatus: 'included_in_cut',
          }),
        }),
      ]),
    );
  });

  it('blocks approval reversal when there are confirmed payments', async () => {
    documentSnapshots.set('businesses/business-1/hrCommissionPeriods/period-1', {
      id: 'period-1',
      businessId: 'business-1',
      status: 'approved',
      payrollRunId: 'run-1',
      accountingEventId: 'event-1',
      paidAmount: 0,
      paidLinesCount: 0,
    });
    collectionSnapshots.set('businesses/business-1/hrPayrollEmployeeLines', [
      {
        id: 'line-1',
        data: {
          id: 'line-1',
          periodId: 'period-1',
          status: 'approved',
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/hrEmployeePayments', [
      {
        id: 'payment-1',
        data: {
          periodId: 'period-1',
          status: 'confirmed',
        },
      },
    ]);

    await expect(
      manageHrCommissionPeriod(
        buildRequest({
          action: 'revert_approval',
          businessId: 'business-1',
          periodId: 'period-1',
          comment: 'Corrección antes de pagar',
        }),
      ),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('pagos confirmados'),
    });
    expect(setCalls).toHaveLength(0);
  });
});
