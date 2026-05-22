import {
  ExclamationCircleOutlined,
  WarningOutlined,
} from '@/constants/icons/antd';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { VmButton, VmNumberField, VmSwitch } from '@/components/heroui';
import { FISCAL_RECEIPTS_ALERT_CONFIG } from '@/config/fiscalReceiptsAlertConfig';
import type { FiscalAlertsConfig } from '@/firebase/Settings/fiscalAlertsConfig/types';

type ThresholdConfig = {
  warning: number | null;
  critical: number | null;
};

type CustomThresholdConfig = Partial<ThresholdConfig>;
type CustomThresholds = Record<string, CustomThresholdConfig>;

type MonitoringConfig = {
  quantityEnabled: boolean;
  expirationEnabled: boolean;
};

type ChannelConfig = {
  notificationCenter: boolean;
  popupOnCritical: boolean;
  email: boolean;
};

type ExecutionConfig = {
  checkFrequencyMinutes: number;
  suppressRepeatedNotifications: boolean;
};

const EMPTY_CUSTOM_THRESHOLDS: CustomThresholds = {};
export const FISCAL_RECEIPTS_ALERT_SETTINGS_FORM_ID =
  'fiscal-receipts-alert-settings-form';

const RECOMMENDED_THRESHOLDS = {
  quantity: { warning: 100, critical: 50 },
  expiration: { warning: 30, critical: 7 },
} as const;

export interface FiscalReceiptsAlertConfigState {
  alertsEnabled: boolean;
  monitoring: MonitoringConfig;
  globalThresholds: ThresholdConfig;
  customThresholds: CustomThresholds;
  expirationThresholds: ThresholdConfig;
  customExpirationThresholds: CustomThresholds;
  channels: ChannelConfig;
  execution: ExecutionConfig;
}

interface FiscalReceiptsAlertSettingsProps {
  disabled?: boolean;
  initialConfig?: Partial<FiscalReceiptsAlertConfigState> | null;
  loading?: boolean;
  saving?: boolean;
  onSave?: (config: FiscalReceiptsAlertConfigState) => Promise<void> | void;
}

const DEFAULT_MONITORING: MonitoringConfig = {
  quantityEnabled: true,
  expirationEnabled: true,
};

const DEFAULT_CHANNELS: ChannelConfig = {
  notificationCenter: true,
  popupOnCritical: true,
  email: false,
};

const DEFAULT_EXECUTION: ExecutionConfig = {
  checkFrequencyMinutes:
    FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CHECK_FREQUENCY_MINUTES,
  suppressRepeatedNotifications: true,
};

const resolveThresholdValue = (
  value: number | null | undefined,
  fallback: number,
) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

const normalizeThresholdPair = (
  threshold: ThresholdConfig,
  fallback: ThresholdConfig,
) => {
  const warning = Math.max(
    1,
    resolveThresholdValue(threshold.warning, fallback.warning),
  );
  const critical = Math.min(
    Math.max(1, resolveThresholdValue(threshold.critical, fallback.critical)),
    Math.max(warning - 1, 1),
  );

  return { warning, critical };
};

