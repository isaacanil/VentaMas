import { Modal, Typography, Button } from 'antd';
import { SafetyOutlined, CopyOutlined, PrinterOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

const { Title, Text } = Typography;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 0 4px;
`;

const Header = styled.div`
  text-align: center;
`;

const IconBadge = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 24px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #52c41a 0%, #13c2c2 100%);
  color: #fff;
  font-size: 32px;
`;

const Subtitle = styled(Text)`
  color: #8c8c8c !important;
  display: block;
  margin-top: 8px;
`;

const PinCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #141e30 0%, #243b55 100%);
  border-radius: 20px;
  padding: 32px 24px;
  position: relative;
  overflow: hidden;
  color: #fff;
  box-shadow: 0 12px 32px rgba(20, 30, 48, 0.25);

  &::after {
    content: '';
    position: absolute;
    top: -40%;
    right: -30%;
    width: 260px;
    height: 260px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    filter: blur(0);
  }
`;

const PinLabel = styled(Text)`
  font-size: 13px;
  letter-spacing: 3px;
  text-transform: uppercase;
  opacity: 0.7;
  color: #fff !important;
  z-index: 1;
`;

const ModulePins = styled.div`
  display: grid;
  gap: 18px;
  width: 100%;
  z-index: 1;
`;

const ModulePinRow = styled.div`
  display: grid;
  justify-items: center;
  gap: 8px;
`;

const ModuleLabel = styled.span`
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.75;
`;

const PinNumber = styled.div`
  font-size: 46px;
  font-weight: 700;
  letter-spacing: 8px;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  text-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
`;

const ModuleMeta = styled.span`
  font-size: 12px;
  opacity: 0.75;
`;

const PinHint = styled.span`
  font-size: 13px;
  opacity: 0.8;
  z-index: 1;
`;

const PinActions = styled.div`
  display: flex;
  gap: 12px;
  z-index: 1;
`;

const CopyButton = styled(Button)`
  && {
    background: rgba(255, 255, 255, 0.18);
    border: none;
    color: #fff;
    padding: 0 18px;

    &:hover,
    &:focus {
      background: rgba(255, 255, 255, 0.28);
      color: #fff;
    }
  }
`;

const PrintButton = styled(Button)`
  && {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    padding: 0 18px;

    &:hover,
    &:focus {
      background: rgba(255, 255, 255, 0.18);
      border-color: transparent;
      color: #fff;
    }
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #434343 !important;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  background: #fafafa;
  border-radius: 16px;
  padding: 20px 24px;
  border: 1px solid #f0f0f0;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #8c8c8c;
`;

const InfoValue = styled.span`
  font-size: 16px;
  color: #262626;
  font-weight: 500;
`;

const ModulesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ModulePill = styled.span`
  padding: 6px 12px;
  border-radius: 999px;
  background: #e6f7ff;
  color: #096dd9;
  font-size: 13px;
  font-weight: 500;
`;

const NoteCard = styled.div`
  background: linear-gradient(120deg, #fff7e6 0%, #ffe7ba 100%);
  border-radius: 16px;
  padding: 20px 24px;
  border: 1px solid #ffd591;
  color: #ad6800;
`;

const NoteList = styled.ul`
  margin: 12px 0 0;
  padding-left: 18px;
  color: inherit;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

export const PinDetailsModal = ({ visible, onClose, pinData, user }) => {
  const [copied, setCopied] = useState(false);

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

  const hasPin = pinEntries.some((entry) => entry.pin);

  const handleCopy = () => {
    if (!hasPin) return;
    const clipboardText = pinEntries
      .filter((entry) => entry.pin)
      .map((entry) => `${entry.moduleName}: ${entry.pin}`)
      .join('\n');
    if (!clipboardText) return;
    navigator.clipboard.writeText(clipboardText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const modulesContent = useMemo(() => {
    if (!pinEntries.length) {
      return <InfoValue>-</InfoValue>;
    }

    return (
      <ModulesList>
        {pinEntries.map((entry) => (
          <ModulePill key={entry.module}>{entry.moduleName}</ModulePill>
        ))}
      </ModulesList>
    );
  }, [pinEntries]);

  const createdAtDisplay = useMemo(() => {
    if (pinData?.metadata?.generatedAt instanceof Date) {
      return pinData.metadata.generatedAt.toLocaleString();
    }
    const firstWithTimestamp = pinEntries.find((entry) => entry.createdAt);
    return firstWithTimestamp?.createdAt ? firstWithTimestamp.createdAt.toLocaleString() : new Date().toLocaleString();
  }, [pinData?.metadata?.generatedAt, pinEntries]);

  const expiresAtDisplay = useMemo(() => {
    if (pinData?.metadata?.expiresAt instanceof Date) {
      return pinData.metadata.expiresAt.toLocaleString();
    }
    const activeExpires = pinEntries
      .map((entry) => entry.expiresAt)
      .filter(Boolean)
      .sort((a, b) => a.getTime() - b.getTime());
    return activeExpires.length ? activeExpires[0].toLocaleString() : '-';
  }, [pinData?.metadata?.expiresAt, pinEntries]);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={640}
      centered
      destroyOnClose
    >
      <ModalBody>
        <Header>
          <IconBadge>
            <SafetyOutlined />
          </IconBadge>
          <Title level={3}>PIN generado exitosamente</Title>
          <Subtitle>Guárdalo en un lugar seguro. Sólo se mostrará esta vez.</Subtitle>
        </Header>

        <PinCard>
          <PinLabel>PIN de autorización</PinLabel>
          <ModulePins>
            {pinEntries.map((entry) => (
              <ModulePinRow key={entry.module}>
                <ModuleLabel>{entry.moduleName}</ModuleLabel>
                <PinNumber>{entry.pin || '------'}</PinNumber>
                <ModuleMeta>
                  Expira: {entry.expiresAt ? entry.expiresAt.toLocaleString() : 'Sin expiración'}
                </ModuleMeta>
              </ModulePinRow>
            ))}
          </ModulePins>
          <PinActions>
            <CopyButton icon={<CopyOutlined />} onClick={handleCopy} disabled={!hasPin}>
              {copied ? 'Copiado' : 'Copiar PIN'}
            </CopyButton>
            <PrintButton icon={<PrinterOutlined />} onClick={handlePrint}>
              Imprimir
            </PrintButton>
          </PinActions>
          <PinHint>Nadie más verá este código. Compártelo sólo con personas autorizadas.</PinHint>
        </PinCard>

        <Section>
          <SectionTitle>Detalles de la autorización</SectionTitle>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>Usuario</InfoLabel>
              <InfoValue>{user?.displayName || '-'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Nombre de usuario</InfoLabel>
              <InfoValue>{user?.name || '-'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Módulos habilitados</InfoLabel>
              {modulesContent}
            </InfoItem>
            <InfoItem>
              <InfoLabel>Creado</InfoLabel>
              <InfoValue>{createdAtDisplay}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Expira</InfoLabel>
              <InfoValue>{expiresAtDisplay}</InfoValue>
            </InfoItem>
          </InfoGrid>
        </Section>

        <NoteCard>
          <strong>Buenas prácticas</strong>
          <NoteList>
            <li>Ingresa tu usuario y este PIN cuando se solicite autorización adicional.</li>
            <li>El PIN sólo funciona en los módulos seleccionados para esta solicitud.</li>
            <li>Caduca automáticamente al llegar la fecha de expiración indicada.</li>
            <li>No compartas este código por chats o correos inseguros.</li>
          </NoteList>
        </NoteCard>

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
