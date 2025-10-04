import React, { useState } from 'react';
import styled from 'styled-components';
import { CheckCircleOutlined, FileTextOutlined, DollarOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import AuthorizationsWidget from './AuthorizationsWidget';
import FiscalReceiptsNotificationWidget from './FiscalReceiptsNotificationWidget';
import AccountsReceivableWidget from './AccountsReceivableWidget/AccountsReceivableWidget';

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
        component: <AuthorizationsWidget />,
      },
      {
        key: 'fiscal-receipts',
        label: 'Comprobantes Fiscales',
        icon: <FileTextOutlined />,
        component: <FiscalReceiptsNotificationWidget data={fiscalReceiptsData} />,
      },
    ];

    // Agregar Cuentas por Cobrar solo para admins
    if (isAdmin) {
      modules.push({
        key: 'accounts-receivable',
        label: 'Cuentas por Cobrar',
        icon: <DollarOutlined />,
        component: <AccountsReceivableWidget showQuickStats={false} daysThreshold={7} />,
      });
    }

    return modules;
  };

  const modules = getModulesConfig();
  const activeModuleData = modules.find(m => m.key === activeModule);

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

      <ContentWrapper>
        {activeModuleData?.component}
      </ContentWrapper>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModulesBar = styled.div`
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  background: linear-gradient(to bottom, #ffffff, #f8fafc);
  border-bottom: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
`;

const ModuleTab = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' : '#ffffff'};
  color: ${props => props.$active ? '#ffffff' : '#6b7280'};
  border: 1px solid ${props => props.$active ? '#1890ff' : '#e5e7eb'};
  border-radius: 12px;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.$active 
    ? '0 4px 12px rgba(24, 144, 255, 0.25), 0 2px 6px rgba(24, 144, 255, 0.15)' 
    : '0 1px 2px rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' 
      : '#f8fafc'};
    border-color: ${props => props.$active ? '#1890ff' : '#cbd5e1'};
    color: ${props => props.$active ? '#ffffff' : '#374151'};
    transform: translateY(-1px);
    box-shadow: ${props => props.$active 
      ? '0 6px 16px rgba(24, 144, 255, 0.3), 0 3px 8px rgba(24, 144, 255, 0.2)' 
      : '0 2px 8px rgba(0, 0, 0, 0.08)'};
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
  white-space: nowrap;
  font-size: 14px;
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  
  /* Scrollbar personalizado */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
    
    &:hover {
      background: #94a3b8;
    }
  }

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
`;

export default ModulesNavigator;
