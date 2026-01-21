import { Switch, message, Modal, Button, Select, Space, Typography, Divider } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { ShoppingOutlined, SettingOutlined, RocketOutlined, AuditOutlined } from '@ant-design/icons';

import { selectUser } from '@/features/auth/userSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';
import SettingCard from './SettingCard';

const { Text, Title, Paragraph } = Typography;
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

const StatusPill = styled.div<{ $type: 'direct' | 'deferred' }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ $type }) => ($type === 'deferred' ? '#fff7e6' : '#f6ffed')};
  color: ${({ $type }) => ($type === 'deferred' ? '#faad14' : '#52c41a')};
  border: 1px solid ${({ $type }) => ($type === 'deferred' ? '#ffd591' : '#b7eb8f')};
`;

const BillingModeConfig = ({ billingSettings }) => {
  const user = useSelector(selectUser);
  const billingMode = billingSettings?.billingMode || 'direct';
  const isPresaleMode = billingMode === 'deferred';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localMode, setLocalMode] = useState(billingMode);
  const [invoiceTiming, setInvoiceTiming] = useState(billingSettings?.invoiceGenerationTiming || 'always-ask');

  React.useEffect(() => {
    setLocalMode(billingSettings?.billingMode || 'direct');
    if (billingSettings?.invoiceGenerationTiming) {
      setInvoiceTiming(billingSettings.invoiceGenerationTiming);
    }
  }, [billingSettings]);

  const handleSaveSettings = async () => {
    try {
      await setBillingSettings(user, {
        billingMode: localMode,
        invoiceGenerationTiming: invoiceTiming
      });
      message.success('Configuración actualizada correctamente');
      setIsModalOpen(false);
    } catch {
      message.error('Error al guardar la configuración');
    }
  };

  const timingOptions = [
    { value: 'always-ask', label: 'Siempre preguntar', description: 'Confirmación manual en cada venta.' },
    { value: 'first-payment', label: 'Con el primer Pago', description: 'Factura generada automáticamente al recibir abonos.' },
    { value: 'full-payment', label: 'Al finalizar (pago total)', description: 'Factura generada solo al completar el saldo.' },
    { value: 'manual', label: 'Nunca (Manual)', description: 'Debes generar la factura manualmente desde órdenes.' },
  ];

  const timingLabels = {
    'first-payment': 'Primer Pago',
    'full-payment': 'Pago Total',
    'always-ask': 'Preguntar Siempre',
    'manual': 'Manual'
  };

  const summary = [
    {
      label: 'Modo Actual',
      value: <StatusPill $type={billingMode}>{isPresaleMode ? 'Preventa' : 'Venta Directa'}</StatusPill>
    },
    {
      label: 'Generación de Factura',
      value: isPresaleMode ? timingLabels[invoiceTiming] : 'Inmediata'
    },
  ];

  return (
    <>
      <SettingCard
        icon={<ShoppingOutlined />}
        title="Modo de Operación"
        description="Selecciona cómo procesar tus ventas: facturación inmediata o abonos y preventas."
        onConfigClick={() => setIsModalOpen(true)}
        summary={summary}
      />

      <Modal
        title={
          <span>
            <SettingOutlined style={{ marginRight: 8 }} />
            Configuración de Operación
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        style={{ top: 10 }}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveSettings}>
            Guardar Cambios
          </Button>,
        ]}
        width={550}
      >
        <ModalSection>
          <ModalSectionTitle>Tipo de Facturación</ModalSectionTitle>
          <ModalDescription>
            Elige el flujo de trabajo que mejor se adapte a tu negocio.
          </ModalDescription>

          <Select
            value={localMode}
            onChange={setLocalMode}
            style={{ width: '100%' }}
            size="large"
          >
            <Option value="direct">
              <div>
                <div style={{ fontWeight: 600 }}>Venta Directa</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Las ventas se facturan y completan de inmediato.</div>
              </div>
            </Option>
            <Option value="deferred">
              <div>
                <div style={{ fontWeight: 600 }}>Modo Preventa</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Registra órdenes preliminares, maneja abonos y facturación diferida.</div>
              </div>
            </Option>
          </Select>
        </ModalSection>

        {localMode === 'deferred' && (
          <>
            <Divider />
            <ModalSection>
              <ModalSectionTitle>Conversión a Factura (Preventa)</ModalSectionTitle>
              <ModalDescription>
                Define cuándo se debe emitir el comprobante fiscal.
              </ModalDescription>

              <Select
                value={invoiceTiming}
                onChange={setInvoiceTiming}
                style={{ width: '100%' }}
                size="large"
              >
                {timingOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{opt.description}</div>
                    </div>
                  </Option>
                ))}
              </Select>
            </ModalSection>
          </>
        )}
      </Modal>
    </>
  );
};

export default BillingModeConfig;
