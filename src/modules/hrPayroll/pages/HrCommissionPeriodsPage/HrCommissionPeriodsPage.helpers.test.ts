import { describe, expect, it } from 'vitest';

import { formatHrPeriodDate } from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type { HrCommissionPeriodRecord } from '@/types/hrPayroll';

import {
  formatActiveCutRulesSummary,
  formatCutRuleMeta,
  getErrorMessage,
  getNextCutActionLabel,
  getPeriodCutRuleMeta,
} from './HrCommissionPeriodsPage.helpers';

const buildPeriod = (
  patch: Partial<HrCommissionPeriodRecord> = {},
): HrCommissionPeriodRecord => ({
  id: 'period-1',
  businessId: 'business-1',
  type: 'commission',
  status: 'approved',
  currency: 'DOP',
  entriesCount: 0,
  employeesCount: 0,
  totalCommissionAmount: 0,
  ...patch,
});

describe('HrCommissionPeriodsPage.helpers', () => {
  it('reads the selected period rule from its saved snapshot', () => {
    expect(
      getPeriodCutRuleMeta(
        buildPeriod({
          cutRuleId: 'rule-1',
          cutRuleLabel: 'Primera quincena',
          cutRuleSnapshot: {
            label: 'Primera quincena',
            frequency: 'biweekly',
          },
        }),
      ),
    ).toBe('Primera quincena (Quincenal)');
  });

  it('does not repeat the frequency when the rule label already contains it', () => {
    expect(
      formatCutRuleMeta({
        frequency: 'biweekly',
        label: 'Corte quincenal',
      }),
    ).toBe('Corte quincenal');
  });

  it('formats active cut rule summary with singular and plural copy', () => {
    expect(
      formatActiveCutRulesSummary({
        activeCount: 1,
        activeRuleMeta: 'Corte quincenal',
      }),
    ).toBe('1 activa. Usando Corte quincenal.');
    expect(
      formatActiveCutRulesSummary({
        activeCount: 2,
        activeRuleMeta: 'Corte quincenal',
      }),
    ).toBe('2 activas. Usando Corte quincenal.');
  });

  it('uses review copy when the next cut preview is blocked', () => {
    expect(
      getNextCutActionLabel({
        actionKey: null,
        blocked: true,
      }),
    ).toBe('Revisar próximo corte');
    expect(
      getNextCutActionLabel({
        actionKey: null,
        blocked: false,
      }),
    ).toBe('Crear próximo corte');
  });

  it('falls back to the saved period rule label without active rule state', () => {
    expect(
      getPeriodCutRuleMeta(
        buildPeriod({
          cutRuleId: 'archived-rule',
          cutRuleLabel: 'Mensual',
          cutRuleSnapshot: null,
        }),
      ),
    ).toBe('Mensual');
  });

  it('uses clear legacy copy when a period has no saved rule', () => {
    expect(getPeriodCutRuleMeta(buildPeriod())).toBe(
      'Regla no disponible para este corte legacy',
    );
  });

  it('keeps the generic error fallback stable', () => {
    expect(getErrorMessage(null)).toBe('No se pudo completar la operación.');
  });

  it('formats cut business date keys without timezone drift', () => {
    expect(
      formatHrPeriodDate(
        buildPeriod({
          startDateKey: '2026-06-01',
          startDate: {
            toDate: () => new Date('2026-06-01T00:00:00.000Z'),
          },
        }),
        'start',
      ),
    ).toContain('1 jun 2026');
  });
});
