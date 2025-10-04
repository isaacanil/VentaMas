import { useMemo } from 'react';
import { Modal, Typography, Button } from 'antd';
import { KeyOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Text } = Typography;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px 0;
`;

const Header = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const IconBadge = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 24px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #722ed1 0%, #1677ff 100%);
  color: #fff;
  font-size: 34px;
`;

const Subtitle = styled(Text)`
  color: #8c8c8c !important;
`;

const UserCard = styled.div`
  display: grid;
  gap: 8px;
  padding: 18px 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(114, 46, 209, 0.08) 0%, rgba(22, 119, 255, 0.08) 100%);
  border: 1px solid rgba(114, 46, 209, 0.2);
`;

const UserLabel = styled.span`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #722ed1;
`;

const UserName = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
`;

const Username = styled.span`
  font-size: 14px;
  color: #595959;
`;

const AlertCard = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, #fff1f0 0%, #fff2e8 100%);
  border: 1px solid #ffccc7;
  color: #ad2102;
`;

const AlertIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 85, 0, 0.12);
  color: inherit;
  font-size: 20px;
  flex-shrink: 0;
`;

const AlertContent = styled.div`
  display: grid;
  gap: 4px;
`;

const AlertTitle = styled.span`
  font-size: 15px;
  font-weight: 600;
`;

const AlertDescription = styled.span`
  font-size: 13px;
  line-height: 1.45;
  opacity: 0.85;
`;

const Section = styled.div`
  display: grid;
  gap: 16px;
`;

const SectionTitle = styled(Text)`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8c8c8c !important;
`;

const ModulesGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`;

const ModuleOption = styled.div`
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid #d9d9d9;
  background: #fff;
`;
const ModuleName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
`;

const ModuleDescription = styled.span`
  font-size: 12px;
  color: #595959;
  line-height: 1.4;
`;

const SecurityCard = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  border: 1px solid #91d5ff;
  color: #0050b3;
`;

const SecurityIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 80, 179, 0.12);
  color: inherit;
  font-size: 20px;
  flex-shrink: 0;
`;

const SecurityContent = styled.div`
  display: grid;
  gap: 6px;
`;

const SecurityTitle = styled.span`
  font-size: 15px;
  font-weight: 600;
`;

const SecurityDescription = styled.span`
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.9;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
`;

export const GeneratePinModal = ({
  visible,
  onCancel,
  onConfirm,
  user,
  availableModules,
}) => {
  const defaultModules = useMemo(() => {
    if (!Array.isArray(availableModules) || !availableModules.length) return [];
    if (Array.isArray(user?.pinModules) && user.pinModules.length) {
      return user.pinModules;
    }
    return availableModules.map((module) => module.value);
  }, [availableModules, user]);

  const modulesMap = useMemo(() => {
    if (!Array.isArray(availableModules)) return [];
    const descriptions = {
      invoices: 'Aprueba operaciones vinculadas a la facturación y emisión de comprobantes.',
      accountsReceivable: 'Autoriza gestiones de cobros, créditos y ajustes en cuentas por cobrar.',
    };
    return availableModules.map((module) => ({
      ...module,
      description: descriptions[module.value],
    }));
  }, [availableModules]);

  const activeModules = useMemo(
    () => modulesMap.filter((module) => defaultModules.includes(module.value)),
    [modulesMap, defaultModules],
  );

  const canConfirm = activeModules.length > 0;
  const handleConfirm = () => {
    if (!canConfirm) return;
    const moduleValues = activeModules.map((module) => module.value);
    onConfirm(moduleValues);
  };
  const isRegenerating = Boolean(user?.hasPin);

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={580}
      centered
      destroyOnClose
    >
      <ModalContent>
        <Header>
          <IconBadge>
            <KeyOutlined />
          </IconBadge>
          <Title level={4} style={{ margin: 0 }}>
            {isRegenerating ? 'Regenerar PINs' : 'Generar PINs'}
          </Title>
          <Subtitle>
            Se generará un PIN de 6 dígitos para cada módulo activo.
          </Subtitle>
        </Header>

        <UserCard>
          <UserLabel>Usuario</UserLabel>
          <UserName>{user?.displayName || 'Sin nombre'}</UserName>
        </UserCard>

        <Section>
          <SectionTitle>Módulos disponibles</SectionTitle>
          {activeModules.length ? (
            <ModulesGrid>
              {activeModules.map((module) => (
                <ModuleOption key={module.value}>
                  <ModuleName>{module.label}</ModuleName>
                  {module.description && (
                    <ModuleDescription>{module.description}</ModuleDescription>
                  )}
                </ModuleOption>
              ))}
            </ModulesGrid>
          ) : (
            <Text type="secondary">No hay módulos habilitados.</Text>
          )}
        </Section>

        <ActionBar>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button type="primary" onClick={handleConfirm} disabled={!canConfirm}>
            {isRegenerating ? 'Regenerar PINs' : 'Generar PINs'}
          </Button>
        </ActionBar>
      </ModalContent>
    </Modal>
  );
};

export default GeneratePinModal;
