import type { Key } from 'react';

import { VmButton, VmListBox, VmSelect } from '@/components/heroui';
import { DeleteOutlined, PlusOutlined } from '@/constants/icons/antd';
import type { ServiceProductOption } from '@/firebase/products/useServiceProductOptions';
import { HR_COMMISSION_TYPE_LABELS as COMMISSION_TYPE_LABELS } from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  ServiceCommissionServiceRule,
  ServiceCommissionType,
} from '@/domain/commissions/types';
import {
  normalizeServiceCommissionServiceRules,
  toFiniteCommissionNumber,
} from '@/utils/commissions/serviceCommissions';

import { getOptionLabel } from '../HrEmployeeEditorModal.helpers';
import {
  EmptyState,
  RateField,
  RateGroup,
  RateInput,
  RateUnit,
  RemoveButtonSlot,
  RuleField,
  RuleLabel,
  RuleList,
  RuleRow,
  Section,
  SectionHeader,
  SectionTitle,
  ServiceListBox,
  ServiceSelect,
  TypeListBox,
  TypeSelect,
} from './ServiceCommissionRulesEditor.styles';

interface ServiceCommissionRulesEditorProps {
  disabled?: boolean;
  loading?: boolean;
  onChange: (rules: ServiceCommissionServiceRule[]) => void;
  rules?: ServiceCommissionServiceRule[] | null;
  serviceOptions: ServiceProductOption[];
}

const createRuleFromService = (
  option: ServiceProductOption,
): ServiceCommissionServiceRule => ({
  id: option.serviceId,
  serviceId: option.serviceId,
  serviceName: option.serviceName,
  type: 'percentage',
  rateValue: 0,
  active: true,
});

const getServiceOptionsForRule = (
  serviceOptions: ServiceProductOption[],
  rules: ServiceCommissionServiceRule[],
  rule: ServiceCommissionServiceRule,
) => {
  const selectedIds = new Set(
    rules
      .map((entry) => entry.serviceId)
      .filter((serviceId) => serviceId !== rule.serviceId),
  );
  const scopedOptions = serviceOptions.filter(
    (option) => !selectedIds.has(option.value),
  );
  if (scopedOptions.some((option) => option.value === rule.serviceId)) {
    return scopedOptions;
  }

  return [
    {
      label: rule.serviceName ?? rule.serviceId,
      serviceId: rule.serviceId,
      serviceName: rule.serviceName ?? rule.serviceId,
      value: rule.serviceId,
    },
    ...scopedOptions,
  ];
};

