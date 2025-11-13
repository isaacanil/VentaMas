import { KeyOutlined } from '@ant-design/icons';
import { Modal, Typography, Button } from 'antd';
import { useMemo } from 'react';
import styled from 'styled-components';

const { Title, Text } = Typography;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px 0;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
`;

const IconBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  margin: 0 auto;
  font-size: 34px;
  color: #fff;
  background: linear-gradient(135deg, #722ed1 0%, #1677ff 100%);
  border-radius: 24px;
`;

const Subtitle = styled(Text)`
  color: #8c8c8c !important;
`;

const UserCard = styled.div`
  display: grid;
  gap: 8px;
  padding: 18px 20px;
  background: linear-gradient(
    135deg,
    rgb(114 46 209 / 8%) 0%,
    rgb(22 119 255 / 8%) 100%
  );
  border: 1px solid rgb(114 46 209 / 20%);
  border-radius: 16px;
`;

const UserLabel = styled.span`
  font-size: 12px;
  color: #722ed1;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const UserName = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
`;

const Section = styled.div`
  display: grid;
  gap: 16px;
`;

const SectionTitle = styled(Text)`
  font-size: 14px;
  color: #8c8c8c !important;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const ModuleOption = styled.div`
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 14px;
`;
const ModuleName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
`;

const ModuleDescription = styled.span`
  font-size: 12px;
  line-height: 1.4;
  color: #595959;
`;

const ActionBar = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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
      invoices:
        'Aprueba operaciones vinculadas a la facturación y emisión de comprobantes.',
      accountsReceivable:
        'Autoriza gestiones de cobros, créditos y ajustes en cuentas por cobrar.',
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
      destroyOnHidden
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
