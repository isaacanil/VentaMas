import type { FormEvent, Key } from 'react';
import { useState } from 'react';

import { VmForm, VmListBox, VmSelect } from '@/components/heroui';
import { HR_COMMISSION_CUT_RULE_FREQUENCY_LABELS as FREQUENCY_LABELS } from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrCommissionCutRuleFrequency,
  HrCommissionCutRuleInput,
  HrCommissionCutRuleRecord,
} from '@/types/hrPayroll';

import {
  Field,
  FieldLabel,
  FormGrid,
  FrequencyHelp,
  FrequencyListBox,
  Panel,
  PanelHeader,
  PanelTitle,
} from './HrCommissionCutRulesPanel.styles';

type RuleDraft = {
  endDay: number;
  frequency: HrCommissionCutRuleFrequency;
  id: string | null;
  sortOrder: number;
  startDay: number;
};

const DEFAULT_RULE_LABELS: Record<HrCommissionCutRuleFrequency, string> = {
  weekly: 'Corte semanal',
  biweekly: 'Corte quincenal',
  monthly: 'Corte mensual',
};

const DEFAULT_FREQUENCY_OPTION = {
  frequency: 'biweekly' as const,
  startDay: 1,
  endDay: 15,
  description: '1-15 y 16-fin de mes',
};

const FREQUENCY_OPTIONS: Array<{
  description: string;
  endDay: number;
  frequency: HrCommissionCutRuleFrequency;
  startDay: number;
}> = [
  {
    frequency: 'weekly',
    startDay: 1,
    endDay: 7,
    description: 'Lunes a domingo',
  },
  DEFAULT_FREQUENCY_OPTION,
  {
    frequency: 'monthly',
    startDay: 1,
    endDay: 31,
    description: 'Mes completo',
  },
];

const getFrequencyOption = (frequency: HrCommissionCutRuleFrequency) =>
  FREQUENCY_OPTIONS.find((option) => option.frequency === frequency) ??
  DEFAULT_FREQUENCY_OPTION;

interface HrCommissionCutRulesPanelProps {
  actionKey: string | null;
  loading?: boolean;
  onSave: (rule: HrCommissionCutRuleInput) => Promise<boolean>;
  rules: HrCommissionCutRuleRecord[];
  variant?: 'standalone' | 'embedded';
}

const createEmptyDraft = (sortOrder = 1): RuleDraft => ({
  id: null,
  frequency: 'biweekly',
  startDay: getFrequencyOption('biweekly').startDay,
  endDay: getFrequencyOption('biweekly').endDay,
  sortOrder,
});

const createDraftFromRule = (rule: HrCommissionCutRuleRecord): RuleDraft => ({
  id: rule.id,
  frequency: rule.frequency,
  startDay: getFrequencyOption(rule.frequency).startDay,
  endDay: getFrequencyOption(rule.frequency).endDay,
  sortOrder: rule.sortOrder,
});

const resolveConfigurationRule = (rules: HrCommissionCutRuleRecord[]) =>
  rules.find((rule) => rule.active) ?? rules[0] ?? null;

export function HrCommissionCutRulesPanel({
  actionKey,
  loading = false,
  onSave,
  rules,
  variant = 'standalone',
}: HrCommissionCutRulesPanelProps) {
  const configurationRule = resolveConfigurationRule(rules);
  const [draft, setDraft] = useState<RuleDraft>(() =>
    configurationRule
      ? createDraftFromRule(configurationRule)
      : createEmptyDraft(),
  );
  const saveKey = `cut-rule:save:${draft.id ?? 'new'}`;
  const saving = actionKey === saveKey;
  const formDisabled = loading || saving;
  const frequencyOption = getFrequencyOption(draft.frequency);

  const handleFrequencyChange = (key: Key | null) => {
    const frequency = String(key ?? 'biweekly') as HrCommissionCutRuleFrequency;
    const option = getFrequencyOption(frequency);

    setDraft((current) => ({
      ...current,
      frequency: option.frequency,
      startDay: option.startDay,
      endDay: option.endDay,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSave({
      id: draft.id,
      label: DEFAULT_RULE_LABELS[frequencyOption.frequency],
      frequency: frequencyOption.frequency,
      startDay: frequencyOption.startDay,
      endDay: frequencyOption.endDay,
      active: true,
      sortOrder: draft.sortOrder || frequencyOption.startDay,
    });
  };

  return (
    <Panel $variant={variant}>
      {variant === 'embedded' ? null : (
        <PanelHeader>
          <PanelTitle>Configuración del corte</PanelTitle>
        </PanelHeader>
      )}

      <VmForm id="hr-cut-rule-form" onSubmit={handleSubmit}>
        <FormGrid>
          <Field>
            <FieldLabel>Frecuencia</FieldLabel>
            <VmSelect
              aria-label="Frecuencia de corte"
              selectedKey={frequencyOption.frequency}
              isDisabled={formDisabled}
              onSelectionChange={handleFrequencyChange}
            >
              <VmSelect.Trigger>
                <VmSelect.Value>
                  {FREQUENCY_LABELS[frequencyOption.frequency]}
                </VmSelect.Value>
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <FrequencyListBox aria-label="Frecuencias de corte">
                  {FREQUENCY_OPTIONS.map((option) => (
                    <VmListBox.Item
                      key={option.frequency}
                      id={option.frequency}
                      textValue={FREQUENCY_LABELS[option.frequency]}
                    >
                      {FREQUENCY_LABELS[option.frequency]}
                      <VmListBox.ItemIndicator />
                    </VmListBox.Item>
                  ))}
                </FrequencyListBox>
              </VmSelect.Popover>
            </VmSelect>
            <FrequencyHelp>{frequencyOption.description}</FrequencyHelp>
          </Field>
        </FormGrid>
      </VmForm>
    </Panel>
  );
}

export default HrCommissionCutRulesPanel;
