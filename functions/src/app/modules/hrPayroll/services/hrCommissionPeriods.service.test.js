import { describe, expect, it, vi } from 'vitest';

const { MockTimestamp } = vi.hoisted(() => {
  class MockTimestamp {
    constructor(date) {
      this.date = date;
    }

    static fromDate(date) {
      return new MockTimestamp(date);
    }

    toDate() {
      return this.date;
    }
  }

  return { MockTimestamp };
});

vi.mock('../../../core/config/firebase.js', () => ({
  FieldValue: {
    serverTimestamp: () => 'server-timestamp',
  },
  Timestamp: MockTimestamp,
  db: {
    doc: (path) => ({ path }),
  },
}));

import {
  buildHrCommissionAccrualAccountingEvent,
  buildHrCommissionCutDocuments,
  groupHrCommissionEntriesByEmployee,
  isHrCommissionEntryEligibleForCut,
  resolveHrCommissionPeriodId,
} from './hrCommissionPeriods.service.js';

describe('hrCommissionPeriods.service', () => {
  it('builds a stable commission period id from the date range', () => {
    expect(
      resolveHrCommissionPeriodId({
        startDate: new Date('2026-05-01T00:00:00.000Z'),
        endDate: new Date('2026-05-31T23:59:59.999Z'),
      }),
    ).toBe('commission_2026-05-01_2026-05-31');
  });

  it('groups eligible entries by employee', () => {
    const groups = groupHrCommissionEntriesByEmployee([
      {
        id: 'entry-1',
        employeeId: 'emp-1',
        employeeNameSnapshot: 'Ana Perez',
        commissionAmount: 100,
      },
      {
        id: 'entry-2',
        employeeId: 'emp-1',
        employeeNameSnapshot: 'Ana Perez',
        commissionAmount: 25.55,
      },
      {
        id: 'entry-3',
        employeeId: 'emp-2',
        employeeNameSnapshot: 'Luis Rojas',
        commissionAmount: 50,
      },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      employeeId: 'emp-1',
      totalCommissionAmount: 125.55,
    });
  });

  it('rejects entries without employee, amount or available status', () => {
    const range = {
      startDate: new Date('2026-05-01T00:00:00.000Z'),
      endDate: new Date('2026-05-31T23:59:59.999Z'),
    };

    expect(
      isHrCommissionEntryEligibleForCut(
        {
          id: 'entry-1',
          employeeId: 'emp-1',
          commissionAmount: 10,
          status: 'calculated',
          date: new Date('2026-05-10T12:00:00.000Z'),
        },
        range,
      ),
    ).toBe(true);
    expect(
      isHrCommissionEntryEligibleForCut(
        {
          id: 'entry-2',
          commissionAmount: 10,
          status: 'calculated',
          date: new Date('2026-05-10T12:00:00.000Z'),
        },
        range,
      ),
    ).toBe(false);
    expect(
      isHrCommissionEntryEligibleForCut(
        {
          id: 'entry-3',
          employeeId: 'emp-1',
          commissionAmount: 10,
          status: 'included_in_cut',
          date: new Date('2026-05-10T12:00:00.000Z'),
        },
        range,
      ),
    ).toBe(false);
  });

  it('builds period, payroll run, employee lines and entry patches', () => {
    const result = buildHrCommissionCutDocuments({
      businessId: 'business-1',
      startDate: new Date('2026-05-01T00:00:00.000Z'),
      endDate: new Date('2026-05-31T23:59:59.999Z'),
      entries: [
        {
          id: 'entry-1',
          employeeId: 'emp-1',
          employeeCode: 'EMP-001',
          employeeNameSnapshot: 'Ana Perez',
          commissionAmount: 100,
          currency: 'DOP',
          status: 'calculated',
          date: new Date('2026-05-10T12:00:00.000Z'),
        },
        {
          id: 'entry-2',
          employeeId: 'emp-1',
          employeeCode: 'EMP-001',
          employeeNameSnapshot: 'Ana Perez',
          commissionAmount: 25,
          currency: 'DOP',
          status: 'eligible',
          date: new Date('2026-05-12T12:00:00.000Z'),
        },
        {
          id: 'entry-3',
          employeeId: null,
          commissionAmount: 25,
          status: 'requires_adjustment',
          date: new Date('2026-05-12T12:00:00.000Z'),
        },
      ],
      timestamp: 'now',
      userId: 'admin-1',
    });

    expect(result.ok).toBe(true);
    expect(result.period).toMatchObject({
      id: 'commission_2026-05-01_2026-05-31',
      payrollRunId: 'run_commission_2026-05-01_2026-05-31',
      entriesCount: 2,
      employeesCount: 1,
      totalCommissionAmount: 125,
      status: 'draft',
    });
    expect(result.payrollRun).toMatchObject({
      id: 'run_commission_2026-05-01_2026-05-31',
      status: 'draft',
      netAmount: 125,
    });
    expect(result.employeeLines).toHaveLength(1);
    expect(result.employeeLines[0]).toMatchObject({
      employeeId: 'emp-1',
      commissionEntryIds: ['entry-1', 'entry-2'],
      netAmount: 125,
    });
    expect(result.entryPatches).toEqual([
      expect.objectContaining({
        entryId: 'entry-1',
        patch: expect.objectContaining({ status: 'included_in_cut' }),
      }),
      expect.objectContaining({
        entryId: 'entry-2',
        patch: expect.objectContaining({ status: 'included_in_cut' }),
      }),
    ]);
  });

  it('builds a payroll accounting event for approved commission accrual', () => {
    const event = buildHrCommissionAccrualAccountingEvent({
      businessId: 'business-1',
      period: {
        id: 'period-1',
        periodKey: '2026-05-01_2026-05-31',
        currency: 'DOP',
        totalCommissionAmount: 125,
        employeesCount: 1,
        entriesCount: 2,
        startDate: 'start',
        endDate: 'end',
      },
      employeeLines: [
        {
          id: 'line-1',
          employeeId: 'emp-1',
          employeeCode: 'EMP-001',
          employeeNameSnapshot: 'Ana Perez',
          netAmount: 125,
        },
      ],
      timestamp: 'now',
      userId: 'admin-1',
    });

    expect(event).toMatchObject({
      id: 'hr_commission.accrued__period-1',
      businessId: 'business-1',
      eventType: 'hr_commission.accrued',
      sourceType: 'hrCommissionPeriod',
      monetary: {
        amount: 125,
        functionalAmount: 125,
        taxAmount: 0,
        functionalTaxAmount: 0,
      },
      payload: {
        documentNature: 'expense',
        settlementTiming: 'deferred',
        employeesCount: 1,
        entriesCount: 2,
      },
    });
  });
});
