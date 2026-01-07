import {
  CheckCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';

import AccountsReceivablePanel from './panels/AccountsReceivablePanel/AccountsReceivablePanel';
import AuthorizationsPanel from './panels/AuthorizationsPanel/AuthorizationsPanel';
import FiscalReceiptsPanel from './panels/FiscalReceiptsPanel/FiscalReceiptsPanel';

/**
 * Sistema de módulos con navegación por tabs
 * Muestra diferentes módulos según el rol del usuario
 */
const ModulesNavigator = ({ fiscalReceiptsData }) => {
  const user = useSelector(selectUser);
  const [activeModule, setActiveModule] = useState('authorizations');

  const isAdmin = user?.role === 'admin' || user?.role === 'dev';

  // Configuración de módulos según rol
  const getModulesConfig = () => {
    const modules = [
      {
        key: 'authorizations',
        label: 'Autorizaciones',
        icon: <CheckCircleOutlined />,
        component: <AuthorizationsPanel />,
      },
      {
        key: 'fiscal-receipts',
        label: 'Comprobantes Fiscales',
        icon: <FileTextOutlined />,
        component: <FiscalReceiptsPanel data={fiscalReceiptsData} />,
      },
    ];

    // Agregar Cuentas por Cobrar solo para admins
    if (isAdmin) {
      modules.push({
        key: 'accounts-receivable',
        label: 'Cuentas por Cobrar',
        icon: <DollarOutlined />,
        component: (
          <AccountsReceivablePanel showQuickStats={false} daysThreshold={7} />
        ),
      });
    }

    return modules;
  };

  const modules = getModulesConfig();
  const activeModuleData = modules.find((m) => m.key === activeModule);

  return (
    <Container>
      <ModulesBar>
        {modules.map((module) => (
          <ModuleTab
            key={module.key}
            $active={activeModule === module.key}
            onClick={() => setActiveModule(module.key)}
          >
            <ModuleIcon>{module.icon}</ModuleIcon>
            <ModuleLabel>{module.label}</ModuleLabel>
          </ModuleTab>
        ))}
      </ModulesBar>

      <ContentWrapper>{activeModuleData?.component}</ContentWrapper>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 8px;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

const ModulesBar = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  padding: 12px 16px;
  margin: 16px 24px 0;
  background: linear-gradient(to bottom, #fff, #f8fafc);
  border-bottom: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 4%);
`;

const ModuleTab = styled.button`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? '600' : '500')};
  color: ${(props) => (props.$active ? '#ffffff' : '#6b7280')};
  cursor: pointer;
  background: ${(props) =>
    props.$active
      ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
      : '#ffffff'};
  border: 1px solid ${(props) => (props.$active ? '#1890ff' : '#e5e7eb')};
  border-radius: 12px;
  box-shadow: ${(props) =>
    props.$active
      ? '0 4px 12px rgba(24, 144, 255, 0.25), 0 2px 6px rgba(24, 144, 255, 0.15)'
      : '0 1px 2px rgba(0, 0, 0, 0.05)'};
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: ${(props) => (props.$active ? '#ffffff' : '#374151')};
    background: ${(props) =>
      props.$active
        ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
        : '#f8fafc'};
    border-color: ${(props) => (props.$active ? '#1890ff' : '#cbd5e1')};
    box-shadow: ${(props) =>
      props.$active
        ? '0 6px 16px rgba(24, 144, 255, 0.3), 0 3px 8px rgba(24, 144, 255, 0.2)'
        : '0 2px 8px rgba(0, 0, 0, 0.08)'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ModuleIcon = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;
`;

const ModuleLabel = styled.span`
  font-size: 14px;
  white-space: nowrap;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 24px;
  overflow: hidden;
`;

export default ModulesNavigator;
