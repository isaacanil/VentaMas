import type { Key } from 'react';

import { VmListBox, VmSelect } from '@/components/heroui';
import {
  formatHrDate as formatDate,
  formatHrMoney as formatMoney,
  HR_COMMISSION_CUT_RULE_FREQUENCY_LABELS as FREQUENCY_LABELS,
  HR_COMMISSION_PERIOD_STATUS_LABELS as STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrCommissionCutRuleRecord,
  HrCommissionPeriodRecord,
} from '@/types/hrPayroll';

import type { HrCommissionCutRuleRange } from '../../utils/hrCommissionCutRules';
import {
  CutRuleListBox,
  CutRuleSelect,
  PendingCutField,
  PendingCutPreview,
  PickerField,
  PickerLabel,
  RangePreview,
} from './HrCommissionCutRulePicker.styles';

interface HrCommissionCutRulePickerProps {
  disabled?: boolean;
  loading?: boolean;
  onSelectPendingPeriod?: (periodId: string | null) => void;
  onSelect: (ruleId: string | null) => void;
  pendingPeriods?: HrCommissionPeriodRecord[];
  range: HrCommissionCutRuleRange | null;
  rules: HrCommissionCutRuleRecord[];
  selectedPendingPeriodId?: string | null;
  selectedRuleId: string | null;
}

export function HrCommissionCutRulePicker({
  disabled = false,
  loading = false,
  onSelectPendingPeriod,
  onSelect,
  pendingPeriods = [],
  range,
  rules,
  selectedPendingPeriodId = null,
  selectedRuleId,
}: HrCommissionCutRulePickerProps) {
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? null;
  const selectedPendingPeriod =
    pendingPeriods.find((period) => period.id === selectedPendingPeriodId) ??
    null;
  const previewPendingPeriod = selectedPendingPeriod ?? pendingPeriods[0];
  const preview = range
    ? `${range.startKey} - ${range.endKey}`
    : 'Sin rango generado';
  const pendingPreview = previewPendingPeriod
    ? `${formatDate(previewPendingPeriod.startDate)} - ${formatDate(
        previewPendingPeriod.endDate,
      )} - ${STATUS_LABELS[previewPendingPeriod.status]} - ${formatMoney(
        previewPendingPeriod.netAmount ??
          previewPendingPeriod.totalPayableAmount ??
          previewPendingPeriod.totalCommissionAmount ??
          0,
        previewPendingPeriod.currency,
      )}`
    : 'Sin cortes pendientes';

  const handleSelectionChange = (key: Key | null) => {
    onSelect(key ? String(key) : null);
  };

  const handlePendingPeriodChange = (key: Key | null) => {
    onSelectPendingPeriod?.(key ? String(key) : null);
  };

  return (
    <PickerField>
      <PickerLabel>Regla de corte</PickerLabel>
      <CutRuleSelect
        aria-label="Regla de corte"
        selectedKey={selectedRuleId}
        isDisabled={disabled || loading || rules.length === 0}
        onSelectionChange={handleSelectionChange}
      >
        <VmSelect.Trigger>
          <VmSelect.Value>
            {selectedRule ? selectedRule.label : 'Sin reglas activas'}
          </VmSelect.Value>
          <VmSelect.Indicator />
        </VmSelect.Trigger>
        <VmSelect.Popover>
          <CutRuleListBox aria-label="Reglas de corte">
            {rules.map((rule) => (
              <VmListBox.Item key={rule.id} id={rule.id} textValue={rule.label}>
                {rule.label} - {FREQUENCY_LABELS[rule.frequency]}
                <VmListBox.ItemIndicator />
              </VmListBox.Item>
            ))}
          </CutRuleListBox>
        </VmSelect.Popover>
      </CutRuleSelect>
      <RangePreview>Proximo corte: {preview}</RangePreview>

      {pendingPeriods.length > 0 ? (
        <PendingCutField>
          <PickerLabel>Cortes pendientes</PickerLabel>
          <CutRuleSelect
            aria-label="Cortes pendientes no pagados"
            selectedKey={selectedPendingPeriodId}
            isDisabled={disabled || loading}
            onSelectionChange={handlePendingPeriodChange}
          >
            <VmSelect.Trigger>
              <VmSelect.Value>
                {selectedPendingPeriod
                  ? selectedPendingPeriod.label ||
                    selectedPendingPeriod.periodKey ||
                    selectedPendingPeriod.id
                  : `${pendingPeriods.length} sin pagar`}
              </VmSelect.Value>
              <VmSelect.Indicator />
            </VmSelect.Trigger>
            <VmSelect.Popover>
              <CutRuleListBox aria-label="Cortes pendientes no pagados">
                {pendingPeriods.map((period) => (
                  <VmListBox.Item
                    key={period.id}
                    id={period.id}
                    textValue={period.label || period.periodKey || period.id}
                  >
                    {period.label || period.periodKey || period.id} -{' '}
                    {STATUS_LABELS[period.status]}
                    <VmListBox.ItemIndicator />
                  </VmListBox.Item>
                ))}
              </CutRuleListBox>
            </VmSelect.Popover>
          </CutRuleSelect>
          <PendingCutPreview>{pendingPreview}</PendingCutPreview>
        </PendingCutField>
      ) : null}
    </PickerField>
  );
}

export default HrCommissionCutRulePicker;