const FiscalReceiptsAlertSettings = ({
  disabled = false,
  initialConfig = null,
  loading = false,
  saving = false,
  onSave,
}: FiscalReceiptsAlertSettingsProps) => {
  const baseGlobalThresholds = useMemo<ThresholdConfig>(
    () => ({
      warning:
        initialConfig?.globalThresholds?.warning ??
        FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
      critical:
        initialConfig?.globalThresholds?.critical ??
        FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
    }),
    [initialConfig],
  );

  const baseExpirationThresholds = useMemo<ThresholdConfig>(
    () => ({
      warning:
        initialConfig?.expirationThresholds?.warning ??
        FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_EXPIRATION_WARNING_DAYS,
      critical:
        initialConfig?.expirationThresholds?.critical ??
        FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_EXPIRATION_CRITICAL_DAYS,
    }),
    [initialConfig],
  );

  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(
    () => initialConfig?.alertsEnabled ?? true,
  );
  const [monitoring, setMonitoring] = useState<MonitoringConfig>(
    () => initialConfig?.monitoring ?? DEFAULT_MONITORING,
  );
  const [globalThresholds, setGlobalThresholds] =
    useState<ThresholdConfig>(baseGlobalThresholds);
  const [expirationThresholds, setExpirationThresholds] =
    useState<ThresholdConfig>(baseExpirationThresholds);
  const [channels] = useState<ChannelConfig>(
    () => initialConfig?.channels ?? DEFAULT_CHANNELS,
  );
  const [execution] = useState<ExecutionConfig>(
    () => initialConfig?.execution ?? DEFAULT_EXECUTION,
  );

  const isInteractionDisabled = disabled || loading || saving || !alertsEnabled;

  const hasCustomThresholds = useMemo(
    () =>
      globalThresholds.warning !== RECOMMENDED_THRESHOLDS.quantity.warning ||
      globalThresholds.critical !== RECOMMENDED_THRESHOLDS.quantity.critical ||
      expirationThresholds.warning !==
        RECOMMENDED_THRESHOLDS.expiration.warning ||
      expirationThresholds.critical !==
        RECOMMENDED_THRESHOLDS.expiration.critical,
    [expirationThresholds, globalThresholds],
  );

  const handleThresholdChange = (
    setter: Dispatch<SetStateAction<ThresholdConfig>>,
    type: keyof ThresholdConfig,
    value: number | string | null,
  ) => {
    const numericValue = typeof value === 'string' ? Number(value) : value;
    const safeValue =
      typeof numericValue === 'number' && Number.isFinite(numericValue)
        ? numericValue
        : null;

    setter((prev) => ({ ...prev, [type]: safeValue }));
  };

  const resetToRecommended = () => {
    setGlobalThresholds({ ...RECOMMENDED_THRESHOLDS.quantity });
    setExpirationThresholds({ ...RECOMMENDED_THRESHOLDS.expiration });
  };

  const handleSave = async () => {
    if (!onSave) return;

    await onSave({
      alertsEnabled,
      monitoring,
      globalThresholds: normalizeThresholdPair(
        globalThresholds,
        baseGlobalThresholds,
      ),
      customThresholds:
        EMPTY_CUSTOM_THRESHOLDS as FiscalAlertsConfig['customThresholds'],
      expirationThresholds: normalizeThresholdPair(
        expirationThresholds,
        baseExpirationThresholds,
      ),
      customExpirationThresholds:
        EMPTY_CUSTOM_THRESHOLDS as FiscalAlertsConfig['customExpirationThresholds'],
      channels,
      execution: {
        ...execution,
        checkFrequencyMinutes: Math.max(5, execution.checkFrequencyMinutes),
      },
    });
  };

  return (
    <ConfigContainer
      id={FISCAL_RECEIPTS_ALERT_SETTINGS_FORM_ID}
      aria-busy={loading || saving}
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
    >
      <ContentStack>
        <SettingsHeader>
          <ModalSubtitle>Alertar por cantidad o vencimiento</ModalSubtitle>

          <HeaderControls>
            <StatusText $active={alertsEnabled}>
              {alertsEnabled ? 'Activo' : 'Inactivo'}
            </StatusText>
            <CompactSwitch
              aria-label="Activar alertas de comprobantes"
              isSelected={alertsEnabled}
              onChange={setAlertsEnabled}
              isDisabled={disabled || loading || saving}
            />
          </HeaderControls>
        </SettingsHeader>

        <PanelBody>
          <SectionBlock>
            <SectionEyebrow>Qué vigilar</SectionEyebrow>
            <ToggleList>
              <ToggleRow>
                <ToggleCopy>
                  <ToggleTitle>Agotamiento por cantidad</ToggleTitle>
                  <ToggleDescription>
                    Usa el saldo restante de cada serie
                  </ToggleDescription>
                </ToggleCopy>
                <CompactSwitch
                  aria-label="Monitorear agotamiento por cantidad"
                  isSelected={monitoring.quantityEnabled}
                  onChange={(value) =>
                    setMonitoring((prev) => ({
                      ...prev,
                      quantityEnabled: value,
                    }))
                  }
                  isDisabled={isInteractionDisabled}
                />
              </ToggleRow>

              <ToggleRow>
                <ToggleCopy>
                  <ToggleTitle>Vencimiento de autorización</ToggleTitle>
                  <ToggleDescription>
                    Usa la fecha de vencimiento registrada
                  </ToggleDescription>
                </ToggleCopy>
                <CompactSwitch
                  aria-label="Monitorear vencimiento de autorización"
                  isSelected={monitoring.expirationEnabled}
                  onChange={(value) =>
                    setMonitoring((prev) => ({
                      ...prev,
                      expirationEnabled: value,
                    }))
                  }
                  isDisabled={isInteractionDisabled}
                />
              </ToggleRow>
            </ToggleList>
          </SectionBlock>

          <SectionBlock>
            <SectionEyebrow>Umbrales de alerta</SectionEyebrow>

            <ThresholdGroup>
              <ThresholdGroupTitle>Comprobantes restantes</ThresholdGroupTitle>
              <ThresholdRow>
                <ThresholdItem>
                  <FieldLabel>Advertencia</FieldLabel>
                  <ThresholdControl $tone="warning">
                    <ThresholdControlIcon $tone="warning">
                      <ExclamationCircleOutlined />
                    </ThresholdControlIcon>
                    <ThresholdNumber
                      aria-label="Advertencia de comprobantes restantes"
                      value={globalThresholds.warning ?? undefined}
                      onChange={(value) =>
                        handleThresholdChange(
                          setGlobalThresholds,
                          'warning',
                          value,
                        )
                      }
                      minValue={1}
                      maxValue={1000}
                      isDisabled={
                        isInteractionDisabled || !monitoring.quantityEnabled
                      }
                    >
                      <ThresholdNumberGroup>
                        <ThresholdNumberInput />
                      </ThresholdNumberGroup>
                    </ThresholdNumber>
                    <FieldUnit>uds</FieldUnit>
                  </ThresholdControl>
                </ThresholdItem>

                <ThresholdItem>
                  <FieldLabel>Crítico</FieldLabel>
                  <ThresholdControl $tone="critical">
                    <ThresholdControlIcon $tone="critical">
                      <WarningOutlined />
                    </ThresholdControlIcon>
                    <ThresholdNumber
                      aria-label="Crítico de comprobantes restantes"
                      value={globalThresholds.critical ?? undefined}
                      onChange={(value) =>
                        handleThresholdChange(
                          setGlobalThresholds,
                          'critical',
                          value,
                        )
                      }
                      minValue={1}
                      maxValue={Math.max(
                        Number(globalThresholds.warning) - 1,
                        1,
                      )}
                      isDisabled={
                        isInteractionDisabled || !monitoring.quantityEnabled
                      }
                    >
                      <ThresholdNumberGroup>
                        <ThresholdNumberInput />
                      </ThresholdNumberGroup>
                    </ThresholdNumber>
                    <FieldUnit>uds</FieldUnit>
                  </ThresholdControl>
                </ThresholdItem>
              </ThresholdRow>
            </ThresholdGroup>

            <ThresholdGroup>
              <ThresholdGroupTitle>
                Días antes del vencimiento
              </ThresholdGroupTitle>
              <ThresholdRow>
                <ThresholdItem>
                  <FieldLabel>Advertencia</FieldLabel>
                  <ThresholdControl $tone="warning">
                    <ThresholdControlIcon $tone="warning">
                      <ExclamationCircleOutlined />
                    </ThresholdControlIcon>
                    <ThresholdNumber
                      aria-label="Advertencia de días antes del vencimiento"
                      value={expirationThresholds.warning ?? undefined}
                      onChange={(value) =>
                        handleThresholdChange(
                          setExpirationThresholds,
                          'warning',
                          value,
                        )
                      }
                      minValue={1}
                      maxValue={365}
                      isDisabled={
                        isInteractionDisabled || !monitoring.expirationEnabled
                      }
                    >
                      <ThresholdNumberGroup>
                        <ThresholdNumberInput />
                      </ThresholdNumberGroup>
                    </ThresholdNumber>
                    <FieldUnit>días</FieldUnit>
                  </ThresholdControl>
                </ThresholdItem>

                <ThresholdItem>
                  <FieldLabel>Crítico</FieldLabel>
                  <ThresholdControl $tone="critical">
                    <ThresholdControlIcon $tone="critical">
                      <WarningOutlined />
                    </ThresholdControlIcon>
                    <ThresholdNumber
                      aria-label="Crítico de días antes del vencimiento"
                      value={expirationThresholds.critical ?? undefined}
                      onChange={(value) =>
                        handleThresholdChange(
                          setExpirationThresholds,
                          'critical',
                          value,
                        )
                      }
                      minValue={1}
                      maxValue={Math.max(
                        Number(expirationThresholds.warning) - 1,
                        1,
                      )}
                      isDisabled={
                        isInteractionDisabled || !monitoring.expirationEnabled
                      }
                    >
                      <ThresholdNumberGroup>
                        <ThresholdNumberInput />
                      </ThresholdNumberGroup>
                    </ThresholdNumber>
                    <FieldUnit>días</FieldUnit>
                  </ThresholdControl>
                </ThresholdItem>
              </ThresholdRow>
            </ThresholdGroup>
          </SectionBlock>
          <BodyActions>
            <RestoreButton
              variant="outline"
              size="sm"
              onPress={resetToRecommended}
              isDisabled={isInteractionDisabled || !hasCustomThresholds}
            >
              Restaurar recomendados
            </RestoreButton>
          </BodyActions>
        </PanelBody>
      </ContentStack>
    </ConfigContainer>
  );
};

