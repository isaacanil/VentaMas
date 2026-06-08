import { describe, expect, it, vi } from 'vitest';

const { MockTimestamp } = vi.hoisted(() => {
  class MockTimestamp {
    constructor(date) {
      this.date = date;
    }

    static fromDate(date) {
      return new MockTimestamp(date);
    }

    static now() {
      return new MockTimestamp(new Date('2026-06-01T12:00:00.000Z'));
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
  buildHrPayrollEmployeeLinePayableAdjustment,
  groupHrCommissionEntriesByEmployee,
  isHrCommissionEntryEligibleForCut,
  normalizeHrCommissionCutRule,
  resolveHrCommissionCutRuleRange,
  resolveHrCommissionPeriodId,
  resolveNextHrCommissionCutRuleRange,
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

  it('normalizes cut rules by frequency and constrains generated ranges', () => {
    const normalized = normalizeHrCommissionCutRule(
      {
        label: 'Quincenal',
        frequency: 'biweekly',
      },
      { businessId: 'business-1' },
    );

    expect(normalized).toMatchObject({
      ok: true,
      rule: {
        label: 'Quincenal',
        frequency: 'biweekly',
        startDay: 1,
        endDay: 15,
        active: true,
      },
    });

    const range = resolveHrCommissionCutRuleRange({
      rule: normalized.rule,
      anchorDate: new Date('2026-02-01T00:00:00.000Z'),
    });

    expect(range).toMatchObject({
      ok: true,
      startKey: '2026-02-01',
      endKey: '2026-02-15',
    });

    expect(
      resolveHrCommissionCutRuleRange({
        rule: {
          ...normalized.rule,
          frequency: 'weekly',
          label: 'Semanal',
        },
        anchorDate: new Date('2026-06-10T00:00:00.000Z'),
      }),
    ).toMatchObject({
      ok: true,
      startKey: '2026-06-08',
      endKey: '2026-06-14',
    });

    expect(
      resolveHrCommissionCutRuleRange({
        rule: {
          ...normalized.rule,
          frequency: 'monthly',
          label: 'Mensual',
          startDay: 1,
          endDay: 31,
        },
        anchorDate: new Date('2026-02-03T00:00:00.000Z'),
      }),
    ).toMatchObject({
      ok: true,
      startKey: '2026-02-01',
      endKey: '2026-02-28',
    });
  });

  it('resolves the next cut rule range after the latest generated period', () => {
    const range = resolveNextHrCommissionCutRuleRange({
      rule: {
        id: 'cut_01_15_primera',
        businessId: 'business-1',
        label: 'Quincenal',
        frequency: 'biweekly',
        startDay: 1,
        endDay: 15,
        active: true,
      },
      referenceDate: new Date('2026-05-03T00:00:00.000Z'),
      periods: [
        {
          id: 'period-1',
          cutRuleId: 'cut_01_15_primera',
          endDate: new Date('2026-05-15T23:59:59.999Z'),
        },
        {
          id: 'period-2',
          cutRuleId: 'other-rule',
          endDate: new Date('2026-06-30T23:59:59.999Z'),
        },
      ],
    });

    expect(range).toMatchObject({
      ok: true,
      startKey: '2026-05-16',
      endKey: '2026-05-31',
    });
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
      cutRule: {
        id: 'cut_01_31_mensual',
        businessId: 'business-1',
        label: 'Mensual',
        frequency: 'monthly',
        startDay: 1,
        endDay: 31,
        active: true,
      },
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
      cutRuleId: 'cut_01_31_mensual',
      cutRuleLabel: 'Mensual',
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

  it('applies configured salary deductions to payroll lines', () => {
    const result = buildHrCommissionCutDocuments({
      businessId: 'business-1',
      startDate: new Date('2026-05-01T00:00:00.000Z'),
      endDate: new Date('2026-05-31T23:59:59.999Z'),
      employees: [
        {
          id: 'emp-1',
          employeeId: 'emp-1',
          payType: 'mixed',
          baseSalaryAmount: 10000,
          salaryDeductions: [
            { id: 'afp', kind: 'afp', mode: 'percentage', rate: 3 },
            { id: 'tss', kind: 'tss', mode: 'percentage', rate: 2 },
            {
              id: 'salary_itbis',
              kind: 'salary_itbis',
              mode: 'percentage',
              rate: 1,
            },
          ],
        },
      ],
      entries: [
        {
          id: 'entry-1',
          employeeId: 'emp-1',
          employeeCode: 'EMP-001',
          employeeNameSnapshot: 'Ana Perez',
          commissionAmount: 1000,
          currency: 'DOP',
          status: 'calculated',
          date: new Date('2026-05-10T12:00:00.000Z'),
        },
      ],
      timestamp: 'now',
      userId: 'admin-1',
    });

    expect(result.ok).toBe(true);
    expect(result.employeeLines[0]).toMatchObject({
      type: 'mixed',
      baseSalaryAmount: 10000,
      commissionAmount: 1000,
      grossAmount: 11000,
      deductionsAmount: 600,
      netAmount: 10400,
      deductionLines: [
        expect.objectContaining({
          id: 'afp',
          calculatedAmount: 300,
          accountSystemKey: 'payroll_withholdings_payable',
        }),
        expect.objectContaining({
          id: 'tss',
          calculatedAmount: 200,
          accountSystemKey: 'payroll_withholdings_payable',
        }),
        expect.objectContaining({
          id: 'salary_itbis',
          calculatedAmount: 100,
          accountSystemKey: 'tax_payable',
        }),
      ],
    });
    expect(result.period).toMatchObject({
      grossAmount: 11000,
      deductionsAmount: 600,
      netAmount: 10400,
      totalPayableAmount: 10400,
    });
    expect(result.payrollRun).toMatchObject({
      grossAmount: 11000,
      deductionsAmount: 600,
      netAmount: 10400,
      totalPayableAmount: 10400,
    });
  });

  it('creates salary-only payroll lines when there are no commissions', () => {
    const result = buildHrCommissionCutDocuments({
      businessId: 'business-1',
      startDate: new Date('2026-05-01T00:00:00.000Z'),
      endDate: new Date('2026-05-31T23:59:59.999Z'),
      employees: [
        {
          id: 'emp-2',
          employeeId: 'emp-2',
          code: 'EMP-002',
          fullName: 'Luis Rojas',
          status: 'active',
          payType: 'salary',
          baseSalaryAmount: 20000,
          currency: 'DOP',
          salaryDeductions: [
            { id: 'afp', kind: 'afp', mode: 'percentage', rate: 3 },
          ],
        },
      ],
      entries: [],
      timestamp: 'now',
      userId: 'admin-1',
    });

    expect(result.ok).toBe(true);
    expect(result.employeeLines).toHaveLength(1);
    expect(result.employeeLines[0]).toMatchObject({
      employeeId: 'emp-2',
      type: 'salary',
      baseSalaryAmount: 20000,
      commissionAmount: 0,
      grossAmount: 20000,
      deductionsAmount: 600,
      netAmount: 19400,
      commissionEntryIds: [],
      entriesCount: 0,
    });
    expect(result.period).toMatchObject({
      entriesCount: 0,
      employeesCount: 1,
      totalCommissionAmount: 0,
      grossAmount: 20000,
      deductionsAmount: 600,
      netAmount: 19400,
    });
  });

  it('accrues payroll by gross amount so deductions remain payable', () => {
    const event = buildHrCommissionAccrualAccountingEvent({
      businessId: 'business-1',
      period: {
        id: 'period-salary',
        periodKey: '2026-05-01_2026-05-31',
        currency: 'DOP',
        grossAmount: 20000,
        deductionsAmount: 600,
        netAmount: 19400,
        totalCommissionAmount: 0,
        employeesCount: 1,
        entriesCount: 0,
        startDate: 'start',
        endDate: 'end',
      },
      employeeLines: [
        {
          id: 'line-1',
          employeeId: 'emp-2',
          employeeCode: 'EMP-002',
          employeeNameSnapshot: 'Luis Rojas',
          baseSalaryAmount: 20000,
          grossAmount: 20000,
          deductionsAmount: 600,
          netAmount: 19400,
          commissionAmount: 0,
          deductionLines: [
            {
              id: 'afp',
              calculatedAmount: 600,
              payableObligation: true,
            },
          ],
        },
      ],
      timestamp: 'now',
      userId: 'admin-1',
    });

    expect(event).toMatchObject({
      monetary: {
        amount: 20000,
        functionalAmount: 20000,
      },
      payload: {
        grossAmount: 20000,
        deductionsAmount: 600,
        netAmount: 19400,
        payrollDeductionSummary: {
          taxAmount: 0,
          otherPayableAmount: 600,
          totalPayableDeductionsAmount: 600,
        },
        employeeLines: [
          expect.objectContaining({
            grossAmount: 20000,
            deductionsAmount: 600,
            netAmount: 19400,
            amount: 20000,
          }),
        ],
      },
    });
  });

  it('subtracts manual payable adjustments from the accrual amount', () => {
    const event = buildHrCommissionAccrualAccountingEvent({
      businessId: 'business-1',
      period: {
        id: 'period-adjusted',
        periodKey: '2026-05-01_2026-05-31',
        currency: 'DOP',
        grossAmount: 11000,
        deductionsAmount: 1000,
        manualAdjustmentAmount: 400,
        netAmount: 10000,
        totalCommissionAmount: 1000,
        employeesCount: 1,
        entriesCount: 1,
        startDate: 'start',
        endDate: 'end',
      },
      employeeLines: [
        {
          id: 'line-1',
          employeeId: 'emp-1',
          employeeCode: 'EMP-001',
          employeeNameSnapshot: 'Ana Perez',
          grossAmount: 11000,
          deductionsAmount: 1000,
          manualAdjustmentAmount: 400,
          netAmount: 10000,
          commissionAmount: 1000,
        },
      ],
      timestamp: 'now',
      userId: 'admin-1',
    });

    expect(event).toMatchObject({
      monetary: {
        amount: 10600,
        functionalAmount: 10600,
      },
      payload: {
        grossAmount: 11000,
        deductionsAmount: 1000,
        manualAdjustmentAmount: 400,
        netAmount: 10000,
        employeeLines: [
          expect.objectContaining({
            amount: 10600,
            manualAdjustmentAmount: 400,
            netAmount: 10000,
          }),
        ],
      },
    });
  });

  it('builds a payable adjustment with required comment and aggregate totals', () => {
    const line = {
      id: 'line-1',
      status: 'draft',
      grossAmount: 125,
      deductionsAmount: 0,
      netAmount: 125,
      commissionAmount: 125,
      manualAdjustmentAmount: 0,
      manualAdjustmentHistory: [],
    };
    const result = buildHrPayrollEmployeeLinePayableAdjustment({
      line,
      employeeLines: [
        line,
        {
          id: 'line-2',
          status: 'draft',
          grossAmount: 50,
          deductionsAmount: 0,
          netAmount: 50,
          commissionAmount: 50,
          manualAdjustmentAmount: 0,
        },
      ],
      totalToPay: 100,
      comment: 'Ajuste autorizado por gerencia',
      timestamp: 'now',
      historyTimestamp: 'history-now',
      userId: 'admin-1',
    });

    expect(result.ok).toBe(true);
    expect(result.linePatch).toMatchObject({
      deductionsAmount: 25,
      manualAdjustmentAmount: 25,
      manualAdjustmentComment: 'Ajuste autorizado por gerencia',
      netAmount: 100,
      totalPayableAmount: 100,
    });
    expect(result.linePatch.manualAdjustmentHistory).toEqual([
      expect.objectContaining({
        previousNetAmount: 125,
        newNetAmount: 100,
        newDeductionsAmount: 25,
        newManualAdjustmentAmount: 25,
        deltaAmount: -25,
        comment: 'Ajuste autorizado por gerencia',
      }),
    ]);
    expect(result.aggregatePatch).toMatchObject({
      grossAmount: 175,
      deductionsAmount: 25,
      manualAdjustmentAmount: 25,
      netAmount: 150,
      totalPayableAmount: 150,
      adjustmentsCount: 1,
      lastAdjustmentComment: 'Ajuste autorizado por gerencia',
    });
  });

  it('preserves existing payroll deductions when applying a manual payable adjustment', () => {
    const result = buildHrPayrollEmployeeLinePayableAdjustment({
      line: {
        id: 'line-1',
        status: 'closed',
        grossAmount: 11000,
        deductionsAmount: 600,
        netAmount: 10400,
        commissionAmount: 1000,
        manualAdjustmentAmount: 0,
      },
      totalToPay: 10000,
      comment: 'Descuento autorizado',
      timestamp: 'now',
      historyTimestamp: 'history-now',
      userId: 'admin-1',
    });

    expect(result.ok).toBe(true);
    expect(result.linePatch).toMatchObject({
      deductionsAmount: 1000,
      manualAdjustmentAmount: 400,
      netAmount: 10000,
    });
  });

  it('rejects payable adjustments without comment, above calculation or approved lines', () => {
    const line = {
      id: 'line-1',
      status: 'draft',
      grossAmount: 125,
      deductionsAmount: 0,
      netAmount: 125,
      commissionAmount: 125,
    };

    expect(
      buildHrPayrollEmployeeLinePayableAdjustment({
        line,
        totalToPay: 100,
        comment: '',
      }),
    ).toMatchObject({
      ok: false,
      error: 'Agrega un comentario sobre la modificacion del total a pagar.',
    });

    expect(
      buildHrPayrollEmployeeLinePayableAdjustment({
        line,
        totalToPay: 150,
        comment: 'Intento mayor al calculo',
      }),
    ).toMatchObject({
      ok: false,
      error: 'El total a pagar no puede exceder el calculo original.',
    });

    expect(
      buildHrPayrollEmployeeLinePayableAdjustment({
        line: { ...line, status: 'approved' },
        totalToPay: 100,
        comment: 'Ajuste tardio',
      }),
    ).toMatchObject({
      ok: false,
      error: 'Solo puedes editar el total antes de aprobar el corte.',
    });
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
