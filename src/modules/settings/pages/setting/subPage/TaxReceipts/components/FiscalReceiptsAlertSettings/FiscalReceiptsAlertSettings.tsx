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
} from '@/config/fiscalReceiptsAlertConfig';
import type { TaxReceiptDocument } from '@/types/taxReceipt';

type ThresholdConfig = {
  warning: number | null;
  critical: number | null;
};

type CustomThresholdConfig = Partial<ThresholdConfig>;

type CustomThresholds = Record<string, CustomThresholdConfig>;

export interface FiscalReceiptsAlertConfigState {
  alertsEnabled: boolean;
  globalThresholds: ThresholdConfig;
  customThresholds: CustomThresholds;
}

interface FiscalReceiptsAlertSettingsProps {
  taxReceipts?: TaxReceiptDocument[];
  onConfigChange?: (config: FiscalReceiptsAlertConfigState) => void;
  disabled?: boolean;
  initialConfig?: Partial<FiscalReceiptsAlertConfigState> | null;
}

const { Title, Text } = Typography;

/**
 * Componente para configurar los umbrales de alerta de comprobantes fiscales
 */
const FiscalReceiptsAlertSettings = ({
  taxReceipts = [],
  onConfigChange,
  disabled = false,
  initialConfig = null,
}: FiscalReceiptsAlertSettingsProps) => {
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(
    () => initialConfig?.alertsEnabled ?? true,
  );
  const [globalThresholds, setGlobalThresholds] = useState<ThresholdConfig>(
    () =>
      initialConfig?.globalThresholds ?? {
        warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
        critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
      },
  );

  const receiptTypesKey = useMemo(() => {
    const types = taxReceipts
      .map((receipt) => receipt.data?.name)
      .filter((name): name is string => Boolean(name));
    types.sort();
    return types.join('|');
  }, [taxReceipts]);

  const initialCustomThresholds = useMemo<CustomThresholds>(() => {
    const thresholds: CustomThresholds = {};
    taxReceipts.forEach((receipt) => {
      const receiptName = receipt.data?.name;
      if (receiptName) {
        thresholds[receiptName] = getThresholdsForReceiptType(receiptName);
      }
    });
    return thresholds;
  }, [taxReceipts]);

  const [{ trigger: customTrigger, value: customValue }, setCustomThresholdState] =
    useState<{ trigger: string; value: CustomThresholds }>(() => ({
      trigger: receiptTypesKey,
      value: initialConfig?.customThresholds ?? initialCustomThresholds,
    }));

  const customThresholds =
    customTrigger === receiptTypesKey ? customValue : initialCustomThresholds;

  const setCustomThresholds = useCallback(
    (value: CustomThresholds) =>
      setCustomThresholdState({ trigger: receiptTypesKey, value }),
    [receiptTypesKey],
  );

  const handleGlobalThresholdChange = (
    type: keyof ThresholdConfig,
    value: number | null,
  ) => {
    const newThresholds: ThresholdConfig = {
      ...globalThresholds,
      [type]: value,
    };
    setGlobalThresholds(newThresholds);

    if (onConfigChange) {
      onConfigChange({
        alertsEnabled,
        globalThresholds: newThresholds,
        customThresholds,
      });
    }
  };

  const handleCustomThresholdChange = (
    receiptName: string,
    type: keyof ThresholdConfig,
    value: number | null,
  ) => {
    const newCustomThresholds = {
      ...customThresholds,
      [receiptName]: {
        ...(customThresholds[receiptName] ?? {}),
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

  const handleAlertsToggle = (enabled: boolean) => {
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
    const types = new Set<string>();
    taxReceipts.forEach((receipt) => {
      const receiptName = receipt.data?.name;
      if (receiptName) {
        types.add(receiptName);
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
                  max={Number(globalThresholds.warning) - 1}
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
                          placeholder={
                            typeof globalThresholds.warning === 'number'
                              ? String(globalThresholds.warning)
                              : undefined
                          }
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
                            Number(
                              customConfig.warning || globalThresholds.warning,
                            ) - 1
                          }
                          disabled={disabled || !alertsEnabled}
                          addonAfter="comprobantes"
                          placeholder={
                            typeof globalThresholds.critical === 'number'
                              ? String(globalThresholds.critical)
                              : undefined
                          }
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