const ConfigContainer = styled.form`
  display: block;
`;

const ContentStack = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

const SettingsHeader = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-3);
  align-items: center;
`;

const ModalSubtitle = styled.p`
  margin: 0;
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const HeaderControls = styled.div`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  min-height: 28px;
`;

const CompactSwitch = styled(VmSwitch)`
  [data-slot='switch-control'] {
    width: 32px;
    height: 18px;
    padding: 2px;
  }

  [data-slot='switch-thumb'] {
    flex-basis: 12px;
    width: 12px;
    min-width: 12px;
    height: 12px;
  }

  &&[data-selected='true'] [data-slot='switch-thumb'],
  &&[aria-checked='true'] [data-slot='switch-thumb'] {
    transform: translateX(14px);
  }
`;

const StatusText = styled.span<{ $active: boolean }>`
  font-size: var(--ds-type-scale-caption-size);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-type-scale-caption-line-height);
  color: ${({ $active }) =>
    $active ? 'var(--ds-color-text-secondary)' : 'var(--ds-color-text-muted)'};
`;

const PanelBody = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

const SectionBlock = styled.section`
  display: grid;
  gap: var(--ds-space-3);
  padding-top: var(--ds-space-3);

  & + & {
    border-top: 1px solid var(--ds-color-border-subtle);
  }
`;

