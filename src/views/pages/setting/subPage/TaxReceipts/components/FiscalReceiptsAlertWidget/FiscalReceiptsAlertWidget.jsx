import { SettingOutlined } from '@ant-design/icons';
import { Drawer, Button } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';

import FiscalReceiptsAlertSettings from '../FiscalReceiptsAlertSettings/FiscalReceiptsAlertSettings';

/**
 * Botón simple para abrir configuración de alertas de comprobantes fiscales
 */
const FiscalReceiptsAlertWidget = ({ 
  taxReceipts = [], 
  onConfigChange,
  disabled = false,
  alertConfig = null
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleOpenDrawer = () => {
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <>
      <ConfigButton
        type="default"
        icon={<SettingOutlined />}
        onClick={handleOpenDrawer}
        disabled={disabled}
        size="large"
      >
        Configurar Alertas de Comprobantes
      </ConfigButton>

      <Drawer
        title="Configuración de Alertas de Comprobantes"
        placement="right"
        onClose={handleCloseDrawer}
        open={drawerVisible}
        width={500}
        styles={{
          body: { padding: '24px' },
        }}
      >
        <FiscalReceiptsAlertSettings
          taxReceipts={taxReceipts}
          onConfigChange={onConfigChange}
          disabled={disabled}
          initialConfig={alertConfig}
        />
      </Drawer>
    </>
  );
};

const ConfigButton = styled(Button)`
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  background: #fafafa;
  
  &:hover:not(:disabled) {
    border-color: #1890ff;
    color: #1890ff;
    background: #f0f9ff;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default FiscalReceiptsAlertWidget;
