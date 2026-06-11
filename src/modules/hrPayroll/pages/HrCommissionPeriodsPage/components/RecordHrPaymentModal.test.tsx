import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type {
  HrCommissionPeriodRecord,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';

import { RecordHrPaymentModal } from './RecordHrPaymentModal';
import { PAYMENT_METHOD_OPTIONS } from './RecordHrPaymentModal.helpers';

const period: HrCommissionPeriodRecord = {
  id: 'period-1',
  businessId: 'business-1',
  type: 'commission',
  periodKey: '2026-06-01_2026-06-15',
  label: 'Primera quincena 2026-06-01 - 2026-06-15',
  status: 'approved',
  startDateKey: '2026-06-01',
  endDateKey: '2026-06-15',
  currency: 'DOP',
  entriesCount: 2,
  employeesCount: 1,
  totalCommissionAmount: 130,
};

const line: HrPayrollEmployeeLineRecord = {
  id: 'line-1',
  businessId: 'business-1',
  periodId: 'period-1',
  payrollRunId: 'run-1',
  employeeId: 'emp-1',
  employeeCode: 'EMP-1',
  employeeNameSnapshot: 'Ana Perez',
  type: 'commission',
  status: 'approved',
  currency: 'DOP',
  grossAmount: 130,
  deductionsAmount: 10,
  netAmount: 120,
  commissionAmount: 100,
  retroactiveAdjustmentAmount: 30,
  retroactiveEntryIds: ['entry-retro'],
  deductionLines: [],
  commissionEntryIds: ['entry-normal'],
  entriesCount: 2,
};

describe('RecordHrPaymentModal', () => {
  it('only exposes payment methods with accounting support', () => {
    expect(PAYMENT_METHOD_OPTIONS.map((option) => option.value)).toEqual([
      'cash',
      'bank_transfer',
      'check',
    ]);
  });

  it('shows the payment summary before confirming', () => {
    const onFinish = vi.fn();

    render(
      <RecordHrPaymentModal
        actionKey={null}
        line={line}
        period={period}
        onCancel={() => undefined}
        onFinish={onFinish}
      />,
    );

    expect(onFinish).not.toHaveBeenCalled();
    expect(screen.getByText('Ana Perez')).toBeInTheDocument();
    expect(screen.getByText('Comisión normal')).toBeInTheDocument();
    expect(screen.getByText('Retroactiva')).toBeInTheDocument();
    expect(screen.queryByText('Ajuste manual')).not.toBeInTheDocument();
    expect(screen.getByText('Deducciones')).toBeInTheDocument();
    expect(screen.getByText('Total a pagar')).toBeInTheDocument();
    expect(
      screen.getByText(/las comisiones normales y retroactivas/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/cómo se calculó/i)).toBeInTheDocument();
  });

  it('calls onFinish only after a valid confirmation submit', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();

    render(
      <RecordHrPaymentModal
        actionKey={null}
        line={line}
        period={period}
        onCancel={() => undefined}
        onFinish={onFinish}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /registrar pago de rd\$120\.00/i }),
    );

    expect(onFinish).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      /cuenta bancaria operativa/i,
    );

    await user.type(screen.getByLabelText('Cuenta bancaria operativa'), 'bank-1');
    await user.click(
      screen.getByRole('button', { name: /registrar pago de rd\$120\.00/i }),
    );

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({
        bankAccountId: 'bank-1',
      }),
    );
  });
});
