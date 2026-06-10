import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { HrCommissionPeriodRecord } from '@/types/hrPayroll';

import { PeriodActionButtons } from './PeriodActionButtons';

const buildPeriod = (
  patch: Partial<HrCommissionPeriodRecord>,
): HrCommissionPeriodRecord => ({
  id: 'period-1',
  businessId: 'business-1',
  type: 'commission',
  periodKey: '2026-06-01_2026-06-15',
  label: 'Primera quincena',
  status: 'approved',
  currency: 'DOP',
  entriesCount: 1,
  employeesCount: 1,
  totalCommissionAmount: 100,
  ...patch,
});

describe('PeriodActionButtons', () => {
  it('renders partially paid as a visible substatus', () => {
    render(
      <PeriodActionButtons
        actionKey={null}
        period={buildPeriod({ status: 'partially_paid' })}
        onAction={() => undefined}
      />,
    );

    expect(screen.getByText('Pago parcial')).toBeInTheDocument();
  });

  it('moves approval reversal into a secondary actions menu', () => {
    render(
      <PeriodActionButtons
        actionKey={null}
        period={buildPeriod({
          status: 'approved',
          paidAmount: 0,
          paidLinesCount: 0,
        })}
        onAction={() => undefined}
        onRequestRevertApproval={vi.fn()}
      />,
    );

    expect(screen.getByText('Listo para pagos')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /más acciones/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /revertir aprobación/i }),
    ).not.toBeInTheDocument();
  });
});
