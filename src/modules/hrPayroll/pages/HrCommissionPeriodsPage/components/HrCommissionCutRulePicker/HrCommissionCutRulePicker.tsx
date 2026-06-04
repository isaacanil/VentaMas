import type { Key } from 'react';

import { VmListBox, VmSelect } from '@/components/heroui';
import type { HrCommissionCutRuleRecord } from '@/types/hrPayroll';

import type { HrCommissionCutRuleRange } from '../../utils/hrCommissionCutRules';
import { formatHrCommissionCutRuleDayRange } from '../../utils/hrCommissionCutRules';
import {
  CutRuleListBox,
  CutRuleSelect,
  PickerField,
  PickerLabel,
  RangePreview,
} from './HrCommissionCutRulePicker.styles';

interface HrCommissionCutRulePickerProps {
  disabled?: boolean;
  loading?: boolean;
  onSelect: (ruleId: string | null) => void;
  range: HrCommissionCutRuleRange | null;
  rules: HrCommissionCutRuleRecord[];
  selectedRuleId: string | null;
}

export function HrCommissionCutRulePicker({
  disabled = false,
  loading = false,
  onSelect,
  range,
  rules,
  selectedRuleId,
}: HrCommissionCutRulePickerProps) {
  const selectedRule =
    rules.find((rule) => rule.id === selectedRuleId) ?? null;
  const preview = range
    ? `${range.startKey} - ${range.endKey}`
    : 'Sin rango generado';

  const handleSelectionChange = (key: Key | null) => {
    onSelect(key ? String(key) : null);
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
              <VmListBox.Item
                key={rule.id}
                id={rule.id}
                textValue={rule.label}
              >
                {rule.label} ({formatHrCommissionCutRuleDayRange(rule)})
                <VmListBox.ItemIndicator />
              </VmListBox.Item>
            ))}
          </CutRuleListBox>
        </VmSelect.Popover>
      </CutRuleSelect>
      <RangePreview>{preview}</RangePreview>
    </PickerField>
  );
}

export default HrCommissionCutRulePicker;

