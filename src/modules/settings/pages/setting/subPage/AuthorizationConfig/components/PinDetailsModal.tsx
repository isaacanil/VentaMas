// @ts-nocheck
import {
  SafetyOutlined,
  CopyOutlined,
  PrinterOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@/constants/icons/antd';
import { Modal, Typography, Button } from 'antd';
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  font-size: 28px;
  color: #fff;
  background: linear-gradient(135deg, #1890ff 0%, #52c41a 100%);
  border-radius: 18px;
`;

const Subtitle = styled(Text)`
  display: block;
  margin-top: 6px;
  color: #8c8c8c !important;
`;

const PinCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 20px 20px 16px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgb(9 30 66 / 8%);
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
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgb(24 144 255 / 8%);
`;

const ModuleHeader = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
`;

const ModuleLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #1f1f1f;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const PinNumber = styled.div`
  padding: 6px 0;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  font-size: 26px;
  font-weight: 700;
  color: #141414;
  text-align: center;
  letter-spacing: 6px;
`;

const PinPlaceholder = styled.div`
  padding: 6px 0;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  font-size: 26px;
  font-weight: 700;
  color: #141414;
  text-align: center;
  letter-spacing: 6px;
  opacity: 0.35;
`;

const ModuleMeta = styled.span`
  display: block;
  font-size: 12px;
  color: #595959;
  text-align: center;
`;

const ModuleActions = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const ModuleButton = styled(Button)`
  && {
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
    color: #262626;
    background: #fff;
    border: 1px solid #d9d9d9;

    &:hover,
    &:focus {
      color: #0050b3;
      background: #e6f7ff;
      border-color: #91d5ff;
    }

    &:disabled {
      color: rgb(0 0 0 / 25%);
      background: #f5f5f5;
      border-color: #d9d9d9;
    }
  }
`;

const PrintButton = styled(Button)`
  && {
    height: 36px;
    padding: 0 16px;
    color: #fff;
    background: #1890ff;
    border: none;

    &:hover,
    &:focus {
      color: #fff;
      background: #40a9ff;
    }
  }
`;

const ActionBar = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 4px;
`;

export const PinDetailsModal = ({ visible, onClose, pinData, user }) => {
  const [visiblePins, setVisiblePins] = useState({});
  const [copiedModules, setCopiedModules] = useState({});

  const moduleNames = useMemo(
    () => ({
      invoices: 'Facturación',
      accountsReceivable: 'Cuadre de Caja',
    }),
    [],
  );

  const pinEntries = useMemo(() => {
    if (!pinData?.pins || !Array.isArray(pinData.pins)) return [];
    return pinData.pins.map((entry) => ({
      module: entry.module,
      moduleName: moduleNames[entry.module] || entry.module,
      pin: entry.pin || '',
      createdAt:
        entry.createdAt instanceof Date
          ? entry.createdAt
          : entry.createdAt
            ? new Date(entry.createdAt)
            : null,
      expiresAt:
        entry.expiresAt instanceof Date
          ? entry.expiresAt
          : entry.expiresAt
            ? new Date(entry.expiresAt)
            : null,
    }));
  }, [pinData, moduleNames]);

  const togglePinVisibility = (moduleKey) => {
    setVisiblePins((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  const handleCopyModule = (moduleKey, pin) => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedModules((prev) => ({ ...prev, [moduleKey]: true }));
    setTimeout(() => {
      setCopiedModules((prev) => ({ ...prev, [moduleKey]: false }));
    }, 2000);
  };

  const handlePrint = () => {
    const moduleRows = pinEntries.length
      ? pinEntries
          .map(
            (entry) => `
            <tr>
              <td class="module-name">
                <div class="module-title">${entry.moduleName}</div>
                <div class="module-meta">${entry.expiresAt ? `Expira: ${entry.expiresAt.toLocaleString()}` : 'Sin expiración definida'}</div>
              </td>
              <td class="pin-code">${entry.pin || '------'}</td>
            </tr>
          `,
          )
          .join('')
      : `
            <tr>
              <td class="module-name">
                <div class="module-title">Sin módulos asignados</div>
                <div class="module-meta">Actualiza la configuración para generar un PIN.</div>
              </td>
              <td class="pin-code">------</td>
            </tr>
          `;

    const pinCount = pinEntries.length;
    const pinCountLabel =
      pinCount === 0
        ? 'Sin PIN registrado'
        : pinCount === 1
          ? '1 PIN activo'
          : `${pinCount} PINs activos`;
    const generatedAt = new Date().toLocaleString();

    const printContent = `
      <html>
        <head>
          <title>PIN de Autorización</title>
          <style>
            :root {
              color-scheme: light;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              font-family: "Helvetica Neue", Arial, sans-serif;
              background: #f5f6f8;
              color: #101828;
            }
            .document {
              max-width: 720px;
              margin: 0 auto;
              padding: 48px;
              background: #ffffff;
              border: 1px solid #e4e7ec;
              border-radius: 16px;
              box-shadow: 0 24px 60px rgba(16, 24, 40, 0.08);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-bottom: 1px solid #e4e7ec;
              padding-bottom: 24px;
              margin-bottom: 32px;
            }
            .brand {
              font-size: 12px;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              color: #475467;
            }
            .headline h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .headline p {
              margin: 6px 0 0;
              font-size: 14px;
              color: #475467;
            }
            .table-intro {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              gap: 16px;
              margin-bottom: 12px;
              font-size: 13px;
              color: #475467;
            }
            .table {
              margin-bottom: 32px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              text-align: left;
              font-size: 11px;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: #475467;
              border-bottom: 1px solid #e4e7ec;
              padding: 12px 0;
            }
            th:last-child {
              text-align: right;
            }
            td {
              padding: 18px 0;
              border-bottom: 1px solid #f2f4f7;
              vertical-align: top;
            }
            .module-title {
              font-size: 15px;
              font-weight: 600;
              color: #101828;
            }
            .module-meta {
              font-size: 13px;
              color: #667085;
              margin-top: 4px;
            }
            .pin-code {
              font-family: "Courier New", monospace;
              font-size: 22px;
              letter-spacing: 0.35em;
              text-align: right;
              color: #1d2939;
              white-space: nowrap;
            }
            .notice {
              background: #fef3f2;
              border: 1px solid #fecdca;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              font-size: 13px;
              color: #b42318;
              line-height: 1.5;
            }
            .footer {
              margin-top: 24px;
              font-size: 11px;
              color: #98a2b3;
              text-align: right;
            }
            @media print {
              body {
                background: #ffffff;
              }
              .document {
                box-shadow: none;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="document">
            <header class="header">
              <div class="brand">VentaMas</div>
              <div class="headline">
                <h1>PIN de Autorización</h1>
                <p>Documento confidencial para uso interno</p>
              </div>
            </header>
            <section class="table">
              <div class="table-intro">
                <span>${user?.displayName || '---'}</span>
                <span>${pinCountLabel}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Módulo</th>
                    <th>PIN</th>
                  </tr>
                </thead>
                <tbody>
                  ${moduleRows}
                </tbody>
              </table>
            </section>
            <div class="notice">
              <strong>⚠️ IMPORTANTE:</strong> Este PIN es confidencial. No lo compartas con nadie. Se invalida automáticamente a las 24 horas o cuando sea revocado.
            </div>
            <div class="footer">
              Generado ${generatedAt}
            </div>
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
      destroyOnHidden
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
                      icon={
                        visiblePins[entry.module] ? (
                          <EyeInvisibleOutlined />
                        ) : (
                          <EyeOutlined />
                        )
                      }
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
                  Expira:{' '}
                  {entry.expiresAt
                    ? entry.expiresAt.toLocaleString()
                    : 'Sin expiración'}
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
