import { ShoppingOutlined } from '@ant-design/icons';
import { Divider, Select, Switch, message } from 'antd';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';

import {
  BILLING_MODE_OPTIONS,
  normalizeTiming,
  type BillingMode,
  type BillingSettings,
} from './BillingModeConfig.helpers';
import {
  FULL_WIDTH_SELECT_STYLE,
  FullWidthSelectWrapper,
  ModalDescription,
  ModalSection,
  ModalSectionTitle,
  SelectOptionDescription,
  SelectOptionTitle,
  SwitchLabel,
  SwitchRow,
} from './BillingModeConfig.styles';
import SettingCard from './SettingCard';

const { Option } = Select;

interface BillingModeConfigProps {
  billingSettings?: BillingSettings;
}

const BillingModeConfig = ({ billingSettings }: BillingModeConfigProps) => {
  const user = useSelector(selectUser);
  const billingMode = (billingSettings?.billingMode || 'direct') as BillingMode;
  const [localMode, setLocalMode] = useState<BillingMode>(billingMode);
  const [allowCxC, setAllowCxC] = useState(
    normalizeTiming(billingSettings?.invoiceGenerationTiming) ===
      'full-payment',
  );

  useEffect(() => {
    setLocalMode((billingSettings?.billingMode || 'direct') as BillingMode);
    setAllowCxC(
      normalizeTiming(billingSettings?.invoiceGenerationTiming) ===
        'full-payment',
    );
  }, [billingSettings]);

  const saveSettings = (nextMode: BillingMode, nextAllowCxC: boolean) => {
    void setBillingSettings(user, {
      billingMode: nextMode,
      invoiceGenerationTiming: nextAllowCxC ? 'full-payment' : 'first-payment',
    }).then(
      () => {
        message.success('Configuracion actualizada correctamente');
      },
      () => {
        message.error('Error al guardar la configuracion');
      },
    );
  };

  const handleModeChange = (value: BillingMode) => {
    setLocalMode(value);
    saveSettings(value, allowCxC);
  };

  const handleCxCChange = (checked: boolean) => {
    setAllowCxC(checked);
    saveSettings(localMode, checked);
  };

  return (
    <SettingCard
      icon={<ShoppingOutlined />}
      title="Modo de Operacion"
      description="Selecciona como procesar tus ventas: facturacion inmediata o abonos y preventas."
    >
      <ModalSection>
        <ModalSectionTitle>Tipo de Facturacion</ModalSectionTitle>
        <ModalDescription>
          Elige el flujo que mejor se adapte a tu negocio.
        </ModalDescription>

        <FullWidthSelectWrapper>
          <Select
            value={localMode}
            onChange={handleModeChange}
            size="large"
            style={FULL_WIDTH_SELECT_STYLE}
          >
            {BILLING_MODE_OPTIONS.map((option) => (
              <Option key={option.value} value={option.value}>
                <div>
                  <SelectOptionTitle>{option.title}</SelectOptionTitle>
                  <SelectOptionDescription>
                    {option.description}
                  </SelectOptionDescription>
                </div>
              </Option>
            ))}
          </Select>
        </FullWidthSelectWrapper>
      </ModalSection>

      {localMode === 'deferred' && (
        <>
          <Divider />
          <ModalSection>
            <ModalSectionTitle>
              Cuentas por Cobrar en Preventas
            </ModalSectionTitle>
            <ModalDescription>
              Habilita abonos parciales y cuentas por cobrar. Si se desactiva,
              se factura con el primer pago.
            </ModalDescription>

            <SwitchRow>
              <Switch checked={allowCxC} onChange={handleCxCChange} />
              <SwitchLabel>
                {allowCxC
                  ? 'Habilitada - pago total o CxC'
                  : 'Deshabilitada - factura al primer pago'}
              </SwitchLabel>
            </SwitchRow>
          </ModalSection>
        </>
      )}
    </SettingCard>
  );
};

export default BillingModeConfig;
