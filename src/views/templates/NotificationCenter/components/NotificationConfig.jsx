import { useState } from 'react';
import styled from 'styled-components';
import { Switch } from 'antd';

const NotificationConfig = () => {
  const [widgetSettings, setWidgetSettings] = useState({
    fiscalReceipts: true,
    accountsReceivable: true,
    inventory: true,
    sales: true,
    system: true
  });

  const handleToggleWidget = (widgetName, isEnabled) => {
    setWidgetSettings(prevSettings => ({
      ...prevSettings,
      [widgetName]: isEnabled
    }));
  };

  return (
    <ConfigContainer>
      <ConfigTitle>Widgets Disponibles</ConfigTitle>
      
      <WidgetSettingsList>
        <WidgetSettingItem>
          <WidgetInfo>
            <WidgetName>Comprobantes Fiscales</WidgetName>
            <WidgetDescription>Alertas sobre comprobantes fiscales por agotarse</WidgetDescription>
          </WidgetInfo>
          <Switch 
            checked={widgetSettings.fiscalReceipts}
            onChange={(checked) => handleToggleWidget('fiscalReceipts', checked)}
          />
        </WidgetSettingItem>
        
        <WidgetSettingItem>
          <WidgetInfo>
            <WidgetName>Cuentas por Cobrar</WidgetName>
            <WidgetDescription>Alertas sobre cuentas próximas a vencer</WidgetDescription>
          </WidgetInfo>
          <Switch 
            checked={widgetSettings.accountsReceivable}
            onChange={(checked) => handleToggleWidget('accountsReceivable', checked)}
          />
        </WidgetSettingItem>
        
        <WidgetSettingItem>
          <WidgetInfo>
            <WidgetName>Inventario</WidgetName>
            <WidgetDescription>Alertas sobre productos con bajo stock</WidgetDescription>
          </WidgetInfo>
          <Switch 
            checked={widgetSettings.inventory}
            onChange={(checked) => handleToggleWidget('inventory', checked)}
          />
        </WidgetSettingItem>
        
        <WidgetSettingItem>
          <WidgetInfo>
            <WidgetName>Ventas</WidgetName>
            <WidgetDescription>Notificaciones sobre metas de ventas y estadísticas</WidgetDescription>
          </WidgetInfo>
          <Switch 
            checked={widgetSettings.sales}
            onChange={(checked) => handleToggleWidget('sales', checked)}
          />
        </WidgetSettingItem>
        
        <WidgetSettingItem>
          <WidgetInfo>
            <WidgetName>Sistema</WidgetName>
            <WidgetDescription>Alertas sobre actualizaciones y mantenimiento</WidgetDescription>
          </WidgetInfo>
          <Switch 
            checked={widgetSettings.system}
            onChange={(checked) => handleToggleWidget('system', checked)}
          />
        </WidgetSettingItem>
      </WidgetSettingsList>
      
      <SaveButtonContainer>
        <SaveButton>Guardar Configuración</SaveButton>
      </SaveButtonContainer>
    </ConfigContainer>
  );
};

const ConfigContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--space-5);
`;

const ConfigTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 var(--space-5) 0;
  color: var(--text-100);
`;

const WidgetSettingsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const WidgetSettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border);
  
  &:first-child {
    border-top: 1px solid var(--border);
  }
`;

const WidgetInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const WidgetName = styled.span`
  font-weight: 500;
  font-size: 1rem;
  margin-bottom: var(--space-1);
  color: var(--text-100);
`;

const WidgetDescription = styled.span`
  font-size: 0.85rem;
  color: var(--text-60);
`;

const SaveButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-6);
`;

const SaveButton = styled.button`
  padding: var(--space-2) var(--space-5);
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: #0052cc; /* primary un poco más oscuro */
  }
`;

export default NotificationConfig;
