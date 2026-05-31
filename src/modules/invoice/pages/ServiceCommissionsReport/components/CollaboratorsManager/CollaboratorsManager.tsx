import { message } from 'antd';
import type { FormEvent, Key } from 'react';
import { useState } from 'react';

import { VmListBox, VmSelect, VmSpinner } from '@/components/heroui';
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

import {
  Panel,
  Header,
  Title,
  Description,
  FormGrid,
  Field,
  NameField,
  FieldLabel,
  TextInput,
  CommissionSelect,
  SelectTrigger,
  CommissionListBox,
  RateField,
  RateGroup,
  RateInput,
  RateUnit,
  FormActions,
  ActionButton,
} from './CollaboratorsManager.styles';

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
