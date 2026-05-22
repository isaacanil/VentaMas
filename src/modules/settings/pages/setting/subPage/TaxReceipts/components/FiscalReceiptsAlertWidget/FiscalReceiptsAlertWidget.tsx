import { SettingOutlined } from '@/constants/icons/antd';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { VmButton, VmModal } from '@/components/heroui';
import FiscalReceiptsAlertSettings, {
  FISCAL_RECEIPTS_ALERT_SETTINGS_FORM_ID,
  type FiscalReceiptsAlertConfigState,
} from '@/modules/settings/pages/setting/subPage/TaxReceipts/components/FiscalReceiptsAlertSettings/FiscalReceiptsAlertSettings';

interface FiscalReceiptsAlertWidgetProps {
  onSave?: (config: FiscalReceiptsAlertConfigState) => Promise<void> | void;
  disabled?: boolean;
  alertConfig?: Partial<FiscalReceiptsAlertConfigState> | null;
  loading?: boolean;
  saving?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

/**
 * Botón simple para abrir configuración de alertas de comprobantes fiscales
 */
const FiscalReceiptsAlertWidget = ({
  onSave,
  disabled = false,
  alertConfig = null,
  loading = false,
  saving = false,
  open,
  onOpenChange,
  hideTrigger = false,
}: FiscalReceiptsAlertWidgetProps) => {
  const [internalModalVisible, setInternalModalVisible] = useState(false);
  const modalVisible = open ?? internalModalVisible;

  const setModalVisibility = useCallback(
    (nextOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(nextOpen);
        return;
      }

      setInternalModalVisible(nextOpen);
    },
    [onOpenChange],
  );

  const handleOpenModal = () => setModalVisibility(true);
  const handleCloseModal = () => setModalVisibility(false);
  const modalFooter = (
    <>
      <VmButton
        variant="outline"
        onPress={handleCloseModal}
        isDisabled={saving}
      >
        Cancelar
      </VmButton>
      <VmButton
        variant="primary"
        type="submit"
        form={FISCAL_RECEIPTS_ALERT_SETTINGS_FORM_ID}
        isPending={saving}
        isDisabled={disabled || loading}
      >
        Guardar
      </VmButton>
    </>
  );

  return (
    <>
      {hideTrigger ? null : (
        <ConfigButton
          variant="outline"
          onPress={handleOpenModal}
          isDisabled={disabled}
        >
          <ButtonContent>
            <SettingOutlined />
            Configurar alertas
          </ButtonContent>
        </ConfigButton>
      )}

      <VmModal
        isOpen={modalVisible}
        onOpenChange={setModalVisibility}
        title="Alertas de comprobantes"
        ariaLabel="Alertas de comprobantes"
        size="sm"
        footer={modalFooter}
      >
        <FiscalReceiptsAlertSettings
          onSave={async (config) => {
            await onSave?.(config);
            handleCloseModal();
          }}
          disabled={disabled}
          initialConfig={alertConfig}
          loading={loading}
          saving={saving}
        />
      </VmModal>
    </>
  );
};

const ConfigButton = styled(VmButton)`
  white-space: nowrap;
`;

const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
`;

export default FiscalReceiptsAlertWidget;
