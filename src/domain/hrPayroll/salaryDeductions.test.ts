import { describe, expect, it } from 'vitest';

import {
  SALARY_DEDUCTION_PRESETS,
  normalizeSalaryDeductionLines,
  upsertSalaryDeductionRate,
} from './salaryDeductions';

describe('salaryDeductions', () => {
  it('maps labor deductions to payroll withholding liabilities by default', () => {
    expect(SALARY_DEDUCTION_PRESETS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'afp',
          accountSystemKey: 'payroll_withholdings_payable',
        }),
        expect.objectContaining({
          id: 'tss',
          accountSystemKey: 'payroll_withholdings_payable',
        }),
        expect.objectContaining({
          id: 'salary_itbis',
          accountSystemKey: 'tax_payable',
        }),
      ]),
    );

    expect(
      normalizeSalaryDeductionLines([
        { id: 'afp', kind: 'afp', mode: 'percentage', rate: 3 },
        { id: 'other', kind: 'other', mode: 'fixed', amount: 100 },
      ]),
    ).toEqual([
      expect.objectContaining({
        id: 'afp',
        accountSystemKey: 'payroll_withholdings_payable',
      }),
      expect.objectContaining({
        id: 'other',
        accountSystemKey: 'payroll_withholdings_payable',
      }),
    ]);
  });

  it('upserts preset rates with their accounting liability account', () => {
    const afpPreset = SALARY_DEDUCTION_PRESETS.find(
      (preset) => preset.id === 'afp',
    );

    expect(
      upsertSalaryDeductionRate([], afpPreset!, 2.87),
    ).toEqual([
      expect.objectContaining({
        id: 'afp',
        rate: 2.87,
        accountSystemKey: 'payroll_withholdings_payable',
      }),
    ]);
  });
});
