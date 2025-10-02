import { useState } from 'react';
import { Tabs, Typography } from 'antd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../features/auth/userSlice';
import { MenuApp } from '../../templates/MenuApp/MenuApp';
import styled from 'styled-components';
import { AuthorizationRequests } from './components/AuthorizationRequests';
import { PersonalPinManagement } from './components/PersonalPinManagement';

const { Title } = Typography;

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
`;

const Content = styled.div`
  padding: 16px;
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
 * - Mi PIN personal (cada usuario ve solo su propio PIN)
 */
export const AuthorizationsManager = () => {
  const user = useSelector(selectUser);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('requests');

  // Solo admin, owner, dev pueden ver solicitudes
  const canViewRequests = ['admin', 'owner', 'dev'].includes(user?.role);

  const tabs = [
    // Tab de solicitudes solo para admins
    ...(canViewRequests ? [{
      key: 'requests',
      label: 'Solicitudes de Autorización',
      children: <AuthorizationRequests searchTerm={searchTerm} />,
    }] : []),
    // Tab de PIN personal - todos los usuarios
    {
      key: 'mypin',
      label: 'Mi PIN Personal',
      children: <PersonalPinManagement />,
    },
  ];

  return (
    <Container>
      <MenuApp
        displayName="Autorizaciones"
        searchData={searchTerm}
        setSearchData={setSearchTerm}
        showNotificationButton={false}
      />
      <Content>
        <StyledTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabs}
          destroyOnHidden={false}
        />
      </Content>
    </Container>
  );
};

export default AuthorizationsManager;
