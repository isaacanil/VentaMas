import { message } from 'antd';
import type { Key } from 'react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  VmAlert,
  VmCard,
  VmListBox,
  VmNumberField,
  VmSelect,
  VmSwitch,
} from '@/components/heroui';
import { InfoCircleOutlined } from '@/constants/icons/antd';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import type { CartSettings } from '@/features/cart/types';
import { selectUser } from '@/features/auth/userSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';
import { normalizeServiceCommissionSettings } from '@/utils/commissions/serviceCommissions';
import type {
  ServiceCommissionsBillingSettings,
  ServiceCommissionType,
} from '@/domain/commissions/types';

const Wrapper = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

const InfoBanner = styled(VmAlert)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-color: var(--ds-color-state-info);
  background: var(--ds-color-state-info-subtle);
  color: var(--ds-color-state-info-text);
`;

const InfoIcon = styled(VmAlert.Indicator)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-state-info-text);
`;

const InfoText = styled(VmAlert.Description)`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const InfoExample = styled.span`
  display: block;
  margin-top: var(--ds-space-1);
  color: var(--ds-color-text-secondary);
`;

const ConfigRow = styled(VmCard)`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-4);
  align-items: center;
  padding: var(--ds-space-4);

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(160px, 220px);
  gap: var(--ds-space-4);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: var(--ds-space-2);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
`;

const CommissionSelect = styled(VmSelect)`
  width: 100%;
`;

const CommissionListBox = styled(VmListBox)`
  min-width: 220px;
`;

const RateField = styled(VmNumberField)`
  width: 100%;
`;

const RateGroup = styled(VmNumberField.Group)`
  min-height: 36px;
`;

const RateInput = styled(VmNumberField.Input)`
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

const Title = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const Description = styled.p`
  margin: var(--ds-space-1) 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const COMMISSION_TYPE_OPTIONS: Array<{
  label: string;
  value: ServiceCommissionType;
}> = [
  { label: 'Porcentaje', value: 'percentage' },
  { label: 'Monto fijo', value: 'fixed' },
];

const ServiceCommissionSettingsSection = () => {
  const user = useSelector(selectUser);
  const settings = useSelector(SelectSettingCart) as CartSettings;
  const [saving, setSaving] = useState(false);
  const serviceCommissions = normalizeServiceCommissionSettings(
    settings?.billing?.serviceCommissions,
  );
  const interactionDisabled = !serviceCommissions.enabled || saving;

  const handleTypeChange = (key: Key | null) => {
    if (!key) return;
    void persist({ defaultType: String(key) as ServiceCommissionType });
  };

  const handleRateChange = (value: number | string | null) => {
    const numericValue = typeof value === 'string' ? Number(value) : value;
    void persist({
      defaultRate:
        typeof numericValue === 'number' && Number.isFinite(numericValue)
          ? numericValue
          : 0,
    });
  };

  const persist = async (patch: Partial<ServiceCommissionsBillingSettings>) => {
    setSaving(true);
    try {
      await setBillingSettings(user, {
        serviceCommissions: {
          ...serviceCommissions,
          ...patch,
          appliesTo: 'services',
          calculationBase: 'netSubtotalWithoutTax',
          showOnPrintedInvoice: false,
        },
      });
      message.success('Configuración de comisiones guardada');
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la configuración de comisiones.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrapper aria-busy={saving}>
      <InfoBanner status="accent">
        <InfoIcon>
          <InfoCircleOutlined />
        </InfoIcon>
        <VmAlert.Content>
          <InfoText>
            Las comisiones se calculan sobre el subtotal neto del servicio, sin
            ITBIS y después de descuentos.
            <InfoExample>
              Ejemplo: venta RD$590 con ITBIS incluido -&gt; base RD$500 -&gt;
              comisión RD$50 al 10%.
            </InfoExample>
          </InfoText>
        </VmAlert.Content>
      </InfoBanner>

      <ConfigRow>
        <div>
          <Title>Comisiones de servicios</Title>
          <Description>
            Activa la asignación de colaborador en cada línea de servicio y el
            reporte de comisiones.
          </Description>
        </div>
        <VmSwitch
          aria-label="Activar comisiones de servicios"
          isSelected={serviceCommissions.enabled}
          isDisabled={saving}
          onChange={(enabled) => {
            void persist({ enabled });
          }}
        />
      </ConfigRow>

      <ConfigRow>
        <div>
          <Title>Colaborador requerido</Title>
          <Description>
            Bloquea la facturación si una línea de servicio no tiene colaborador
            asignado.
          </Description>
        </div>
        <VmSwitch
          aria-label="Exigir colaborador en servicios"
          isSelected={serviceCommissions.requireCollaboratorOnService}
          isDisabled={interactionDisabled}
          onChange={(requireCollaboratorOnService) => {
            void persist({ requireCollaboratorOnService });
          }}
        />
      </ConfigRow>

      <FieldGrid>
        <Field>
          Tipo predeterminado
          <CommissionSelect
            fullWidth
            aria-label="Tipo predeterminado de comisión"
            selectedKey={serviceCommissions.defaultType}
            onSelectionChange={handleTypeChange}
            isDisabled={interactionDisabled}
          >
            <VmSelect.Trigger>
              <VmSelect.Value />
              <VmSelect.Indicator />
            </VmSelect.Trigger>
            <VmSelect.Popover>
              <CommissionListBox aria-label="Tipo predeterminado de comisión">
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
          Tasa predeterminada
          <RateField
            fullWidth
            aria-label="Tasa predeterminada de comisión"
            isDisabled={interactionDisabled}
            minValue={0}
            step={0.01}
            value={serviceCommissions.defaultRate}
            onChange={handleRateChange}
          >
            <RateGroup>
              <RateInput />
              <RateUnit>
                {serviceCommissions.defaultType === 'percentage' ? '%' : 'RD$'}
              </RateUnit>
            </RateGroup>
          </RateField>
        </Field>
      </FieldGrid>
    </Wrapper>
  );
};

export default ServiceCommissionSettingsSection;
