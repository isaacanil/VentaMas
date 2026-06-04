import type { FormEvent } from 'react';
import { useState } from 'react';

import { VmButton, VmForm, VmInput, VmSwitch } from '@/components/heroui';
import {
  CheckCircleOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
  StopOutlined,
} from '@/constants/icons/antd';
import type {
  HrCommissionCutRuleInput,
  HrCommissionCutRuleRecord,
} from '@/types/hrPayroll';

import { formatHrCommissionCutRuleDayRange } from '../../utils/hrCommissionCutRules';
import {
  DayField,
  DayGroup,
  DayInput,
  EmptyState,
  Field,
  FieldLabel,
  FormActions,
  FormGrid,
  Panel,
  PanelHeader,
  PanelTitle,
  RuleActions,
  RuleDetail,
  RuleList,
  RuleMeta,
  RuleName,
  RuleRow,
  StatusPill,
  SwitchField,
} from './HrCommissionCutRulesPanel.styles';

type RuleDraft = {
  active: boolean;
  endDay: number;
  id: string | null;
  label: string;
  sortOrder: number;
  startDay: number;
};

interface HrCommissionCutRulesPanelProps {
  actionKey: string | null;
  loading?: boolean;
  onSave: (rule: HrCommissionCutRuleInput) => Promise<boolean>;
  onSetActive: (
    rule: HrCommissionCutRuleRecord,
    active: boolean,
  ) => Promise<boolean>;
  rules: HrCommissionCutRuleRecord[];
}

const toDay = (value: number | string | null | undefined, fallback: number) => {
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 31
    ? parsed
    : fallback;
};

const createEmptyDraft = (sortOrder = 1): RuleDraft => ({
  id: null,
  label: '',
  startDay: 1,
  endDay: 15,
  active: true,
  sortOrder,
});

const createDraftFromRule = (rule: HrCommissionCutRuleRecord): RuleDraft => ({
  id: rule.id,
  label: rule.label,
  startDay: rule.startDay,
  endDay: rule.endDay,
  active: rule.active,
  sortOrder: rule.sortOrder,
});

export function HrCommissionCutRulesPanel({
  actionKey,
  loading = false,
  onSave,
  onSetActive,
  rules,
}: HrCommissionCutRulesPanelProps) {
  const [draft, setDraft] = useState<RuleDraft>(() => createEmptyDraft());
  const saveKey = `cut-rule:save:${draft.id ?? 'new'}`;
  const saving = actionKey === saveKey;
  const formDisabled = loading || saving;
  const startDay = toDay(draft.startDay, 1);
  const endDay = toDay(draft.endDay, 31);
  const formInvalid = !draft.label.trim() || startDay > endDay;

  const updateDraft = <K extends keyof RuleDraft>(
    field: K,
    value: RuleDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const resetDraft = () => {
    setDraft(createEmptyDraft(rules.length + 1));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formInvalid) return;

    const saved = await onSave({
      id: draft.id,
      label: draft.label,
      frequency: 'monthly',
      startDay,
      endDay,
      active: draft.active,
      sortOrder: draft.sortOrder || startDay,
    });
    if (saved) resetDraft();
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Reglas de corte</PanelTitle>
        <VmButton
          size="sm"
          variant="secondary"
          isDisabled={formDisabled}
          onPress={resetDraft}
        >
          <PlusOutlined />
          Nueva
        </VmButton>
      </PanelHeader>

      <VmForm id="hr-cut-rule-form" onSubmit={handleSubmit}>
        <FormGrid>
          <Field>
            <FieldLabel>Nombre</FieldLabel>
            <VmInput
              aria-label="Nombre de regla"
              value={draft.label}
              disabled={formDisabled}
              placeholder="Primera quincena"
              onChange={(event) => updateDraft('label', event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>Dia inicial</FieldLabel>
            <DayField
              aria-label="Dia inicial"
              minValue={1}
              maxValue={31}
              step={1}
              value={startDay}
              isDisabled={formDisabled}
              onChange={(value) => updateDraft('startDay', toDay(value, 1))}
            >
              <DayGroup>
                <DayInput />
              </DayGroup>
            </DayField>
          </Field>

          <Field>
            <FieldLabel>Dia final</FieldLabel>
            <DayField
              aria-label="Dia final"
              minValue={1}
              maxValue={31}
              step={1}
              value={endDay}
              isDisabled={formDisabled}
              onChange={(value) => updateDraft('endDay', toDay(value, 31))}
            >
              <DayGroup>
                <DayInput />
              </DayGroup>
            </DayField>
          </Field>

          <SwitchField>
            <VmSwitch
              aria-label="Regla activa"
              isSelected={draft.active}
              isDisabled={formDisabled}
              onChange={(active) => updateDraft('active', active)}
            />
            Activa
          </SwitchField>

          <FormActions>
            <VmButton
              type="submit"
              form="hr-cut-rule-form"
              variant="primary"
              isDisabled={formDisabled || formInvalid}
            >
              <SaveOutlined />
              {saving ? 'Guardando...' : 'Guardar'}
            </VmButton>
          </FormActions>
        </FormGrid>
      </VmForm>

      {rules.length === 0 ? (
        <EmptyState>
          {loading ? 'Cargando reglas...' : 'Sin reglas configuradas'}
        </EmptyState>
      ) : (
        <RuleList>
          {rules.map((rule) => {
            const statusKey = `cut-rule:active:${rule.id}`;
            const toggling = actionKey === statusKey;

            return (
              <RuleRow key={rule.id}>
                <RuleMeta>
                  <RuleName>{rule.label}</RuleName>
                  <RuleDetail>
                    Rango mensual: {formatHrCommissionCutRuleDayRange(rule)}
                  </RuleDetail>
                </RuleMeta>
                <StatusPill $active={rule.active}>
                  {rule.active ? 'Activa' : 'Inactiva'}
                </StatusPill>
                <RuleActions>
                  <VmButton
                    size="sm"
                    variant="secondary"
                    isDisabled={formDisabled || toggling}
                    onPress={() => setDraft(createDraftFromRule(rule))}
                  >
                    <EditOutlined />
                    Editar
                  </VmButton>
                  <VmButton
                    size="sm"
                    variant={rule.active ? 'secondary' : 'primary'}
                    isDisabled={formDisabled || toggling}
                    onPress={() => void onSetActive(rule, !rule.active)}
                  >
                    {rule.active ? <StopOutlined /> : <CheckCircleOutlined />}
                    {toggling
                      ? 'Guardando...'
                      : rule.active
                        ? 'Desactivar'
                        : 'Reactivar'}
                  </VmButton>
                </RuleActions>
              </RuleRow>
            );
          })}
        </RuleList>
      )}
    </Panel>
  );
}

export default HrCommissionCutRulesPanel;

