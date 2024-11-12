import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import * as antd from 'antd';
const {
  Card,
  Tabs,
  Radio,
  Button,
  Modal,
  Menu,
  Dropdown,
} = antd;
import {
  CreditCardOutlined,
  DownOutlined,
} from '@ant-design/icons';
import BillingConfig from './configs/BillingConfig'; // Import the new InvoiceConfig component
import { Header } from './components/Header/Header';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Card)`
  max-width: 800px;
  margin: 20px auto;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    justify-content: center;
  }
`;

const TabContent = styled.div`
  margin-top: 16px;
`;

const tabItems = [
  {
    key: 'billing',
    icon: <CreditCardOutlined />,
    label: 'Ventas y Facturación',
    content: <BillingConfig />,
  },
];

export default function GeneralConfig() {
  const [activeTab, setActiveTab] = useState('billing');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [isModalVisible, setIsModalVisible] = useState(false); // Definir isModalVisible
  const navigate = useNavigate(); // Inicializar navigate

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const menu = (
    <Menu
      onClick={(e) => {
        setActiveTab(e.key);
        setIsModalVisible(true); // Abrir modal al seleccionar una pestaña
      }}
      items={tabItems.map(item => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
      }))} />
  );

  const handleSave = () => {
    message.success('Configuración guardada con éxito');
  }

  return (
    <StyledCard bordered={false}>
      {/* Header con controles de navegación */}
      <Header
        onBack={handleBack}
        title="Configuración General"
      />

    {/* Contenido principal */}
 
        <>
          <StyledTabs activeKey={activeTab} onChange={setActiveTab} centered>
            {tabItems.map((item) => (
              <Tabs.TabPane
                tab={
                  <span>
                    {item.icon}
                    {item.label}
                  </span>
                }
                key={item.key}
              />
            ))}
          </StyledTabs>
          <TabContent>
            {tabItems.find((item) => item.key === activeTab)?.content}
          </TabContent>
          {/* <Button type="primary" onClick={handleSave} style={{ marginTop: '16px' }}>
            Guardar Configuración
          </Button> */}
        </>
    
    </StyledCard>
  );
}

