import {
  KeyOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  LockOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Button, message, Alert, Typography, Modal, Tag, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../features/auth/userSlice';
import {
  fbGetUserPinStatus,
  fbGenerateUserPin,
  fbDeactivateUserPin,
} from '../../../../firebase/authorization/pinAuth';
import { useAuthorizationModules } from '../../../../hooks/useAuthorizationModules';
import { GeneratePinModal } from '../../../pages/setting/subPage/AuthorizationConfig/components/GeneratePinModal';
import { PinDetailsModal } from '../../../pages/setting/subPage/AuthorizationConfig/components/PinDetailsModal';

import { PinInfoModal } from './PinInfoModal.jsx';
import { RequestPinModal } from './RequestPinModal';
import { ViewPinModal } from './ViewPinModal.jsx';

const { Title, Text } = Typography;

const AVAILABLE_MODULES = [
  { value: 'invoices', label: 'Facturación' },
  { value: 'accountsReceivable', label: 'Cuadre de Caja' },
];

const MODULE_LABELS = AVAILABLE_MODULES.reduce((acc, module) => {
  acc[module.value] = module.label;
  return acc;
}, {});

const PageContainer = styled.div`
  display: grid;
  gap: 24px;
  max-width: 960px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 8px 0 4px;

  @media (width <= 640px) {
    grid-template-columns: 1fr;
    gap: 12px;
    justify-items: flex-start;
  }
`;

const HeaderIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  font-size: 24px;
  color: #2f54eb;
  background: #f0f5ff;
  border-radius: 16px;
`;

const SummaryCard = styled.div``;

const heroTokens = {
  success: {
    bg: 'linear-gradient(135deg, #d1f5d3 0%, #63d471 100%)',
    text: '#0f5132',
    iconBg: 'rgba(255,255,255,0.25)',
    statBg: 'rgba(255,255,255,0.32)',
  },
  warning: {
    bg: 'linear-gradient(135deg, #ffe7ba 0%, #faad14 100%)',
    text: '#613400',
    iconBg: 'rgba(255,255,255,0.28)',
    statBg: 'rgba(255,255,255,0.35)',
  },
  info: {
    bg: 'linear-gradient(135deg, #bae7ff 0%, #69b1ff 100%)',
    text: '#003a8c',
    iconBg: 'rgba(255,255,255,0.25)',
    statBg: 'rgba(255,255,255,0.32)',
  },
  danger: {
    bg: 'linear-gradient(135deg, #ffccc7 0%, #ff7875 100%)',
    text: '#820014',
    iconBg: 'rgba(255,255,255,0.25)',
    statBg: 'rgba(255,255,255,0.30)',
  },
  muted: {
    bg: 'linear-gradient(135deg, #e6f4ff 0%, #d6e4ff 100%)',
    text: '#1f1f1f',
    iconBg: 'rgba(255,255,255,0.28)',
    statBg: 'rgba(255,255,255,0.34)',
  },
};

const HeroPanel = styled.div`
  position: relative;
  display: grid;
  gap: 18px;
  padding: 10px 16px;
  overflow: hidden;
  color: ${({ $tone }) => heroTokens[$tone]?.text || heroTokens.muted.text};
  background: ${({ $tone }) => heroTokens[$tone]?.bg || heroTokens.muted.bg};
  border-radius: 20px;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 40%);

  & > * {
    position: relative;
    z-index: 1;
  }

  &::after {
    position: absolute;
    inset: 0;
    content: '';
    background: radial-gradient(
      circle at top right,
      rgb(255 255 255 / 100%) 0%,
      rgb(255 255 255 / 0%) 55%
    );
    opacity: 0.12;
  }
`;

const HeroLabel = styled.span`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.75;
`;

const HeroHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-start;
`;

const HeroHeaderLeft = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-width: 250px;
`;

const HeroBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const HeroBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: inherit;
  letter-spacing: 0.02em;
  background: ${({ $tone }) =>
    heroTokens[$tone]?.statBg || 'rgba(255,255,255,0.3)'};
  border-radius: 20px;
  opacity: 0.95;
`;

const DetailsColumn = styled.div`
  display: grid;
  gap: 24px;
  align-content: start;
`;

