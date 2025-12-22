import {
  Card,
  InputNumber,
  Typography,
  Space,
  Divider,
  Switch,
  Alert,
} from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  FISCAL_RECEIPTS_ALERT_CONFIG,
  getThresholdsForReceiptType,
} from '../../../../../../../config/fiscalReceiptsAlertConfig';

const { Title, Text } = Typography;

/**
 * Componente para configurar los umbrales de alerta de comprobantes fiscales
 */
const FiscalReceiptsAlertSettings = ({
  taxReceipts = [],
  onConfigChange,
  disabled = false,
  initialConfig = null,
}) => {
  const [alertsEnabled, setAlertsEnabled] = useState(() => initialConfig?.alertsEnabled ?? true);
  const [globalThresholds, setGlobalThresholds] = useState(() => initialConfig?.globalThresholds ?? {
    warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
    critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
  });

  const receiptTypesKey = useMemo(() => {
    const types = taxReceipts
      .map((receipt) => receipt?.data?.name)
      .filter(Boolean);
    types.sort();
    return types.join('|');
  }, [taxReceipts]);

  const initialCustomThresholds = useMemo(() => {
    const thresholds = {};
    taxReceipts.forEach((receipt) => {
      if (receipt?.data?.name) {
        const receiptName = receipt.data.name;
        thresholds[receiptName] = getThresholdsForReceiptType(receiptName);
      }
    });
    return thresholds;
  }, [taxReceipts]);

  const [{ trigger: customTrigger, value: customValue }, setCustomThresholdState] =
    useState(() => ({
      trigger: receiptTypesKey,
      value: initialConfig?.customThresholds ?? initialCustomThresholds,
    }));

  const customThresholds =
    customTrigger === receiptTypesKey ? customValue : initialCustomThresholds;

  const setCustomThresholds = useCallback(
    (value) => setCustomThresholdState({ trigger: receiptTypesKey, value }),
    [receiptTypesKey],
  );

  const handleGlobalThresholdChange = (type, value) => {
    const newThresholds = { ...globalThresholds, [type]: value };
    setGlobalThresholds(newThresholds);

    if (onConfigChange) {
      onConfigChange({
        alertsEnabled,
        globalThresholds: newThresholds,
        customThresholds,
      });
    }
  };

  const handleCustomThresholdChange = (receiptName, type, value) => {
    const newCustomThresholds = {
      ...customThresholds,
      [receiptName]: {
        ...customThresholds[receiptName],
        [type]: value,
      },
    };
    setCustomThresholds(newCustomThresholds);

    if (onConfigChange) {
      onConfigChange({
        alertsEnabled,
        globalThresholds,
        customThresholds: newCustomThresholds,
      });
    }
  };

  const handleAlertsToggle = (enabled) => {
    setAlertsEnabled(enabled);

    if (onConfigChange) {
      onConfigChange({
        alertsEnabled: enabled,
        globalThresholds,
        customThresholds,
      });
    }
  };

  const getUniqueReceiptTypes = () => {
    const types = new Set();
    taxReceipts.forEach((receipt) => {
      if (receipt?.data?.name) {
        types.add(receipt.data.name);
      }
    });
    return Array.from(types);
  };

  return (
    <ConfigContainer>
      <Card
        title="Configuración de Alertas de Comprobantes"
        extra={
          <Switch
            checked={alertsEnabled}
            onChange={handleAlertsToggle}
            disabled={disabled}
          />
        }
      >
        {!alertsEnabled && (
          <Alert
            message="Las alertas están desactivadas"
            description="Activa las alertas para recibir notificaciones cuando los comprobantes estén por agotarse."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Configuración Global */}
          <div>
            <Title level={5}>Umbrales Globales</Title>
            <Text type="secondary">
              Estos umbrales se aplicarán por defecto a todos los comprobantes
              que no tengan configuración personalizada.
            </Text>

            <ThresholdRow>
              <ThresholdItem>
                <label>Advertencia cuando queden menos de:</label>
                <InputNumber
                  value={globalThresholds.warning}
                  onChange={(value) =>
                    handleGlobalThresholdChange('warning', value)
                  }
                  min={1}
                  max={1000}
                  disabled={disabled || !alertsEnabled}
                  addonAfter="comprobantes"
                />
              </ThresholdItem>

              <ThresholdItem>
                <label>Crítico cuando queden menos de:</label>
                <InputNumber
                  value={globalThresholds.critical}
                  onChange={(value) =>
                    handleGlobalThresholdChange('critical', value)
                  }
                  min={1}
                  max={globalThresholds.warning - 1}
                  disabled={disabled || !alertsEnabled}
                  addonAfter="comprobantes"
                />
              </ThresholdItem>
            </ThresholdRow>
          </div>

          <Divider />

          {/* Configuración Personalizada por Tipo */}
          {getUniqueReceiptTypes().length > 0 && (
            <div>
              <Title level={5}>Configuración Personalizada</Title>
              <Text type="secondary">
                Configura umbrales específicos para cada tipo de comprobante.
              </Text>

              {getUniqueReceiptTypes().map((receiptType) => {
                const customConfig =
                  customThresholds[receiptType] || globalThresholds;

                return (
                  <CustomReceiptCard key={receiptType}>
                    <ReceiptTitle>{receiptType}</ReceiptTitle>

                    <ThresholdRow>
                      <ThresholdItem>
                        <label>Advertencia:</label>
                        <InputNumber
                          value={customConfig.warning}
                          onChange={(value) =>
                            handleCustomThresholdChange(
                              receiptType,
                              'warning',
                              value,
                            )
                          }
                          min={1}
                          max={1000}
                          disabled={disabled || !alertsEnabled}
                          addonAfter="comprobantes"
                          placeholder={globalThresholds.warning}
                        />
                      </ThresholdItem>

                      <ThresholdItem>
                        <label>Crítico:</label>
                        <InputNumber
                          value={customConfig.critical}
                          onChange={(value) =>
                            handleCustomThresholdChange(
                              receiptType,
                              'critical',
                              value,
                            )
                          }
                          min={1}
                          max={
                            (customConfig.warning || globalThresholds.warning) -
                            1
                          }
                          disabled={disabled || !alertsEnabled}
                          addonAfter="comprobantes"
                          placeholder={globalThresholds.critical}
                        />
                      </ThresholdItem>
                    </ThresholdRow>
                  </CustomReceiptCard>
                );
              })}
            </div>
          )}
        </Space>
      </Card>
    </ConfigContainer>
  );
};

const ConfigContainer = styled.div`
  .ant-card-head-title {
    font-size: 1rem;
    font-weight: 600;
  }
`;

const ThresholdRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-3);

  @media (width <= 768px) {
    flex-direction: column;
    gap: var(--space-3);
  }
`;

const ThresholdItem = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 200px;

  label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-80);
  }
`;

const CustomReceiptCard = styled.div`
  padding: var(--space-4);
  margin-top: var(--space-3);
  background-color: var(--bg-light);
  border: 1px solid var(--border-200);
  border-radius: var(--radius);

  .ant-typography {
    margin-bottom: var(--space-2) !important;
  }
`;

const ReceiptTitle = styled.h6`
  margin: 0 0 var(--space-2) 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #262626);
  text-transform: capitalize;
  letter-spacing: 0.02em;
`;

export default FiscalReceiptsAlertSettings;