const SectionEyebrow = styled.h5`
  margin: 0;
  font-size: var(--ds-type-scale-caption-size);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-type-scale-caption-line-height);
  color: var(--ds-color-text-muted);
  letter-spacing: 0;
  text-transform: uppercase;
`;

const ToggleList = styled.div`
  display: grid;
`;

const ToggleRow = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: space-between;
  min-height: 48px;

  & + & {
    border-top: 1px solid var(--ds-color-border-subtle);
  }
`;

const ToggleCopy = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const ToggleTitle = styled.span`
  font-size: var(--ds-type-scale-label-size);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-type-scale-label-line-height);
  color: var(--ds-color-text-primary);
`;

const ToggleDescription = styled.span`
  font-size: var(--ds-type-scale-caption-size);
  line-height: var(--ds-type-scale-caption-line-height);
  color: var(--ds-color-text-secondary);
`;

const ThresholdGroup = styled.div`
  display: grid;
  gap: var(--ds-space-2);

  & + & {
    margin-top: var(--ds-space-1);
  }
`;

const ThresholdGroupTitle = styled.span`
  font-size: var(--ds-type-scale-caption-size);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-type-scale-caption-line-height);
  color: var(--ds-color-text-secondary);
`;

const ThresholdRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-2);
`;

const ThresholdItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const FieldLabel = styled.span`
  font-size: var(--ds-type-scale-caption-size);
  line-height: var(--ds-type-scale-caption-line-height);
  color: var(--ds-color-text-muted);
`;

const ThresholdControl = styled.div<{ $tone: 'warning' | 'critical' }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--ds-space-2);
  align-items: center;
  min-height: 46px;
  padding: 0 var(--ds-space-3);
  background: ${({ $tone }) =>
    $tone === 'critical'
      ? 'var(--ds-color-state-danger-subtle)'
      : 'var(--ds-color-state-warning-subtle)'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'critical'
        ? 'var(--ds-color-state-danger)'
        : 'var(--ds-color-state-warning)'};
  border-radius: var(--ds-radius-md);
`;

const ThresholdControlIcon = styled.span<{ $tone: 'warning' | 'critical' }>`
  display: inline-flex;
  color: ${({ $tone }) =>
    $tone === 'critical'
      ? 'var(--ds-color-state-danger-text)'
      : 'var(--ds-color-state-warning-text)'};
`;

const ThresholdNumber = styled(VmNumberField)`
  width: 100%;
  min-width: 0;
`;

const ThresholdNumberGroup = styled(VmNumberField.Group)`
  min-height: 28px;
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
`;

const ThresholdNumberInput = styled(VmNumberField.Input)`
  width: 100%;
  min-width: 0;
  padding: 0;
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
  background: transparent;
  border: 0;
  font-variant-numeric: tabular-nums;
`;

const FieldUnit = styled.span`
  font-size: var(--ds-type-scale-caption-size);
  line-height: var(--ds-type-scale-caption-line-height);
  color: var(--ds-color-text-muted);
`;

const BodyActions = styled.div`
  display: flex;
  justify-content: flex-start;
  padding-top: var(--ds-space-2);
`;

const RestoreButton = styled(VmButton)`
  && {
    height: auto;
    min-height: 0;
    justify-self: start;
    padding: 0;
    font-size: var(--ds-type-scale-body-small-size);
    line-height: var(--ds-type-scale-body-small-line-height);
    color: var(--ds-color-text-secondary);
    text-decoration: underline;
    background: transparent;
    border: 0;
  }

  &&:hover:not([data-disabled='true']) {
    color: var(--ds-color-text-primary);
    background: transparent;
  }
`;

export default FiscalReceiptsAlertSettings;
