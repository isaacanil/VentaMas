import { SettingOutlined } from '@/constants/icons/antd';
import { Button, Modal, Typography } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';

const { Text } = Typography;

import FiscalReceiptsAlertSettings, {
  type FiscalReceiptsAlertConfigState,
} from '@/modules/settings/pages/setting/subPage/TaxReceipts/components/FiscalReceiptsAlertSettings/FiscalReceiptsAlertSettings';
import type { TaxReceiptDocument } from '@/types/taxReceipt';

interface FiscalReceiptsAlertWidgetProps {
  taxReceipts?: TaxReceiptDocument[];
  onSave?: (config: FiscalReceiptsAlertConfigState) => Promise<void> | void;
  disabled?: boolean;
  alertConfig?: Partial<FiscalReceiptsAlertConfigState> | null;
  loading?: boolean;
  saving?: boolean;
}

const EMPTY_TAX_RECEIPTS: TaxReceiptDocument[] = [];

/**
 * Botón simple para abrir configuración de alertas de comprobantes fiscales
 */
const FiscalReceiptsAlertWidget = ({
  taxReceipts = EMPTY_TAX_RECEIPTS,
  onSave,
  disabled = false,
  alertConfig = null,
  loading = false,
  saving = false,
}: FiscalReceiptsAlertWidgetProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <ConfigButton
        type="default"
        icon={<SettingOutlined />}
        onClick={handleOpenModal}
        disabled={disabled}
        size="large"
      >
        Configurar alertas
      </ConfigButton>

      <StyledModal
        title={
          <ModalHeader>
            <ModalTitle>Configuración de Alertas de Comprobantes</ModalTitle>
            <Text type="secondary">
              Define cuándo alertar por cantidad o vencimiento.
            </Text>
          </ModalHeader>
        }
        onCancel={handleCloseModal}
        open={modalVisible}
        width={780}
        footer={null}
        destroyOnHidden
      >
        <FiscalReceiptsAlertSettings
          taxReceipts={taxReceipts}
          onSave={async (config) => {
            await onSave?.(config);
            handleCloseModal();
          }}
          onCancel={handleCloseModal}
          disabled={disabled}
          initialConfig={alertConfig}
          loading={loading}
          saving={saving}
        />
      </StyledModal>
    </>
  );
};

const ConfigButton = styled(Button)`
  display: flex;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: var(--ds-type-scale-label-size);
  font-weight: var(--ds-type-scale-label-weight);
  line-height: var(--ds-type-scale-label-line-height);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);

  &:hover:not(:disabled) {
    color: var(--ds-color-text-primary);
    background: var(--ds-color-bg-subtle);
    border-color: var(--ds-color-border-strong);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

export default FiscalReceiptsAlertWidget;

const StyledModal = styled(Modal)`
  .ant-modal-body {
    padding: var(--ds-space-6) var(--ds-space-6) var(--ds-space-5);
  }
`;

const ModalHeader = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  padding-right: var(--ds-space-6);
`;

const ModalTitle = styled.h4`
  margin: 0;
  font-size: var(--ds-type-scale-section-title-size);
  font-weight: var(--ds-type-scale-section-title-weight);
  line-height: var(--ds-type-scale-section-title-line-height);
  color: var(--ds-color-text-primary);
`;
