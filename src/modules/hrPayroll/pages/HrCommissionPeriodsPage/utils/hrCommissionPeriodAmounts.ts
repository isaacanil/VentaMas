import type {
  HrCommissionPeriodRecord,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';

export const getHrCommissionPeriodPayableAmount = (
  period: HrCommissionPeriodRecord,
): number =>
  period.netAmount ?? period.totalPayableAmount ?? period.totalCommissionAmount;

export const getHrCommissionPeriodPaidAmount = (
  period: HrCommissionPeriodRecord,
): number => {
  const paidAmount = period.paidAmount ?? 0;
  if (paidAmount > 0) return paidAmount;
  return period.status === 'paid'
    ? getHrCommissionPeriodPayableAmount(period)
    : 0;
};

export const isHrCommissionPeriodUnpaid = (
  period: HrCommissionPeriodRecord,
): boolean => !['cancelled', 'paid'].includes(period.status);

export const getHrCommissionPeriodPendingAmount = (
  period: HrCommissionPeriodRecord,
): number => {
  if (!isHrCommissionPeriodUnpaid(period)) return 0;
  return Math.max(
    0,
    getHrCommissionPeriodPayableAmount(period) -
      getHrCommissionPeriodPaidAmount(period),
  );
};

export const getHrCommissionLineGrossAmount = (
  line: HrPayrollEmployeeLineRecord,
): number => line.grossAmount || line.commissionAmount || line.netAmount || 0;

export const getHrCommissionLineDeductionAmount = (
  line: HrPayrollEmployeeLineRecord,
): number =>
  line.deductionsAmount ||
  Math.max(0, getHrCommissionLineGrossAmount(line) - line.netAmount);

export const getHrCommissionLineAdjustmentAmount = (
  line: HrPayrollEmployeeLineRecord,
): number => line.manualAdjustmentAmount ?? 0;

export const getHrCommissionLineRetroactiveAdjustmentAmount = (
  line: HrPayrollEmployeeLineRecord,
): number => line.retroactiveAdjustmentAmount ?? 0;

export const getHrCommissionLinePaidAmount = (
  line: HrPayrollEmployeeLineRecord,
): number => (line.status === 'paid' ? line.netAmount : 0);

export const getHrCommissionLinePendingAmount = (
  line: HrPayrollEmployeeLineRecord,
): number =>
  line.status === 'paid' || line.status === 'cancelled'
    ? 0
    : Math.max(0, line.netAmount - getHrCommissionLinePaidAmount(line));
