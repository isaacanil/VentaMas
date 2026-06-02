import { VmTooltip } from '@/components/heroui';
import {
  HrAmountText as AmountText,
  HrCellStack as CellStack,
  HrMutedText as MutedText,
  HrPrimaryText as PrimaryText,
  HrStatusTag as StatusTag,
  type HrTableColumn,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import {
  formatHrMoney as formatMoney,
  HR_COMMISSION_ENTRY_STATUS_LABELS as STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrCommissionEntryRecord,
  HrCommissionEntryStatus,
} from '@/types/hrPayroll';

const STATUS_TONES: Record<
  HrCommissionEntryStatus,
  'default' | 'info' | 'success' | 'warning' | 'danger' | 'accent'
> = {
  calculated: 'info',
  eligible: 'info',
  included_in_cut: 'accent',
  approved: 'success',
  paid: 'success',
  reversed: 'danger',
  cancelled: 'default',
  requires_adjustment: 'warning',
};

export const commissionEntryColumns: HrTableColumn<HrCommissionEntryRecord>[] = [
    {
      title: 'Colaborador',
      key: 'employee',
      width: 260,
      isRowHeader: true,
      render: (entry) => (
        <CellStack>
          <PrimaryText>
            {entry.employeeNameSnapshot ||
              entry.employeeCode ||
              'Sin colaborador HR'}
          </PrimaryText>
          <MutedText>
            {entry.employeeCode || entry.employeeId || 'Pendiente de vinculo'}
          </MutedText>
        </CellStack>
      ),
    },
    {
      title: 'Factura / servicio',
      key: 'source',
      width: 280,
      render: (entry) => (
        <CellStack>
          <PrimaryText>{entry.invoiceNumber || entry.invoiceId}</PrimaryText>
          <MutedText>{entry.serviceName || entry.invoiceItemId}</MutedText>
        </CellStack>
      ),
    },
    {
      title: 'Base',
      key: 'baseAmount',
      align: 'right',
      width: 140,
      render: (entry) => (
        <AmountText>{formatMoney(entry.baseAmount, entry.currency)}</AmountText>
      ),
    },
    {
      title: 'Tasa',
      key: 'rate',
      width: 120,
      render: (entry) => (
        <MutedText>
          {entry.rateType === 'percentage'
            ? `${entry.rateValue}%`
            : formatMoney(entry.rateValue, entry.currency)}
        </MutedText>
      ),
    },
    {
      title: 'Comision',
      key: 'commissionAmount',
      align: 'right',
      width: 140,
      render: (entry) => (
        <AmountText>
          {formatMoney(entry.commissionAmount, entry.currency)}
        </AmountText>
      ),
    },
    {
      title: 'Estado',
      key: 'status',
      width: 140,
      render: (entry) => {
        const entryStatus = entry.status;
        const tag = (
          <StatusTag $tone={STATUS_TONES[entryStatus]}>
            {STATUS_LABELS[entryStatus]}
          </StatusTag>
        );
        if (entryStatus !== 'requires_adjustment') return tag;
        return (
          <VmTooltip>
            <VmTooltip.Trigger>{tag}</VmTooltip.Trigger>
            <VmTooltip.Content>
              Vincula el colaborador a un empleado de RRHH y recalcula.
            </VmTooltip.Content>
          </VmTooltip>
        );
      },
    },
  ];
