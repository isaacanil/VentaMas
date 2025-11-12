import { message, Checkbox } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '../../../../../features/auth/userSlice';
import { SelectSettingCart } from '../../../../../features/cart/cartSlice';
import { setBillingSettings } from '../../../../../firebase/billing/billingSetting';
import { ROUTES } from '../../../../../routes/routesName';

const AVAILABLE_MODULES = [
  { key: 'invoices', label: 'Facturación', description: 'Requiere autorización para editar facturas y aplicar descuentos' },
  { key: 'accountsReceivable', label: 'Cuadre de Caja', description: 'Requiere autorización para apertura y cierre de caja' },
];

const AuthorizationFlowSettingsSection = ({ sectionId = 'authorization-flow-overview' }) => {
  const user = useSelector(selectUser);
  const settings = useSelector(SelectSettingCart) || {};
  const authorizationFlowEnabled = !!settings?.billing?.authorizationFlowEnabled;

  const rawEnabledModules = settings?.billing?.enabledAuthorizationModules || {};
  const enabledModules = {
    invoices: rawEnabledModules.invoices ?? true,
    accountsReceivable: rawEnabledModules.accountsReceivable ?? rawEnabledModules.cashRegister ?? true,
  };
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const handleToggle = async (nextValue) => {
    if (!user?.businessID) {
      messageApi.error('No se pudo actualizar la configuración de autorizaciones.');
      return;
    }

    setIsUpdating(true);
    try {
      // Si se desactiva, no importa los módulos
      // Si se activa, verificar que al menos un módulo esté activo
      if (nextValue) {
        const hasActiveModule = Object.values(enabledModules).some(v => v === true);
        if (!hasActiveModule) {
          messageApi.warning('Debes activar al menos un módulo de autorización.');
          setIsUpdating(false);
          return;
        }
      }
      
      await setBillingSettings(user, { authorizationFlowEnabled: nextValue });
      messageApi.success(
        `Flujo de autorizaciones ${nextValue ? 'habilitado' : 'deshabilitado'}`
      );
    } catch {
      messageApi.error('Error al guardar la configuración.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleModuleToggle = async (moduleKey, checked) => {
    if (!user?.businessID) {
      messageApi.error('No se pudo actualizar la configuración.');
      return;
    }

    // Verificar que al menos un módulo quede activo
    const newModules = {
      invoices: moduleKey === 'invoices' ? checked : enabledModules.invoices,
      accountsReceivable: moduleKey === 'accountsReceivable' ? checked : enabledModules.accountsReceivable,
    };
    const hasActiveModule = Object.values(newModules).some(v => v === true);

    if (!hasActiveModule) {
      messageApi.warning('Debes mantener al menos un módulo activo.');
      return;
    }

    setIsUpdating(true);
    try {
      await setBillingSettings(user, {
        enabledAuthorizationModules: {
          ...newModules,
          cashRegister: newModules.accountsReceivable,
        },
      });
      messageApi.success('Módulo actualizado correctamente');
    } catch {
      messageApi.error('Error al actualizar el módulo.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGoToAuthorizations = () => {
    navigate(ROUTES.AUTHORIZATIONS_TERM.AUTHORIZATIONS_LIST);
  };

  return (
    <Container id={sectionId} data-config-section={sectionId}>
      {contextHolder}
      <SectionContainer>
        <InfoBlock>
          <InfoTitle>Habilitar Flujo de Autorizaciones</InfoTitle>
          <InfoDescription>
            Activa o desactiva la autorización con PIN para acciones protegidas
          </InfoDescription>
        </InfoBlock>
        <ToggleButton
          type="button"
          role="switch"
          aria-checked={authorizationFlowEnabled}
          aria-label="Alternar flujo de autorizaciones"
          onClick={() => handleToggle(!authorizationFlowEnabled)}
          disabled={isUpdating}
          $checked={authorizationFlowEnabled}
        >
          <ToggleThumb $checked={authorizationFlowEnabled} />
        </ToggleButton>
      </SectionContainer>

      {authorizationFlowEnabled && (
        <ModulesSection>
          <ModulesTitle>Módulos de Autorización Activos</ModulesTitle>
          <ModulesDescription>
            Selecciona qué áreas del sistema requieren autorización con PIN. Al menos un módulo debe estar activo.
          </ModulesDescription>
          <ModulesGrid>
            {AVAILABLE_MODULES.map(module => (
              <ModuleCard key={module.key}>
                <ModuleHeader>
                  <Checkbox
                    checked={enabledModules[module.key] !== false}
                    onChange={(e) => handleModuleToggle(module.key, e.target.checked)}
                    disabled={isUpdating}
                  >
                    <ModuleLabel>{module.label}</ModuleLabel>
                  </Checkbox>
                </ModuleHeader>
                <ModuleDescription>{module.description}</ModuleDescription>
              </ModuleCard>
            ))}
          </ModulesGrid>
        </ModulesSection>
      )}

      <StatusContainer>
        {authorizationFlowEnabled ? (
          <StatusCard $type="info">
            <StatusHeader>
              <StatusIndicator $type="info" />
              <StatusTitle $type="info">Autorizaciones activadas</StatusTitle>
            </StatusHeader>
            <StatusDescription>
              Los cajeros deberán solicitar la aprobación de un supervisor con PIN para acciones protegidas.
              {enabledModules.invoices && ' Activo en Facturación.'}
              {enabledModules.accountsReceivable && ' Activo en Cuadre de Caja.'}
            </StatusDescription>
            <HistoryLink type="button" onClick={handleGoToAuthorizations}>
              Ver historial de autorizaciones
            </HistoryLink>
          </StatusCard>
        ) : (
          <StatusCard $type="warning">
            <StatusHeader>
              <StatusIndicator $type="warning" />
              <StatusTitle $type="warning">Autorizaciones desactivadas</StatusTitle>
            </StatusHeader>
            <StatusDescription>
              El flujo de autorizaciones está deshabilitado. Las acciones protegidas se podrán realizar sin solicitar PIN.
            </StatusDescription>
          </StatusCard>
        )}
      </StatusContainer>
    </Container>
  );
};

export default AuthorizationFlowSettingsSection;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1em;
  padding: 16px;
  background-color: #fdfdfdff;
  border-radius: 12px;
  border: 1px solid #e5e9f2;
`;

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2933;
`;

const InfoDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(31, 41, 51, 0.6);
`;

const ToggleButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 44px;
  height: 24px;
  padding: 0;
  border-radius: 999px;
  border: none;
  background-color: ${({ $checked }) => ($checked ? '#2abf88' : '#b8c2cc')};
  transition: background-color 0.2s ease;
  cursor: pointer;
  outline: none;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ToggleThumb = styled.span`
  position: absolute;
  top: 2px;
  left: ${({ $checked }) => ($checked ? '22px' : '2px')};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.3);
  transition: left 0.2s ease;
`;

const StatusContainer = styled.div`

`;

const StatusCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  background-color: ${({ $type }) =>
    $type === 'info' ? 'rgba(42, 191, 136, 0.12)' : 'rgba(245, 158, 11, 0.15)'};
  border: 1px solid
    ${({ $type }) => ($type === 'info' ? 'rgba(42, 191, 136, 0.35)' : 'rgba(245, 158, 11, 0.35)')};
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusIndicator = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ $type }) => ($type === 'info' ? '#2abf88' : '#f59e0b')};
`;

const StatusTitle = styled.span`
  font-weight: 600;
  font-size: 15px;
  color: ${({ $type }) => ($type === 'info' ? '#0f5132' : '#8a3b00')};
`;

const StatusDescription = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(31, 41, 51, 0.75);
`;

const HistoryLink = styled.button`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  color: #1570ef;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: #0b4abf;
  }
`;

const ModulesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background-color: #f8f9fb;
  border-radius: 12px;
  border: 1px solid #e5e9f2;
`;

const ModulesTitle = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2933;
`;

const ModulesDescription = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgba(31, 41, 51, 0.65);
`;

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 8px;
`;

const ModuleCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e1e8ed;
  transition: all 0.2s ease;

  &:hover {
    border-color: #1570ef;
    box-shadow: 0 2px 8px rgba(21, 112, 239, 0.1);
  }
`;

const ModuleHeader = styled.div`
  display: flex;
  align-items: center;
`;

const ModuleLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1f2933;
  margin-left: 4px;
`;

const ModuleDescription = styled.p`
  margin: 0 0 0 24px;
  font-size: 13px;
  line-height: 1.4;
  color: rgba(31, 41, 51, 0.6);
`;
