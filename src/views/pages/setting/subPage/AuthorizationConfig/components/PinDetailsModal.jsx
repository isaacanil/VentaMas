import { Modal, Typography, Button } from 'antd';
import { SafetyOutlined, CopyOutlined, PrinterOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

const { Title, Text } = Typography;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 0 0;
`;

const Header = styled.div`
  text-align: center;
`;

const IconBadge = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 18px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1890ff 0%, #52c41a 100%);
  color: #fff;
  font-size: 28px;
`;

const Subtitle = styled(Text)`
  color: #8c8c8c !important;
  display: block;
  margin-top: 6px;
`;

const PinCard = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fff;
  border-radius: 18px;
  padding: 20px 20px 16px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 8px 24px rgba(9, 30, 66, 0.08);
`;

const ModulePins = styled.div`
  display: grid;
  gap: 12px;
  width: 100%;
`;

const ModulePinRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  box-shadow: inset 0 0 0 1px rgba(24, 144, 255, 0.08);
`;

const ModuleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const ModuleLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1f1f1f;
`;

const PinNumber = styled.div`
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 6px;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  text-align: center;
  padding: 6px 0;
  color: #141414;
`;

const PinPlaceholder = styled.div`
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 6px;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  text-align: center;
  padding: 6px 0;
  opacity: 0.35;
  color: #141414;
`;

const ModuleMeta = styled.span`
  font-size: 12px;
  color: #595959;
  text-align: center;
  display: block;
`;

const ModuleActions = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const ModuleButton = styled(Button)`
  && {
    background: #fff;
    border: 1px solid #d9d9d9;
    color: #262626;
    font-size: 12px;
    height: 30px;
    padding: 0 12px;

    &:hover,
    &:focus {
      background: #e6f7ff;
      border-color: #91d5ff;
      color: #0050b3;
    }

    &:disabled {
      background: #f5f5f5;
      border-color: #d9d9d9;
      color: rgba(0, 0, 0, 0.25);
    }
  }
`;

const PrintButton = styled(Button)`
  && {
    background: #1890ff;
    border: none;
    color: #fff;
    padding: 0 16px;
    height: 36px;

    &:hover,
    &:focus {
      background: #40a9ff;
      color: #fff;
    }
  }
`;


const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
`;

export const PinDetailsModal = ({ visible, onClose, pinData, user }) => {
  const [visiblePins, setVisiblePins] = useState({});
  const [copiedModules, setCopiedModules] = useState({});

  const moduleNames = useMemo(() => ({
    invoices: 'Facturación',
    accountsReceivable: 'Cuadre de Caja',
  }), []);

  const pinEntries = useMemo(() => {
    if (!pinData?.pins || !Array.isArray(pinData.pins)) return [];
    return pinData.pins.map((entry) => ({
      module: entry.module,
      moduleName: moduleNames[entry.module] || entry.module,
      pin: entry.pin || '',
      createdAt: entry.createdAt instanceof Date ? entry.createdAt : entry.createdAt ? new Date(entry.createdAt) : null,
      expiresAt: entry.expiresAt instanceof Date ? entry.expiresAt : entry.expiresAt ? new Date(entry.expiresAt) : null,
    }));
  }, [pinData?.pins, moduleNames]);

  const togglePinVisibility = (moduleKey) => {
    setVisiblePins(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  const handleCopyModule = (moduleKey, pin) => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedModules(prev => ({ ...prev, [moduleKey]: true }));
    setTimeout(() => {
      setCopiedModules(prev => ({ ...prev, [moduleKey]: false }));
    }, 2000);
  };

  const handlePrint = () => {
    const pinRows = pinEntries.length
      ? pinEntries
          .map((entry) => `
            <div class="pin-module">
              <div class="pin-label">${entry.moduleName}</div>
              <div class="pin">${entry.pin || ''}</div>
              <div class="pin-meta">Expira: ${entry.expiresAt ? entry.expiresAt.toLocaleString() : 'Sin expiración'}</div>
            </div>
          `)
          .join('')
      : '<div class="pin">------</div>';

    const printContent = `
      <html>
        <head>
          <title>PIN de Autorización</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              text-align: center;
            }
            .header {
              margin-bottom: 40px;
            }
            .pin-box {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              border-radius: 12px;
              margin: 20px auto;
              max-width: 400px;
            }
            .pin-module {
              display: grid;
              gap: 12px;
              justify-items: center;
            }
            .pin-label {
              font-size: 14px;
              letter-spacing: 3px;
              text-transform: uppercase;
              opacity: 0.8;
            }
            .pin {
              font-size: 56px;
              font-weight: bold;
              letter-spacing: 10px;
              font-family: 'Courier New', monospace;
            }
            .pin-meta {
              font-size: 14px;
              opacity: 0.75;
            }
            .info {
              margin-top: 40px;
              text-align: left;
              max-width: 400px;
              margin-left: auto;
              margin-right: auto;
            }
            .info-row {
              margin: 10px 0;
              padding: 10px;
              border-bottom: 1px solid #eee;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 4px;
              padding: 16px;
              margin-top: 40px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PIN de Autorización</h1>
          </div>
          <div class="pin-box">
            ${pinRows}
          </div>
          <div class="info">
            <div class="info-row">
              <span class="label">Usuario:</span> ${user?.displayName || ''}
            </div>
            <div class="info-row">
              <span class="label">Módulos:</span> ${pinEntries.map((entry) => entry.moduleName).join(', ')}
            </div>
            <div class="info-row">
              <span class="label">Expiración general:</span> ${pinEntries.some((entry) => entry.expiresAt) ? pinEntries
                .filter((entry) => entry.expiresAt)
                .map((entry) => `${entry.moduleName}: ${entry.expiresAt.toLocaleString()}`)
                .join('<br/>') : 'Sin expiración definida'}
            </div>
          </div>
          <div class="warning">
            <strong>⚠️ IMPORTANTE:</strong><br/>
            Este PIN es confidencial. No lo compartas con nadie.<br/>
            Expira automáticamente en 24 horas.
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      destroyOnClose
    >
      <ModalBody>
        <Header>
          <IconBadge>
            <SafetyOutlined />
          </IconBadge>
          <Title level={3}>PINs generados exitosamente</Title>
          <Subtitle>Guárdalos en un lugar seguro.</Subtitle>
        </Header>

        <PinCard>
          <ModulePins>
            {pinEntries.map((entry) => (
              <ModulePinRow key={entry.module}>
                <ModuleHeader>
                  <ModuleLabel>{entry.moduleName}</ModuleLabel>
                  <ModuleActions>
                    <ModuleButton 
                      icon={visiblePins[entry.module] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      onClick={() => togglePinVisibility(entry.module)}
                      size="small"
                    >
                      {visiblePins[entry.module] ? 'Ocultar' : 'Ver PIN'}
                    </ModuleButton>
                    <ModuleButton 
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyModule(entry.module, entry.pin)}
                      disabled={!entry.pin}
                      size="small"
                    >
                      {copiedModules[entry.module] ? 'Copiado' : 'Copiar'}
                    </ModuleButton>
                  </ModuleActions>
                </ModuleHeader>
                {visiblePins[entry.module] ? (
                  <PinNumber>{entry.pin || '------'}</PinNumber>
                ) : (
                  <PinPlaceholder>••••••</PinPlaceholder>
                )}
                <ModuleMeta>
                  Expira: {entry.expiresAt ? entry.expiresAt.toLocaleString() : 'Sin expiración'}
                </ModuleMeta>
              </ModulePinRow>
            ))}
          </ModulePins>
          <PrintButton icon={<PrinterOutlined />} onClick={handlePrint} block>
            Imprimir Todos
          </PrintButton>
        </PinCard>

        <ActionBar>
          <Button onClick={onClose}>Cerrar</Button>
          <Button type="primary" onClick={onClose}>
            Entendido
          </Button>
        </ActionBar>
      </ModalBody>
    </Modal>
  );
};

export default PinDetailsModal;
