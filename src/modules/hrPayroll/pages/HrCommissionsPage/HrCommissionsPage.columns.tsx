import { Tag, Tooltip } from 'antd';
import type { TableProps } from 'antd';

import {
  HrAmountText as AmountText,
  HrCellStack as CellStack,
  HrMutedText as MutedText,
  HrPrimaryText as PrimaryText,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import {
  formatHrMoney as formatMoney,
  HR_COMMISSION_ENTRY_STATUS_COLORS as STATUS_COLORS,
  HR_COMMISSION_ENTRY_STATUS_LABELS as STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrCommissionEntryRecord,
  HrCommissionEntryStatus,
} from '@/types/hrPayroll';

export const commissionEntryColumns: TableProps<HrCommissionEntryRecord>['columns'] =
  [
    {
      title: 'Colaborador',
      dataIndex: 'employeeNameSnapshot',
      key: 'employee',
      width: 260,
      render: (_value, entry) => (
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
      render: (_value, entry) => (
        <CellStack>
          <PrimaryText>{entry.invoiceNumber || entry.invoiceId}</PrimaryText>
          <MutedText>{entry.serviceName || entry.invoiceItemId}</MutedText>
        </CellStack>
      ),
    },
    {
      title: 'Base',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      align: 'right',
      width: 140,
      render: (_value, entry) => (
        <AmountText>{formatMoney(entry.baseAmount, entry.currency)}</AmountText>
      ),
    },
    {
      title: 'Tasa',
      key: 'rate',
      width: 120,
      render: (_value, entry) => (
        <MutedText>
          {entry.rateType === 'percentage'
            ? `${entry.rateValue}%`
            : formatMoney(entry.rateValue, entry.currency)}
        </MutedText>
      ),
    },
    {
      title: 'Comision',
      dataIndex: 'commissionAmount',
      key: 'commissionAmount',
      align: 'right',
      width: 140,
      render: (_value, entry) => (
        <AmountText>
          {formatMoney(entry.commissionAmount, entry.currency)}
        </AmountText>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (entryStatus: HrCommissionEntryStatus) => {
        const tag = (
          <Tag color={STATUS_COLORS[entryStatus]}>
            {STATUS_LABELS[entryStatus]}
          </Tag>
        );
        if (entryStatus !== 'requires_adjustment') return tag;
        return (
          <Tooltip title="Vincula el colaborador a un empleado de RRHH y recalcula.">
            {tag}
          </Tooltip>
        );
      },
    },
  ];