const ActionsSection = styled.div`
  display: grid;
  gap: 16px;
`;

const ActionsTitle = styled(Text)`
  font-size: 14px;
  color: #8c8c8c !important;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const ActionGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const HelperAlert = styled(Alert)`
  border: none;
  border-radius: 10px;
`;

const ModuleCard = styled.div`
  padding: 16px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  box-shadow: ${({ $active }) =>
    $active
      ? '0 0 0 2px rgba(82, 196, 26, 0.25)'
      : '0 8px 16px -12px rgba(0, 0, 0, 0.25)'};
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;

  &:hover {
    box-shadow: 0 12px 20px -12px rgb(0 0 0 / 28%);
    transform: translateY(-2px);
  }
`;

const ModuleMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
`;

const ModuleActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
`;

/**
 * Vista personal de PIN
 * - Usuarios normales: Solo ven su PIN, solicitan a admin
 * - Dev/Owner: Pueden generar su propio PIN
 */
export const PersonalPinManagement = () => {
  const user = useSelector(selectUser);
  const { enabledModules, authorizationFlowEnabled } =
    useAuthorizationModules();
  const [pinStatus, setPinStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [generatedPin, setGeneratedPin] = useState(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [viewPinModalVisible, setViewPinModalVisible] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  // Dev y Owner pueden generar su propio PIN
  const canSelfGenerate = ['dev', 'owner', 'admin'].includes(user?.role);

  // Filtrar solo módulos activos según configuración
  const activeAvailableModules = authorizationFlowEnabled
    ? AVAILABLE_MODULES.filter(
        (module) => enabledModules[module.value] !== false,
      )
    : [];

  const loadPinStatus = async () => {
    setLoading(true);
    try {
      const status = await fbGetUserPinStatus(user, user.uid);
      setPinStatus(status);
    } catch {
      setPinStatus({
        hasPin: false,
        isActive: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) loadPinStatus();
  }, [user?.uid]);

  const handleGeneratePin = async (modules) => {
    setLoading(true);
    try {
      const result = await fbGenerateUserPin(user, user.uid, modules);
      setGeneratedPin(result);
      message.success('PIN generado exitosamente');
      setGenerateModalVisible(false);
      setDetailsModalVisible(true);
      await loadPinStatus();
    } catch (error) {
      message.error(error?.message || 'Error generando PIN');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivatePin = () => {
    Modal.confirm({
      title: '¿Desactivar PIN?',
      content:
        '¿Está seguro de desactivar el PIN? Deberás regenerarlo para volver a usarlo.',
      okText: 'Desactivar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        setLoading(true);
        try {
          await fbDeactivateUserPin(user, user.uid);
          message.success('PIN desactivado exitosamente');
          await loadPinStatus();
        } catch (error) {
          message.error(error?.message || 'Error desactivando PIN');
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const getStatusDisplay = () => {
    if (!pinStatus?.hasPin) {
      return {
        icon: <LockOutlined />,
        title: 'Sin PIN configurado',
        description: canSelfGenerate
          ? 'Aún no tienes PINs activos. Genera uno para autorizar operaciones de forma rápida.'
          : 'Solicita a un administrador que genere PINs para poder autorizar operaciones.',
        tone: 'info',
      };
    }
    if (pinStatus.isExpired) {
      return {
        icon: <ClockCircleOutlined />,
        title: 'PIN expirado',
        description: canSelfGenerate
          ? 'El PIN venció. Genera uno nuevo para seguir autorizando operaciones.'
          : 'El PIN venció. Solicita a un administrador que lo regenere para continuar.',
        tone: 'warning',
      };
    }
    if (pinStatus.isActive) {
      return {
        icon: <SafetyOutlined />,
        title: 'PIN activo',
        description:
          'Los PINs están listos para usarse en los módulos habilitados.',
        tone: 'success',
      };
    }
    return {
      icon: <LockOutlined />,
      title: 'PIN inactivo',
      description: canSelfGenerate
        ? 'El PIN está inactivo. Puedes generarlo de nuevo cuando lo necesites.'
        : 'El PIN está inactivo. Solicita apoyo al administrador para reactivarlo.',
      tone: 'danger',
    };
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return '-';
    }
  };

  const statusDisplay = getStatusDisplay();

  // Preparar badges para el header
  const heroBadges = [];

  if (Array.isArray(pinStatus?.modules) && pinStatus.modules.length > 0) {
    const activeCount = Array.isArray(pinStatus.activeModules)
      ? pinStatus.activeModules.length
      : 0;
    heroBadges.push({
      key: 'modulesCount',
      label: `Módulos activos: ${activeCount}/${pinStatus.modules.length}`,
      tone: activeCount > 0 ? 'success' : 'warning',
    });
  }

  // Preparar lista de módulos - solo mostrar módulos que están activos en configuración Y tienen PIN activo
  const modulesList =
    authorizationFlowEnabled && pinStatus?.moduleDetails
      ? Object.entries(pinStatus.moduleDetails)
          .filter(([moduleKey, detail]) => {
            // Filtrar solo módulos activos en configuración Y con PIN activo
            return (
              enabledModules[moduleKey] !== false && detail?.isActive === true
            );
          })
          .map(([moduleKey, detail]) => {
            const expiresDisplay = detail?.expiresAt
              ? formatDateTime(detail.expiresAt)
              : 'Sin expiración';
            return {
              module: moduleKey,
              label: MODULE_LABELS[moduleKey] || moduleKey,
              status: 'Activo',
              tone: 'success',
              expiresDisplay,
            };
          })
      : [];

  return (
    <Spin
      spinning={loading}
      size="large"
      tip="Procesando..."
      delay={250}
      style={{ width: '100%' }}
    >
      <PageContainer>
        <PageHeader>
          <HeaderIcon>
            <KeyOutlined />
          </HeaderIcon>
          <Title level={3} style={{ marginBottom: 0 }}>
            Mis PINs de Autorización
          </Title>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              icon={<SafetyOutlined />}
              onClick={() => setInfoModalVisible(true)}
            >
              Más información
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadPinStatus}
              loading={loading}
            >
              Actualizar estado
            </Button>
          </div>
        </PageHeader>

        <SummaryCard bordered={false}>
          <HeroPanel $tone={statusDisplay.tone}>
            <HeroHeader>
              <HeroHeaderLeft>
                {/* <HeroTitle level={4}>{statusTitle}</HeroTitle> */}
                <HeroBadges>
                  {heroBadges.map(({ key, label, tone }) => (
                    <HeroBadge key={key} $tone={tone}>
                      {label}
                    </HeroBadge>
                  ))}
                </HeroBadges>

                {modulesList.length === 0 &&
                  activeAvailableModules.length === 0 && (
                    <HeroLabel style={{ opacity: 0.6 }}>
                      No hay módulos activos en el sistema
                    </HeroLabel>
                  )}
                {modulesList.length === 0 &&
                  activeAvailableModules.length > 0 && (
                    <HeroLabel style={{ opacity: 0.6 }}>
                      Sin módulos habilitados
                    </HeroLabel>
                  )}
              </HeroHeaderLeft>
            </HeroHeader>
          </HeroPanel>

          <DetailsColumn style={{ marginTop: '24px' }}>
            <ActionsSection>
              <ActionsTitle strong>Acciones rápidas</ActionsTitle>
              <ActionGroup>
                {canSelfGenerate ? (
                  <>
                    <Button
                      type="primary"
                      icon={<KeyOutlined />}
                      onClick={() => setGenerateModalVisible(true)}
                      loading={loading}
                      disabled={
                        !authorizationFlowEnabled ||
                        activeAvailableModules.length === 0
                      }
                    >
                      {pinStatus?.hasPin ? 'Regenerar PIN' : 'Generar PIN'}
                    </Button>
                    {pinStatus?.hasPin && pinStatus?.isActive && (
                      <Button
                        danger
                        icon={<LockOutlined />}
                        onClick={handleDeactivatePin}
                        loading={loading}
                      >
                        Desactivar PIN
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    type="primary"
                    icon={<KeyOutlined />}
                    onClick={() => setRequestModalVisible(true)}
                    disabled={
                      !authorizationFlowEnabled ||
                      activeAvailableModules.length === 0
                    }
                  >
                    {pinStatus?.hasPin
                      ? 'Solicitar regeneración'
                      : 'Solicitar PIN'}
                  </Button>
                )}
              </ActionGroup>

              {activeAvailableModules.length === 0 &&
                authorizationFlowEnabled && (
                  <HelperAlert
                    showIcon
                    type="warning"
                    message="Sin Módulos Activos"
                    description="No puedes generar PINs porque no hay módulos de autorización activos. Un administrador debe activar al menos un módulo desde Configuración."
                  />
                )}

              {activeAvailableModules.length > 0 && !pinStatus?.hasPin && (
                <HelperAlert
                  showIcon
                  type="info"
                  message="No tienes PINs configurados"
                  description={
                    canSelfGenerate
                      ? 'Genera PINs para autorizar operaciones sin depender de otro usuario.'
                      : 'Envía una solicitud a tu administrador para que configure los PINs.'
                  }
                />
              )}

              {activeAvailableModules.length > 0 &&
                pinStatus?.hasPin &&
                (pinStatus.isExpired || !pinStatus.isActive) && (
                  <HelperAlert
                    showIcon
                    type="warning"
                    message={
                      pinStatus.isExpired
                        ? 'El PIN ha expirado'
                        : 'El PIN está inactivo'
                    }
                    description={
                      canSelfGenerate
                        ? 'Genera un nuevo PIN para volver a autorizar operaciones.'
                        : 'Solicita una regeneración para habilitarlo nuevamente.'
                    }
                  />
                )}
            </ActionsSection>

            {modulesList.length > 0 && (
              <div>
                <ActionsTitle
                  strong
                  style={{ marginBottom: 16, display: 'block' }}
                >
                  Mis módulos con PIN
                </ActionsTitle>
                <ModulesGrid>
                  {modulesList.map((item) => {
                    return (
                      <ModuleCard key={item.module} $active={true}>
                        <ModuleMeta>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text strong style={{ fontSize: 16 }}>
                              {item.label}
                            </Text>
                            <Tag color="green">Activo</Tag>
                          </div>
                          <Text type="secondary">Acceso: Habilitado</Text>
                          <Text type="secondary">
                            Expira: {item.expiresDisplay}
                          </Text>
                        </ModuleMeta>
                        <ModuleActions>
                          <Button
                            block
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => {
                              setSelectedModule({
                                key: item.module,
                                label: item.label,
                              });
                              setViewPinModalVisible(true);
                            }}
                          >
                            Ver PIN
                          </Button>
                        </ModuleActions>
                      </ModuleCard>
                    );
                  })}
                </ModulesGrid>
              </div>
            )}
          </DetailsColumn>
        </SummaryCard>

        <PinInfoModal
          visible={infoModalVisible}
          onClose={() => setInfoModalVisible(false)}
          canSelfGenerate={canSelfGenerate}
        />

        <RequestPinModal
          visible={requestModalVisible}
          onClose={() => setRequestModalVisible(false)}
          hasCurrentPin={pinStatus?.hasPin || false}
        />

        <GeneratePinModal
          visible={generateModalVisible}
          onCancel={() => setGenerateModalVisible(false)}
          onConfirm={handleGeneratePin}
          user={{
            id: user?.uid,
            name: user?.name,
            displayName: user?.displayName || user?.name,
            hasPin: pinStatus?.hasPin,
            pinModules: pinStatus?.modules || [],
          }}
          availableModules={activeAvailableModules}
        />

        <PinDetailsModal
          visible={detailsModalVisible}
          onClose={() => {
            setDetailsModalVisible(false);
            setGeneratedPin(null);
          }}
          pinData={generatedPin}
          user={{
            id: user?.uid,
            name: user?.name,
            displayName: user?.displayName || user?.name,
          }}
        />

        {selectedModule && (
          <ViewPinModal
            visible={viewPinModalVisible}
            onClose={() => {
              setViewPinModalVisible(false);
              setSelectedModule(null);
            }}
            user={user}
            moduleKey={selectedModule.key}
            moduleLabel={selectedModule.label}
          />
        )}
      </PageContainer>
    </Spin>
  );
};

export default PersonalPinManagement;