export const ServiceCommissionRulesEditor = ({
  disabled = false,
  loading = false,
  onChange,
  rules,
  serviceOptions,
}: ServiceCommissionRulesEditorProps) => {
  const normalizedRules = normalizeServiceCommissionServiceRules(rules);
  const selectedServiceIds = new Set(
    normalizedRules.map((rule) => rule.serviceId),
  );
  const firstAvailableService =
    serviceOptions.find((option) => !selectedServiceIds.has(option.value)) ??
    null;
  const canAddRule = !disabled && !loading && Boolean(firstAvailableService);

  const updateRule = (
    index: number,
    patch: Partial<ServiceCommissionServiceRule>,
  ) => {
    onChange(
      normalizedRules.map((rule, currentIndex) =>
        currentIndex === index ? { ...rule, ...patch } : rule,
      ),
    );
  };

  const handleServiceChange = (index: number, key: Key | null) => {
    const serviceId = key ? String(key) : null;
    const option =
      serviceOptions.find((entry) => entry.value === serviceId) ?? null;
    if (!option) return;

    updateRule(index, {
      id: option.serviceId,
      serviceId: option.serviceId,
      serviceName: option.serviceName,
    });
  };

  const handleAddRule = () => {
    if (!firstAvailableService) return;
    onChange([
      ...normalizedRules,
      createRuleFromService(firstAvailableService),
    ]);
  };

  const handleRemoveRule = (index: number) => {
    onChange(
      normalizedRules.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Comisión por servicio</SectionTitle>
        <VmButton
          size="sm"
          variant="secondary"
          isDisabled={!canAddRule}
          onPress={handleAddRule}
        >
          <PlusOutlined />
          Agregar servicio
        </VmButton>
      </SectionHeader>

      {normalizedRules.length === 0 ? (
        <EmptyState>
          {loading ? 'Cargando servicios...' : 'Sin servicios específicos'}
        </EmptyState>
      ) : (
        <RuleList>
          {normalizedRules.map((rule, index) => {
            const rowServiceOptions = getServiceOptionsForRule(
              serviceOptions,
              normalizedRules,
              rule,
            );
            const type = rule.type ?? 'percentage';

            return (
              <RuleRow key={`${rule.serviceId}-${index}`}>
                <RuleField>
                  <RuleLabel>Servicio</RuleLabel>
                  <ServiceSelect
                    aria-label={`Servicio ${index + 1}`}
                    selectedKey={rule.serviceId}
                    isDisabled={disabled || loading}
                    onSelectionChange={(key) => handleServiceChange(index, key)}
                  >
                    <VmSelect.Trigger>
                      <VmSelect.Value />
                      <VmSelect.Indicator />
                    </VmSelect.Trigger>
                    <VmSelect.Popover>
                      <ServiceListBox aria-label="Servicios">
                        {rowServiceOptions.map((option) => (
                          <VmListBox.Item
                            key={option.value}
                            id={option.value}
                            textValue={option.label}
                          >
                            {option.label}
                            <VmListBox.ItemIndicator />
                          </VmListBox.Item>
                        ))}
                      </ServiceListBox>
                    </VmSelect.Popover>
                  </ServiceSelect>
                </RuleField>

                <RuleField>
                  <RuleLabel>Tipo</RuleLabel>
                  <TypeSelect
                    aria-label={`Tipo de comisión ${index + 1}`}
                    selectedKey={type}
                    isDisabled={disabled}
                    onSelectionChange={(key) =>
                      updateRule(index, {
                        type: String(key) as ServiceCommissionType,
                      })
                    }
                  >
                    <VmSelect.Trigger>
                      <VmSelect.Value>
                        {getOptionLabel(COMMISSION_TYPE_LABELS, type)}
                      </VmSelect.Value>
                      <VmSelect.Indicator />
                    </VmSelect.Trigger>
                    <VmSelect.Popover>
                      <TypeListBox aria-label="Tipos de comisión">
                        {Object.entries(COMMISSION_TYPE_LABELS).map(
                          ([value, label]) => (
                            <VmListBox.Item
                              key={value}
                              id={value}
                              textValue={label}
                            >
                              {label}
                              <VmListBox.ItemIndicator />
                            </VmListBox.Item>
                          ),
                        )}
                      </TypeListBox>
                    </VmSelect.Popover>
                  </TypeSelect>
                </RuleField>

                <RuleField>
                  <RuleLabel>Valor</RuleLabel>
                  <RateField
                    aria-label={`Valor de comisión ${index + 1}`}
                    minValue={0}
                    step={0.01}
                    value={toFiniteCommissionNumber(rule.rateValue)}
                    isDisabled={disabled}
                    onChange={(value) =>
                      updateRule(index, {
                        rateValue: Math.max(0, toFiniteCommissionNumber(value)),
                      })
                    }
                  >
                    <RateGroup>
                      <RateInput />
                      <RateUnit>{type === 'percentage' ? '%' : 'RD$'}</RateUnit>
                    </RateGroup>
                  </RateField>
                </RuleField>

                <RemoveButtonSlot>
                  <VmButton
                    aria-label={`Quitar ${rule.serviceName ?? 'servicio'}`}
                    isIconOnly
                    size="sm"
                    variant="secondary"
                    isDisabled={disabled}
                    onPress={() => handleRemoveRule(index)}
                  >
                    <DeleteOutlined />
                  </VmButton>
                </RemoveButtonSlot>
              </RuleRow>
            );
          })}
        </RuleList>
      )}
    </Section>
  );
};

export default ServiceCommissionRulesEditor;
