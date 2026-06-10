import type { FormEvent, Key } from 'react';
import { useState } from 'react';

import {
  VmButton,
  VmForm,
  VmListBox,
  VmModal,
  VmNumberField,
  VmSelect,
  VmSwitch,
} from '@/components/heroui';
import type { ServiceProductOption } from '@/firebase/products/useServiceProductOptions';
import { HR_COMMISSION_TYPE_LABELS as COMMISSION_TYPE_LABELS } from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type { HrEmployeeInput, HrEmployeeRecord } from '@/types/hrPayroll';
import { normalizeServiceCommissionServiceRules } from '@/utils/commissions/serviceCommissions';

import {
  getOptionLabel,
  toFiniteNumber,
} from '../HrEmployeeEditorModal.helpers';
import type { HrEmployeeFormValues } from '../HrEmployeeEditorModal.types';
import { ServiceCommissionRulesEditor } from '../ServiceCommissionRulesEditor/ServiceCommissionRulesEditor';
import {
  Field,
  FieldGrid,
  FieldHint,
  FieldLabel,
  ModalActions,
  SwitchCopy,
  SwitchField,
} from './HrEmployeeServiceCommissionModal.styles';

interface HrEmployeeServiceCommissionModalProps {
  employee: HrEmployeeRecord;
  initialValues: HrEmployeeFormValues;
  onCancel: () => void;
  onSave: (values: HrEmployeeFormValues) => void | Promise<void>;
  open: boolean;
  saving: boolean;
  serviceOptions: ServiceProductOption[];
  servicesLoading: boolean;
}

export function HrEmployeeServiceCommissionModal({
  employee,
  initialValues,
  onCancel,
  onSave,
  open,
  saving,
  serviceOptions,
  servicesLoading,
}: HrEmployeeServiceCommissionModalProps) {
  const [draft, setDraft] = useState<HrEmployeeFormValues>(() => ({
    ...initialValues,
    commissionEnabled: initialValues.commissionEnabled === true,
    defaultCommissionType: initialValues.defaultCommissionType ?? 'percentage',
    defaultCommissionRate: initialValues.defaultCommissionRate ?? null,
    serviceCommissionRules: normalizeServiceCommissionServiceRules(
      initialValues.serviceCommissionRules,
    ),
  }));
  const commissionFieldsDisabled = saving || draft.commissionEnabled !== true;
  const title = 'Comisión por servicio';

  const updateField = <K extends keyof HrEmployeeFormValues>(
    field: K,
    value: HrEmployeeFormValues[K],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleCommissionTypeChange = (key: Key | null) => {
    updateField(
      'defaultCommissionType',
      (key
        ? String(key)
        : 'percentage') as HrEmployeeInput['defaultCommissionType'],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSave({
      ...draft,
      commissionEnabled: draft.commissionEnabled === true,
      defaultCommissionType: draft.defaultCommissionType ?? 'percentage',
      defaultCommissionRate:
        draft.defaultCommissionRate == null
          ? null
          : toFiniteNumber(draft.defaultCommissionRate),
      serviceCommissionRules: normalizeServiceCommissionServiceRules(
        draft.serviceCommissionRules,
      ),
    });
  };

  return (
    <VmModal
      title={title}
      ariaLabel={`${title} de ${employee.fullName}`}
      isOpen={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
      size="lg"
      footer={
        <ModalActions>
          <VmButton variant="secondary" isDisabled={saving} onPress={onCancel}>
            Cancelar
          </VmButton>
          <VmButton
            type="submit"
            form="hr-employee-service-commission-form"
            variant="primary"
            isDisabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </VmButton>
        </ModalActions>
      }
    >
      <VmForm id="hr-employee-service-commission-form" onSubmit={handleSubmit}>
        <FieldGrid>
          <SwitchField>
            <SwitchCopy>
              <FieldLabel>Comisiones</FieldLabel>
              <FieldHint>{employee.fullName}</FieldHint>
            </SwitchCopy>
            <VmSwitch
              aria-label="Comisiones"
              isSelected={draft.commissionEnabled === true}
              isDisabled={saving}
              onChange={(commissionEnabled) =>
                updateField('commissionEnabled', commissionEnabled)
              }
            />
          </SwitchField>

          <Field>
            <FieldLabel>Tipo general</FieldLabel>
            <VmSelect
              aria-label="Tipo general"
              selectedKey={draft.defaultCommissionType ?? 'percentage'}
              isDisabled={commissionFieldsDisabled}
              onSelectionChange={handleCommissionTypeChange}
            >
              <VmSelect.Trigger>
                <VmSelect.Value>
                  {getOptionLabel(
                    COMMISSION_TYPE_LABELS,
                    draft.defaultCommissionType,
                  )}
                </VmSelect.Value>
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <VmListBox aria-label="Tipos de comisión">
                  {Object.entries(COMMISSION_TYPE_LABELS).map(
                    ([value, label]) => (
                      <VmListBox.Item key={value} id={value} textValue={label}>
                        {label}
                        <VmListBox.ItemIndicator />
                      </VmListBox.Item>
                    ),
                  )}
                </VmListBox>
              </VmSelect.Popover>
            </VmSelect>
          </Field>

          <Field>
            <FieldLabel>Valor general</FieldLabel>
            <VmNumberField
              aria-label="Valor general"
              minValue={0}
              step={0.01}
              value={toFiniteNumber(draft.defaultCommissionRate)}
              isDisabled={commissionFieldsDisabled}
              onChange={(value) => updateField('defaultCommissionRate', value)}
            >
              <VmNumberField.Group>
                <VmNumberField.Input />
              </VmNumberField.Group>
            </VmNumberField>
          </Field>

          <ServiceCommissionRulesEditor
            disabled={commissionFieldsDisabled}
            loading={servicesLoading}
            rules={draft.serviceCommissionRules}
            serviceOptions={serviceOptions}
            onChange={(serviceCommissionRules) =>
              updateField('serviceCommissionRules', serviceCommissionRules)
            }
          />
        </FieldGrid>
      </VmForm>
    </VmModal>
  );
}

export default HrEmployeeServiceCommissionModal;
