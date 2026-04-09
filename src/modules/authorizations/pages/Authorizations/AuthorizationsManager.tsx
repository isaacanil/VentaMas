import { Tabs, Alert, type TabsProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { useAuthorizationModules } from '@/hooks/useAuthorizationModules';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type { UserIdentity } from '@/types/users';
import {
  hasAuthorizationApproveAccess,
  hasAuthorizationRequestsViewAccess,
} from '@/utils/access/authorizationAccess';

import ApprovalLogs from './components/ApprovalLogs/ApprovalLogs';
import { AuthorizationRequests } from './components/AuthorizationRequests/AuthorizationRequests';
import { PersonalPinManagement } from './components/PersonalPinManagement';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

const Content = styled.div`
  flex: 1;
  padding: 0 16px;
  min-height: 0;
  overflow-y: auto;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 16px;
  }
`;

type AuthUser = UserIdentity & { role?: string };

interface AuthorizationModulesState {
  authorizationFlowEnabled: boolean;
  hasActiveModules: () => boolean;
}

/**
 * Pantalla unificada de gestión de autorizaciones
 * Combina:
 * - Solicitudes de autorización (facturas, cuentas por cobrar, etc.) - Solo admin/owner/dev
 * - Mis PINs (cada usuario gestiona sus propios PINs)
 */
export const AuthorizationsManager = () => {
  const user = useSelector(selectUser) as AuthUser | null;
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const { authorizationFlowEnabled, hasActiveModules } =
    useAuthorizationModules() as AuthorizationModulesState;

  // Solo admin, owner, dev pueden ver solicitudes
  const canViewRequests = hasAuthorizationRequestsViewAccess(user);
  const canViewLogs = hasAuthorizationApproveAccess(user);

  const modulesActive = hasActiveModules();

  const tabs = useMemo<NonNullable<TabsProps['items']>>(() => {
    const items: NonNullable<TabsProps['items']> = [];

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

  const tabKeys = useMemo(() => tabs.map(({ key }) => String(key)), [tabs]);
  const defaultTabKey = tabKeys[0] ?? 'mypin';
  const tabParam = searchParams.get('tab');
  const resolvedActiveTab = useMemo(() => {
    if (tabParam && tabKeys.includes(tabParam)) {
      return tabParam;
    }
    return defaultTabKey;
  }, [defaultTabKey, tabKeys, tabParam]);

  const activeTab = resolvedActiveTab;

  useEffect(() => {
    if (!resolvedActiveTab) return;
    if (tabParam !== resolvedActiveTab) {
      const params = new URLSearchParams(searchParams);
      params.set('tab', resolvedActiveTab);
      setSearchParams(params, { replace: true });
    }
  }, [resolvedActiveTab, tabParam, searchParams, setSearchParams]);

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', key);
    setSearchParams(params);
  };

  return (
    <>
      <MenuApp
        displayName="Autorizaciones"
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <Container>
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
    </>
  );
};

export default AuthorizationsManager;
