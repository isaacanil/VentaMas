import { SettingOutlined } from '@/constants/icons/antd';
import { Drawer, Button } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';

import FiscalReceiptsAlertSettings, {
  type FiscalReceiptsAlertConfigState,
} from '@/modules/settings/pages/setting/subPage/TaxReceipts/components/FiscalReceiptsAlertSettings/FiscalReceiptsAlertSettings';
import type { TaxReceiptDocument } from '@/types/taxReceipt';

interface FiscalReceiptsAlertWidgetProps {
  taxReceipts?: TaxReceiptDocument[];
  onConfigChange?: (config: FiscalReceiptsAlertConfigState) => void;
  disabled?: boolean;
  alertConfig?: Partial<FiscalReceiptsAlertConfigState> | null;
}

const EMPTY_TAX_RECEIPTS: TaxReceiptDocument[] = [];

/**
 * Botón simple para abrir configuración de alertas de comprobantes fiscales
 */
const FiscalReceiptsAlertWidget = ({
  taxReceipts = EMPTY_TAX_RECEIPTS,
  onConfigChange,
  disabled = false,
  alertConfig = null,
}: FiscalReceiptsAlertWidgetProps) => {
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
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  font-size: 14px;
  font-weight: 500;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 8px;

  &:hover:not(:disabled) {
    color: #1890ff;
    background: #f0f9ff;
    border-color: #1890ff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export default FiscalReceiptsAlertWidget;
