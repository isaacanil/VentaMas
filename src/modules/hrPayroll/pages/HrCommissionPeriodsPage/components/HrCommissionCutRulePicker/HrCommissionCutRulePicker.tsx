import type { Key } from 'react';

import { VmListBox, VmSelect } from '@/components/heroui';
import {
  formatHrPeriodDate,
  formatHrMoney as formatMoney,
  HR_COMMISSION_PERIOD_STATUS_LABELS as STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type { HrCommissionPeriodRecord } from '@/types/hrPayroll';

import {
  CutRuleListBox,
  CutRuleSelect,
  PendingCutOption,
  PendingCutOptionMeta,
  PendingCutOptionTitle,
  PendingCutPreview,
  PickerField,
  PickerLabel,
} from './HrCommissionCutRulePicker.styles';

interface HrCommissionCutRulePickerProps {
  disabled?: boolean;
  loading?: boolean;
  onSelectPendingPeriod?: (periodId: string | null) => void;
  pendingPeriods?: HrCommissionPeriodRecord[];
  selectedPendingPeriodId?: string | null;
}

const getPeriodLabel = (period: HrCommissionPeriodRecord): string =>
  period.label || period.periodKey || period.id;

const getPeriodAmount = (period: HrCommissionPeriodRecord): number =>
  period.netAmount ??
  period.totalPayableAmount ??
  period.totalCommissionAmount ??
  0;

const getPeriodMeta = (period: HrCommissionPeriodRecord): string =>
  `${formatHrPeriodDate(period, 'start')} - ${formatHrPeriodDate(
    period,
    'end',
  )} - ${STATUS_LABELS[period.status]} - ${formatMoney(
    getPeriodAmount(period),
    period.currency,
  )}`;

export function HrCommissionCutRulePicker({
  disabled = false,
  loading = false,
  onSelectPendingPeriod,
  pendingPeriods = [],
  selectedPendingPeriodId = null,
}: HrCommissionCutRulePickerProps) {
  const selectedPendingPeriod =
    pendingPeriods.find((period) => period.id === selectedPendingPeriodId) ??
    null;
  const previewPendingPeriod = selectedPendingPeriod ?? pendingPeriods[0];
  const pendingPreview = previewPendingPeriod
    ? getPeriodMeta(previewPendingPeriod)
    : 'Sin cortes abiertos';

  const handlePendingPeriodChange = (key: Key | null) => {
    onSelectPendingPeriod?.(key ? String(key) : null);
  };

  return (
    <PickerField>
      <PickerLabel>Cortes abiertos</PickerLabel>
      <CutRuleSelect
        aria-label="Cortes abiertos"
        selectedKey={selectedPendingPeriodId}
        isDisabled={disabled || loading || pendingPeriods.length === 0}
        onSelectionChange={handlePendingPeriodChange}
      >
        <VmSelect.Trigger>
          <VmSelect.Value>
            {selectedPendingPeriod
              ? getPeriodLabel(selectedPendingPeriod)
              : pendingPeriods.length
                ? `${pendingPeriods.length} abiertos`
                : 'Sin cortes abiertos'}
          </VmSelect.Value>
          <VmSelect.Indicator />
        </VmSelect.Trigger>
        <VmSelect.Popover>
          <CutRuleListBox aria-label="Cortes abiertos">
            {pendingPeriods.map((period) => (
              <VmListBox.Item
                key={period.id}
                id={period.id}
                textValue={`${getPeriodLabel(period)} ${getPeriodMeta(period)}`}
              >
                <PendingCutOption>
                  <PendingCutOptionTitle>
                    {getPeriodLabel(period)}
                  </PendingCutOptionTitle>
                  <PendingCutOptionMeta>
                    {getPeriodMeta(period)}
                  </PendingCutOptionMeta>
                </PendingCutOption>
                <VmListBox.ItemIndicator />
              </VmListBox.Item>
            ))}
          </CutRuleListBox>
        </VmSelect.Popover>
      </CutRuleSelect>
      {previewPendingPeriod ? (
        <PendingCutPreview>{pendingPreview}</PendingCutPreview>
      ) : null}
    </PickerField>
  );
}

export default HrCommissionCutRulePicker;
