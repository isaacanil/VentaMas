// @ts-nocheck
import { Tabs, Alert } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { useAuthorizationModules } from '@/hooks/useAuthorizationModules';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';

import ApprovalLogs from './components/ApprovalLogs/ApprovalLogs';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const { authorizationFlowEnabled, hasActiveModules } =
    useAuthorizationModules();

  // Solo admin, owner, dev pueden ver solicitudes
  const canViewRequests = ['admin', 'owner', 'dev'].includes(user?.role);
  const canViewLogs = ['admin', 'owner', 'dev', 'manager'].includes(user?.role);

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

    if (canViewLogs && modulesActive) {
      items.push({
        key: 'approvalLogs',
        label: 'Historial de Autorizaciones',
        children: <ApprovalLogs searchTerm={searchTerm} />,
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
  }, [canViewRequests, canViewLogs, modulesActive, searchTerm]);

  const tabKeys = useMemo(() => tabs.map(({ key }) => key), [tabs]);
  const defaultTabKey = tabKeys[0] ?? 'mypin';
  const tabParam = searchParams.get('tab');
  const resolvedActiveTab = useMemo(() => {
    if (tabParam && tabKeys.includes(tabParam)) {
      return tabParam;
    }
    return defaultTabKey;
  }, [defaultTabKey, tabKeys, tabParam]);

  const [activeTab, setActiveTab] = useState(resolvedActiveTab);

  // Sincronizar activeTab cuando resolvedActiveTab cambia
  useEffect(() => {
    setActiveTab(resolvedActiveTab);
  }, [resolvedActiveTab]);

  useEffect(() => {
    if (!resolvedActiveTab) return;
    if (tabParam !== resolvedActiveTab) {
      const params = new URLSearchParams(searchParams);
      params.set('tab', resolvedActiveTab);
      setSearchParams(params, { replace: true });
    }
  }, [resolvedActiveTab, tabParam, searchParams, setSearchParams]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    const params = new URLSearchParams(searchParams);
    params.set('tab', key);
    setSearchParams(params);
  };

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
                ? 'El flujo de autorizaciones está desactivado. Ve a Configuración > Flujo de Autorizaciones para activarlo.'
                : 'No hay módulos de autorización activos. Ve a Configuración > Flujo de Autorizaciones para activar al menos un módulo.'
            }
            type="warning"
            showIcon
            style={{ margin: '20px 0' }}
          />
        ) : (
          <StyledTabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabs}
            destroyOnHidden={false}
          />
        )}
      </Content>
    </Container>
  );
};

export default AuthorizationsManager;
