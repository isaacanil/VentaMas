import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type {
  HrCommissionEntryRecord,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';

import { HrCommissionPeriodLineBreakdown } from './HrCommissionPeriodLineBreakdown';

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
  retroactiveAdjustmentsCount: 1,
  retroactiveEntryIds: ['entry-retro'],
  deductionLines: [],
  commissionEntryIds: ['entry-normal'],
  entriesCount: 2,
  manualAdjustmentAmount: 0,
};

const entries: HrCommissionEntryRecord[] = [
  {
    id: 'entry-normal',
    businessId: 'business-1',
    employeeId: 'emp-1',
    invoiceId: 'invoice-1',
    invoiceNumber: 'F-001',
    invoiceItemId: 'item-1',
    sourceType: 'invoice_line',
    customerId: 'client-1',
    customerNameSnapshot: 'Cliente Uno',
    serviceId: 'service-1',
    serviceName: 'Instalacion',
    baseAmount: 1000,
    rateType: 'percentage',
    rateValue: 10,
    commissionAmount: 100,
    currency: 'DOP',
    status: 'included_in_cut',
    periodId: 'period-1',
    payrollRunId: 'run-1',
    payrollEmployeeLineId: 'line-1',
  },
  {
    id: 'entry-retro',
    businessId: 'business-1',
    employeeId: 'emp-1',
    invoiceId: 'invoice-2',
    invoiceNumber: 'F-002',
    invoiceItemId: 'item-2',
    sourceType: 'invoice_line',
    customerId: 'client-2',
    customerNameSnapshot: 'Cliente Dos',
    serviceId: 'service-2',
    serviceName: 'Mantenimiento',
    baseAmount: 300,
    rateType: 'fixed',
    rateValue: 30,
    commissionAmount: 30,
    currency: 'DOP',
    status: 'included_in_cut',
    periodId: 'period-1',
    payrollRunId: 'run-1',
    payrollEmployeeLineId: 'line-1',
    isRetroactive: true,
    originalPeriodLabel: 'Corte anterior',
  },
];

describe('HrCommissionPeriodLineBreakdown', () => {
  it('shows normal, retroactive, deduction and net amounts separately', () => {
    render(<HrCommissionPeriodLineBreakdown entries={entries} lines={[line]} />);

    expect(
      screen.getByText('Desglose operativo por colaborador'),
    ).toBeInTheDocument();
    expect(screen.getByText('Ana Perez')).toBeInTheDocument();
    expect(screen.getByText('Comision normal')).toBeInTheDocument();
    expect(screen.getByText('Ajuste retroactivo')).toBeInTheDocument();
    expect(screen.getByText('Deducciones')).toBeInTheDocument();
    expect(screen.getAllByText('RD$100.00')[0]).toBeInTheDocument();
    expect(screen.getAllByText('RD$30.00')[0]).toBeInTheDocument();
    expect(screen.getAllByText('RD$120.00')[0]).toBeInTheDocument();
    expect(screen.getByText('Corte anterior')).toBeInTheDocument();
  });
});
