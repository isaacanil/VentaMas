import {
  Switch,
  message,
  Select,
  Divider,
} from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { ShoppingOutlined } from '@ant-design/icons';

import { selectUser } from '@/features/auth/userSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';
import SettingCard from './SettingCard';

const { Option } = Select;

const ModalSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ModalSectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
`;

const ModalDescription = styled.p`
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 16px;
  line-height: 1.5;
`;

/**
 * Normalise legacy timing values to the two supported modes.
 * - 'always-ask' | 'manual' | 'full-payment' → 'full-payment' (CxC enabled)
 * - anything else (including 'first-payment') → 'first-payment' (CxC disabled)
 */
const normaliseTiming = (
  raw?: string | null,
): 'first-payment' | 'full-payment' =>
  raw === 'full-payment' || raw === 'always-ask' || raw === 'manual'
    ? 'full-payment'
    : 'first-payment';

const BillingModeConfig = ({ billingSettings }) => {
  const user = useSelector(selectUser);
  const billingMode = billingSettings?.billingMode || 'direct';
  const billingModeOptions = [
    {
      value: 'direct',
      title: 'Venta Directa',
      description: 'Factura inmediata.',
    },
    {
      value: 'deferred',
      title: 'Modo Preventa',
      description: 'Facturacion diferida.',
    },
  ];
  const [localMode, setLocalMode] = useState(billingMode);
  const [allowCxC, setAllowCxC] = useState(
    normaliseTiming(billingSettings?.invoiceGenerationTiming) ===
      'full-payment',
  );

  React.useEffect(() => {
    setLocalMode(billingSettings?.billingMode || 'direct');
    setAllowCxC(
      normaliseTiming(billingSettings?.invoiceGenerationTiming) ===
        'full-payment',
    );
  }, [billingSettings]);

  const saveSettings = (nextMode: string, nextAllowCxC: boolean) => {
    void setBillingSettings(user, {
      billingMode: nextMode,
      invoiceGenerationTiming: nextAllowCxC
        ? 'full-payment'
        : 'first-payment',
    }).then(
      () => {
        message.success('Configuración actualizada correctamente');
      },
      () => {
        message.error('Error al guardar la configuración');
      },
    );
  };

  const handleModeChange = (value: string) => {
    setLocalMode(value);
    saveSettings(value, allowCxC);
  };

  const handleCxCChange = (checked: boolean) => {
    setAllowCxC(checked);
    saveSettings(localMode, checked);
  };

  return (
    <>
      <SettingCard
        icon={<ShoppingOutlined />}
        title="Modo de Operación"
        description="Selecciona cómo procesar tus ventas: facturación inmediata o abonos y preventas."
      >
        <ModalSection>
          <ModalSectionTitle>Tipo de Facturación</ModalSectionTitle>
          <ModalDescription>
            Elige el flujo que mejor se adapte a tu negocio.
          </ModalDescription>

          <Select
            value={localMode}
            onChange={handleModeChange}
            style={{ width: '100%' }}
            size="large"
          >
            {billingModeOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                <div>
                  <div style={{ fontWeight: 600 }}>{option.title}</div>
                  <div style={{ fontSize: '12px', color: '#3d3d3d' }}>
                    {option.description}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
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

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Switch checked={allowCxC} onChange={handleCxCChange} />
                <span style={{ fontWeight: 500 }}>
                  {allowCxC
                    ? 'Habilitada — pago total o CxC'
                    : 'Deshabilitada — factura al primer pago'}
                </span>
              </div>
            </ModalSection>
          </>
        )}
      </SettingCard>
    </>
  );
};

export default BillingModeConfig;
