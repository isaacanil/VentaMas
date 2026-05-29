import { message } from 'antd';
import type { FormEvent, Key } from 'react';
import { useState } from 'react';
import styled from 'styled-components';

import {
  VmButton,
  VmForm,
  VmInput,
  VmLabel,
  VmListBox,
  VmNumberField,
  VmSelect,
  VmSpinner,
} from '@/components/heroui';
import { ClearOutlined, SaveOutlined } from '@/constants/icons/antd';
import { saveServiceCommissionCollaborator } from '@/firebase/commissions/useServiceCommissionCollaborators';
import type { ServiceCommissionType } from '@/types/commissions';

interface CollaboratorsManagerProps {
  businessId?: string | null;
  userId?: string | null;
}

type CollaboratorDraft = {
  active: boolean;
  code: string;
  defaultRate: number;
  defaultType: ServiceCommissionType;
  id?: string | null;
  name: string;
  notes: string;
};

const EMPTY_DRAFT: CollaboratorDraft = {
  id: null,
  code: '',
  name: '',
  defaultType: 'percentage',
  defaultRate: 0,
  active: true,
  notes: '',
};

const COMMISSION_TYPE_OPTIONS: Array<{
  label: string;
  value: ServiceCommissionType;
}> = [
  { label: 'Porcentaje', value: 'percentage' },
  { label: 'Monto fijo', value: 'fixed' },
];

const Panel = styled(VmForm)`
  display: grid;
  gap: var(--ds-space-4);
  width: 100%;
  min-width: 0;
  container-type: inline-size;
`;

const Header = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const Title = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
`;

const Description = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.45fr) minmax(
      0,
      1fr
    ) minmax(0, 0.9fr);
  gap: var(--ds-space-3);
  align-items: start;
  min-width: 0;

  @container (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @container (max-width: 440px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Field = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  min-width: 0;
`;

const NameField = styled(Field)`
  @container (max-width: 640px) and (min-width: 441px) {
    grid-column: 1 / -1;
  }
`;

const FieldLabel = styled(VmLabel)`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-tight);
`;

const TextInput = styled(VmInput)`
  width: 100%;
  min-width: 0;
  min-height: 38px;
`;

const CommissionSelect = styled(VmSelect)`
  width: 100%;
  min-width: 0;
`;

const SelectTrigger = styled(VmSelect.Trigger)`
  width: 100%;
  min-height: 38px;
`;

const CommissionListBox = styled(VmListBox)`
  min-width: min(220px, calc(100vw - var(--ds-space-6)));
`;

const RateField = styled(VmNumberField)`
  width: 100%;
  min-width: 0;
`;

const RateGroup = styled(VmNumberField.Group)`
  min-height: 38px;
`;

const RateInput = styled(VmNumberField.Input)`
  min-width: 0;
  padding-inline: var(--ds-space-3);
`;

const RateUnit = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  align-self: stretch;
  padding: 0 var(--ds-space-3);
  border-left: 1px solid var(--ds-color-border-default);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  background: var(--ds-color-bg-subtle);
`;

const FormActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;

  @container (max-width: 440px) {
    flex-direction: column-reverse;
  }
`;

const ActionButton = styled(VmButton)`
  min-width: 112px;

  @container (max-width: 440px) {
    width: 100%;
  }
`;

export const CollaboratorsManager = ({
  businessId,
  userId,
}: CollaboratorsManagerProps) => {
  const [draft, setDraft] = useState<CollaboratorDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const canSave = Boolean(businessId && draft.code.trim() && draft.name.trim());

  const resetDraft = () => setDraft(EMPTY_DRAFT);

  const handleTypeChange = (key: Key | null) => {
    if (!key) return;
    setDraft((current) => ({
      ...current,
      defaultType: String(key) as ServiceCommissionType,
    }));
  };

  const handleRateChange = (value: number | string | null) => {
    const numericValue = typeof value === 'string' ? Number(value) : value;
    setDraft((current) => ({
      ...current,
      defaultRate:
        typeof numericValue === 'number' && Number.isFinite(numericValue)
          ? numericValue
          : 0,
    }));
  };

  const handleSave = async () => {
    if (saving) return;

    if (!businessId || !canSave) {
      message.warning('Completa codigo y nombre del colaborador.');
      return;
    }

    setSaving(true);
    try {
      await saveServiceCommissionCollaborator({
        businessId,
        userId,
        collaborator: draft,
      });
      message.success('Colaborador guardado');
      resetDraft();
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el colaborador.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSave();
  };

  return (
    <Panel onSubmit={handleSubmit}>
      <Header>
        <Title>Crear colaborador</Title>
        <Description>
          Agrega un colaborador al catalogo usado para asignar comisiones en
          servicios.
        </Description>
      </Header>

      <FormGrid>
        <Field>
          <FieldLabel>Codigo</FieldLabel>
          <TextInput
            fullWidth
            aria-label="Codigo del colaborador"
            value={draft.code}
            disabled={saving}
            placeholder="C-001"
            autoComplete="off"
            onChange={(event) =>
              setDraft((current) => ({ ...current, code: event.target.value }))
            }
          />
        </Field>
        <NameField>
          <FieldLabel>Nombre</FieldLabel>
          <TextInput
            fullWidth
            aria-label="Nombre del colaborador"
            value={draft.name}
            disabled={saving}
            placeholder="Nombre del colaborador"
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
          />
        </NameField>
        <Field>
          <FieldLabel>Tipo</FieldLabel>
          <CommissionSelect
            fullWidth
            aria-label="Tipo de comision"
            selectedKey={draft.defaultType}
            isDisabled={saving}
            onSelectionChange={handleTypeChange}
          >
            <SelectTrigger>
              <VmSelect.Value />
              <VmSelect.Indicator />
            </SelectTrigger>
            <VmSelect.Popover>
              <CommissionListBox aria-label="Tipos de comision">
                {COMMISSION_TYPE_OPTIONS.map((option) => (
                  <VmListBox.Item
                    key={option.value}
                    id={option.value}
                    textValue={option.label}
                  >
                    {option.label}
                    <VmListBox.ItemIndicator />
                  </VmListBox.Item>
                ))}
              </CommissionListBox>
            </VmSelect.Popover>
          </CommissionSelect>
        </Field>
        <Field>
          <FieldLabel>Tasa</FieldLabel>
          <RateField
            fullWidth
            aria-label="Tasa de comision"
            minValue={0}
            step={0.01}
            value={draft.defaultRate}
            isDisabled={saving}
            onChange={handleRateChange}
          >
            <RateGroup>
              <RateInput />
              <RateUnit>
                {draft.defaultType === 'percentage' ? '%' : 'RD$'}
              </RateUnit>
            </RateGroup>
          </RateField>
        </Field>
      </FormGrid>

      <FormActions>
        <ActionButton
          type="button"
          variant="secondary"
          isDisabled={saving}
          onPress={resetDraft}
        >
          <ClearOutlined />
          Limpiar
        </ActionButton>
        <ActionButton
          type="submit"
          variant="primary"
          isDisabled={saving || !canSave}
        >
          {saving ? <VmSpinner size="sm" /> : <SaveOutlined />}
          {saving ? 'Guardando...' : 'Crear'}
        </ActionButton>
      </FormActions>
    </Panel>
  );
};

export default CollaboratorsManager;
