import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type {
  HrCommissionPeriodRecord,
  HrCommissionPeriodStatus,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';

import {
  buildLineColumns,
  buildPeriodColumns,
} from './HrCommissionPeriodsPage.columns';

const period: HrCommissionPeriodRecord = {
  id: 'commission_2026-06-01_2026-06-15',
  businessId: 'business-1',
  type: 'commission',
  periodKey: '2026-06-01_2026-06-15',
  label: 'Primera quincena 2026-06-01 - 2026-06-15',
  status: 'approved',
  startDateKey: '2026-06-01',
  endDateKey: '2026-06-15',
  startDate: {
    toDate: () => new Date('2026-06-01T00:00:00.000Z'),
  },
  endDate: {
    toDate: () => new Date('2026-06-15T23:59:59.999Z'),
  },
  currency: 'DOP',
  entriesCount: 1,
  employeesCount: 1,
  totalCommissionAmount: 16.1,
};

describe('HrCommissionPeriodsPage columns', () => {
  it('renders the range from business date keys without timezone drift', () => {
    const columns = buildPeriodColumns({
      getDetailPath: (period) => `/hr/commission-periods/${period.id}`,
    });
    const rangeColumn = columns.find((column) => column.key === 'range');

    expect(rangeColumn).toBeDefined();

    render(<>{rangeColumn?.render(period)}</>);

    expect(screen.getByText('1 jun 2026')).toBeInTheDocument();
    expect(screen.getByText('15 jun 2026')).toBeInTheDocument();
    expect(screen.queryByText('31 may 2026')).not.toBeInTheDocument();
  });

  it('renders retroactive adjustments separately from manual adjustments', () => {
    const line: HrPayrollEmployeeLineRecord = {
      id: 'line-1',
      businessId: 'business-1',
      periodId: 'period-1',
      payrollRunId: 'run-1',
      employeeId: 'emp-1',
      type: 'commission',
      status: 'approved',
      currency: 'DOP',
      grossAmount: 125,
      deductionsAmount: 0,
      netAmount: 125,
      commissionAmount: 100,
      retroactiveAdjustmentAmount: 25,
      retroactiveAdjustmentsCount: 1,
      retroactiveEntryIds: ['entry-retro'],
      deductionLines: [],
      commissionEntryIds: ['entry-normal'],
      entriesCount: 2,
    };
    const columns = buildLineColumns({
      adjustmentActionKey: null,
      onOpenAdjustment: () => undefined,
      paymentActionKey: null,
      onOpenPayment: () => undefined,
    });
    const amountColumn = columns.find((column) => column.key === 'netAmount');
    const summaryColumn = columns.find((column) => column.key === 'summary');

    expect(amountColumn).toBeDefined();
    expect(summaryColumn).toBeDefined();

    render(
      <>
        {summaryColumn?.render(line)}
        {amountColumn?.render(line)}
      </>,
    );

    expect(screen.getByText('RD$125.00')).toBeInTheDocument();
    expect(screen.getByText('Retroactiva +RD$25.00')).toBeInTheDocument();
    expect(
      screen.getByText('Incluye RD$25.00 retroactivo'),
    ).toBeInTheDocument();
  });

  it('keeps collaborator detail columns compact', () => {
    const columns = buildLineColumns({
      adjustmentActionKey: null,
      onOpenAdjustment: () => undefined,
      paymentActionKey: null,
      onOpenPayment: () => undefined,
    });

    expect(columns.map((column) => column.key)).toEqual([
      'employee',
      'summary',
      'netAmount',
      'pendingAmount',
      'payment',
    ]);
  });

  it('only shows the pay action for approved or partially paid periods with pending lines', () => {
    const line: HrPayrollEmployeeLineRecord = {
      id: 'line-pay',
      businessId: 'business-1',
      periodId: 'period-1',
      payrollRunId: 'run-1',
      employeeId: 'emp-1',
      type: 'commission',
      status: 'approved',
      currency: 'DOP',
      grossAmount: 100,
      deductionsAmount: 0,
      netAmount: 100,
      commissionAmount: 100,
      deductionLines: [],
      commissionEntryIds: ['entry-normal'],
      entriesCount: 1,
    };
    const renderAction = (periodStatus: HrCommissionPeriodStatus) => {
      const columns = buildLineColumns({
        adjustmentActionKey: null,
        onOpenAdjustment: () => undefined,
        paymentActionKey: null,
        periodStatus,
        onOpenPayment: () => undefined,
      });
      const actionColumn = columns.find((column) => column.key === 'payment');
      render(<>{actionColumn?.render(line)}</>);
    };

    renderAction('approved');
    expect(screen.getByRole('button', { name: /pagar/i })).toBeInTheDocument();
    cleanup();

    renderAction('partially_paid');
    expect(screen.getByRole('button', { name: /pagar/i })).toBeInTheDocument();
  });

  it('groups individual PDF and Excel exports under an export dropdown', () => {
    const line: HrPayrollEmployeeLineRecord = {
      id: 'line-support',
      businessId: 'business-1',
      periodId: 'period-1',
      payrollRunId: 'run-1',
      employeeId: 'emp-1',
      employeeCode: 'EMP-1',
      employeeNameSnapshot: 'Ana Perez',
      type: 'commission',
      status: 'approved',
      currency: 'DOP',
      grossAmount: 100,
      deductionsAmount: 0,
      netAmount: 100,
      commissionAmount: 100,
      deductionLines: [],
      commissionEntryIds: ['entry-normal'],
      entriesCount: 1,
    };
    const columns = buildLineColumns({
      adjustmentActionKey: null,
      onExportLine: () => undefined,
      onOpenAdjustment: () => undefined,
      paymentActionKey: null,
      periodStatus: 'approved',
      onOpenPayment: () => undefined,
    });
    const actionColumn = columns.find((column) => column.key === 'payment');

    render(<>{actionColumn?.render(line)}</>);

    expect(screen.getByRole('button', { name: /pagar/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Exportar comisión de Ana Perez',
      }),
    ).toBeInTheDocument();
  });

  it.each<HrCommissionPeriodStatus>(['draft', 'closed', 'paid', 'cancelled'])(
    'hides the pay action when the period is %s',
    (periodStatus) => {
      const line: HrPayrollEmployeeLineRecord = {
        id: `line-${periodStatus}`,
        businessId: 'business-1',
        periodId: 'period-1',
        payrollRunId: 'run-1',
        employeeId: 'emp-1',
        type: 'commission',
        status: 'approved',
        currency: 'DOP',
        grossAmount: 100,
        deductionsAmount: 0,
        netAmount: 100,
        commissionAmount: 100,
        deductionLines: [],
        commissionEntryIds: ['entry-normal'],
        entriesCount: 1,
      };
      const columns = buildLineColumns({
        adjustmentActionKey: null,
        onOpenAdjustment: () => undefined,
        paymentActionKey: null,
        periodStatus,
        onOpenPayment: () => undefined,
      });
      const actionColumn = columns.find((column) => column.key === 'payment');

      render(<>{actionColumn?.render(line)}</>);

      expect(
        screen.queryByRole('button', { name: /pagar/i }),
      ).not.toBeInTheDocument();
    },
  );
});
