import { useEffect, useMemo, useState } from 'react';
import { Tabs, Alert } from 'antd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../features/auth/userSlice';
import { useAuthorizationModules } from '../../../hooks/useAuthorizationModules';
import { MenuApp } from '../../templates/MenuApp/MenuApp';
import styled from 'styled-components';
import { AuthorizationRequests } from './components/AuthorizationRequests/AuthorizationRequests';
import { PersonalPinManagement } from './components/PersonalPinManagement';

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
`;

const Content = styled.div`
  padding: 0 16px;
  overflow-y: auto;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 16px;
  }
`;

/**
 * Pantalla unificada de gestión de autorizaciones
 * Combina:
 * - Solicitudes de autorización (facturas, cuentas por cobrar, etc.) - Solo admin/owner/dev
 * - Mis PINs (cada usuario gestiona sus propios PINs)
 */
export const AuthorizationsManager = () => {
  const user = useSelector(selectUser);
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    authorizationFlowEnabled, 
    hasActiveModules 
  } = useAuthorizationModules();

  // Solo admin, owner, dev pueden ver solicitudes
  const canViewRequests = ['admin', 'owner', 'dev'].includes(user?.role);

  const modulesActive = hasActiveModules();

  const tabs = useMemo(() => {
    const items = [];

    if (canViewRequests && modulesActive) {
      items.push({
        key: 'requests',
        label: 'Solicitudes de Autorización',
        children: <AuthorizationRequests searchTerm={searchTerm} />,
      });
    }

    if (modulesActive) {
      items.push({
        key: 'mypin',
        label: 'Mis PINs',
        children: <PersonalPinManagement />,
      });
    }

    return items;
  }, [canViewRequests, modulesActive, searchTerm]);

  const defaultTabKey = tabs[0]?.key ?? 'mypin';
  const [activeTab, setActiveTab] = useState(defaultTabKey);

  useEffect(() => {
    if (!tabs.some(({ key }) => key === activeTab)) {
      setActiveTab(defaultTabKey);
    }
  }, [activeTab, defaultTabKey, tabs]);

  return (
    <Container>
      <MenuApp
        displayName="Autorizaciones"
        searchData={searchTerm}
        setSearchData={setSearchTerm}
        showNotificationButton={false}
      />
      <Content>
        {!authorizationFlowEnabled || !modulesActive ? (
          <Alert
            message="Autorizaciones Desactivadas"
            description={
              !authorizationFlowEnabled
                ? "El flujo de autorizaciones está desactivado. Ve a Configuración > Flujo de Autorizaciones para activarlo."
                : "No hay módulos de autorización activos. Ve a Configuración > Flujo de Autorizaciones para activar al menos un módulo."
            }
            type="warning"
            showIcon
            style={{ margin: '20px 0' }}
          />
        ) : (
          <StyledTabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabs}
            destroyOnHidden={false}
          />
        )}
      </Content>
    </Container>
  );
};

export default AuthorizationsManager;
