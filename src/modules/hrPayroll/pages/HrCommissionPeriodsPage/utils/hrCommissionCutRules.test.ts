import { describe, expect, it } from 'vitest';

import type {
  HrCommissionCutRuleRecord,
  HrCommissionPeriodRecord,
} from '@/types/hrPayroll';

import {
  formatHrCommissionCutRuleDayRange,
  resolveHrCommissionCutRuleRange,
  resolveNextHrCommissionCutRuleRange,
} from './hrCommissionCutRules';

const buildRule = (
  patch: Partial<HrCommissionCutRuleRecord> = {},
): HrCommissionCutRuleRecord => ({
  id: 'cut-rule-1',
  businessId: 'business-1',
  label: 'Segunda quincena',
  frequency: 'monthly',
  startDay: 16,
  endDay: 31,
  active: true,
  sortOrder: 1,
  ...patch,
});

describe('hrCommissionCutRules', () => {
  it('formats day ranges using the last-day convention', () => {
    expect(formatHrCommissionCutRuleDayRange(buildRule())).toBe(
      '16 - ultimo dia',
    );
    expect(formatHrCommissionCutRuleDayRange(buildRule({ endDay: 20 }))).toBe(
      '16 - 20',
    );
  });

  it('generates a monthly range and constrains day 31 to month end', () => {
    const range = resolveHrCommissionCutRuleRange({
      rule: buildRule(),
      anchorDate: new Date(2026, 1, 3),
    });

    expect(range).toMatchObject({
      startKey: '2026-02-16',
      endKey: '2026-02-28',
      label: 'Segunda quincena 2026-02-16 - 2026-02-28',
    });
  });

  it('uses only periods from the same cut rule to calculate the next range', () => {
    const periods: HrCommissionPeriodRecord[] = [
      {
        id: 'period-1',
        businessId: 'business-1',
        type: 'commission',
        status: 'draft',
        cutRuleId: 'other-rule',
        startDate: new Date(2026, 5, 1),
        endDate: new Date(2026, 5, 30, 23, 59, 59, 999),
        currency: 'DOP',
        entriesCount: 1,
        employeesCount: 1,
        totalCommissionAmount: 100,
      },
      {
        id: 'period-2',
        businessId: 'business-1',
        type: 'commission',
        status: 'draft',
        cutRuleId: 'cut-rule-1',
        startDate: new Date(2026, 4, 16),
        endDate: new Date(2026, 4, 31, 23, 59, 59, 999),
        currency: 'DOP',
        entriesCount: 1,
        employeesCount: 1,
        totalCommissionAmount: 100,
      },
    ];

    const range = resolveNextHrCommissionCutRuleRange({
      periods,
      referenceDate: new Date(2026, 4, 3),
      rule: buildRule(),
    });

    expect(range).toMatchObject({
      startKey: '2026-06-16',
      endKey: '2026-06-30',
    });
  });
});

