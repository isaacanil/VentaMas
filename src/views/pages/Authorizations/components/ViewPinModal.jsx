import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, message, Typography, Space } from 'antd';
import { SafetyOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { fbViewUserPins } from '../../../../firebase/authorization/pinAuth';

const { Text, Title } = Typography;

const MODULE_LABELS = {
  invoices: 'Facturación',
  accountsReceivable: 'Cuadre de Caja',
};

const InfoPill = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: center;
  padding: 16px 20px;
  border-radius: 16px;
  background: #f0f5ff;
  border: 1px solid #d6e4ff;
`;

const InfoPillItem = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 160px;
`;

const InfoPillLabel = styled(Text)`
  && {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8c8c8c;
  }

  &&::after {
    content: ':';
    margin-left: 4px;
  }
`;

const InfoPillValue = styled(Text)`
  && {
    font-size: 14px;
    font-weight: 600;
  }
`;

const ModulesGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

const ModuleCard = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 16px;
  background: #fff;
  box-shadow: ${({ $active }) => ($active ? '0 0 0 2px rgba(82, 196, 26, 0.25)' : '0 8px 16px -12px rgba(0, 0, 0, 0.25)')};
  transition: box-shadow 0.3s ease, transform 0.3s ease;

  &:hover {
    box-shadow: 0 12px 20px -12px rgba(0, 0, 0, 0.28);
    transform: translateY(-2px);
  }
`;

const PinDisplay = styled.div`
  margin: 12px 0;
  padding: 12px;
  border-radius: 8px;
  background: #001529;
  color: #fff;
  font-family: 'Roboto Mono', monospace;
  font-size: 20px;
  letter-spacing: 3px;
  text-align: center;
`;

const ModuleMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 12px 0;
`;

const ModuleActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const ViewPinModal = ({ visible, onClose, user, moduleKey, moduleLabel }) => {
  const [loading, setLoading] = useState(false);
  const [pinValue, setPinValue] = useState(null);
  const [isPinVisible, setIsPinVisible] = useState(false);
  const pinVisibilityTimer = useRef(null);
  const resolvedModuleLabel = moduleLabel || MODULE_LABELS[moduleKey] || moduleKey;

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setPinValue(null);
      setIsPinVisible(false);
      if (pinVisibilityTimer.current) {
        clearTimeout(pinVisibilityTimer.current);
        pinVisibilityTimer.current = null;
      }
    }
  }, [visible]);

  const loadPin = useCallback(async () => {
    if (!visible || !user?.uid || !moduleKey) {
      return;
    }

    setLoading(true);
    try {
      const pinSecrets = await fbViewUserPins(user, user.uid);

      if (!pinSecrets?.pins || pinSecrets.pins.length === 0) {
        message.error('No tienes PINs configurados');
        return;
      }

      const modulePinData = pinSecrets.pins.find((p) => p.module === moduleKey);

      if (!modulePinData || !modulePinData.pin) {
        message.error(`No se encontró el PIN para ${resolvedModuleLabel}`);
        return;
      }

      setPinValue(modulePinData.pin);
    } catch (error) {
      console.error('Error obteniendo el PIN:', error);
      message.error(error?.message || 'No se pudo obtener el PIN.');
    } finally {
      setLoading(false);
    }
  }, [moduleKey, resolvedModuleLabel, user, visible]);

  useEffect(() => {
    loadPin();
  }, [loadPin]);

  const handleTogglePinVisibility = () => {
    if (isPinVisible) {
      // Ocultar PIN
      setIsPinVisible(false);
      if (pinVisibilityTimer.current) {
        clearTimeout(pinVisibilityTimer.current);
        pinVisibilityTimer.current = null;
      }
    } else {
      // Mostrar PIN
      setIsPinVisible(true);
  message.success(`Mostrando el PIN de ${resolvedModuleLabel} por 30 segundos`);
      
      // Auto-ocultar después de 30 segundos
      pinVisibilityTimer.current = setTimeout(() => {
        setIsPinVisible(false);
  message.info(`El PIN de ${resolvedModuleLabel} se ocultó por seguridad`);
        pinVisibilityTimer.current = null;
      }, 30000);
    }
  };

  useEffect(() => {
    return () => {
      if (pinVisibilityTimer.current) {
        clearTimeout(pinVisibilityTimer.current);
      }
    };
  }, []);



  const renderView = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <SafetyOutlined style={{ fontSize: 48, color: '#52c41a' }} />
        <Title level={4} style={{ marginTop: 16 }}>
          PIN de {resolvedModuleLabel}
        </Title>
        <Text type="secondary">
          Módulo: {resolvedModuleLabel}
        </Text>
      </div>


      <div>
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
          PIN del Módulo
        </Text>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Haz clic en el botón para revelar tu PIN. Se ocultará automáticamente después de 30 segundos.
        </Text>
        
       
          {isPinVisible && pinValue ? <PinDisplay>{pinValue}</PinDisplay> : null}
      
            <Button
              block
              type={isPinVisible ? 'default' : 'primary'}
              icon={isPinVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              loading={loading}
              disabled={!pinValue}
              onClick={handleTogglePinVisibility}
              size="large"
            >
              {isPinVisible ? 'Ocultar PIN' : 'Mostrar PIN'}
            </Button>
      
      
      </div>
    </Space>
  );

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Cerrar
        </Button>,
      ]}
      width={500}
      centered
      destroyOnClose
      title={null}
    >
      <div style={{ padding: '8px 0' }}>
        {renderView()}
      </div>
    </Modal>
  );
};

export default ViewPinModal;
