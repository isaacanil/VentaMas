import { CheckCircleOutlined } from '@/constants/icons/antd';
import { Alert, Button, InputNumber, Spin, Switch, Typography } from 'antd';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { FISCAL_RECEIPTS_ALERT_CONFIG } from '@/config/fiscalReceiptsAlertConfig';
import { StatusBadge } from '@/components/ui/StatusBadge/StatusBadge';
import type { FiscalAlertsConfig } from '@/firebase/Settings/fiscalAlertsConfig/types';
import type { TaxReceiptDocument } from '@/types/taxReceipt';
import { processFiscalReceipts } from '@/utils/fiscalReceiptsUtils';

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

type PreviewTone = 'neutral' | 'success' | 'warning' | 'critical';
type FiscalReceiptsPreview = ReturnType<typeof processFiscalReceipts>;
type FiscalReceiptPreviewItem = FiscalReceiptsPreview['receipts'][number];

const EMPTY_TAX_RECEIPTS: TaxReceiptDocument[] = [];
const EMPTY_CUSTOM_THRESHOLDS: CustomThresholds = {};
const { Text } = Typography;

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
  taxReceipts?: TaxReceiptDocument[];
  disabled?: boolean;
  initialConfig?: Partial<FiscalReceiptsAlertConfigState> | null;
  loading?: boolean;
  saving?: boolean;
  onCancel?: () => void;
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

const formatSeriesAttentionLabel = (count: number) =>
  count === 1 ? '1 serie requiere atención' : `${count} series requieren atención`;

const formatDaysLabel = (days: number | null | undefined) => {
  const safeDays = typeof days === 'number' ? days : 0;
  return safeDays === 1 ? '1 día' : `${safeDays} días`;
};

const formatThresholdSummary = (
  thresholds: ThresholdConfig,
  unit: 'comprobantes' | 'días',
) => {
  const warning = thresholds.warning ?? 0;
  const critical = thresholds.critical ?? 0;

  if (unit === 'días') {
    return `Advierte ${warning} días antes, crítico ${critical} días antes`;
  }

  return `Advierte en ${warning}, crítico en ${critical}`;
};

const FiscalReceiptsAlertSettings = ({
  taxReceipts = EMPTY_TAX_RECEIPTS,
  disabled = false,
  initialConfig = null,
  loading = false,
  saving = false,
  onCancel,
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
  const [globalThresholds, setGlobalThresholds] = useState<ThresholdConfig>(
    baseGlobalThresholds,
  );
  const [expirationThresholds, setExpirationThresholds] =
    useState<ThresholdConfig>(baseExpirationThresholds);
  const [channels, setChannels] = useState<ChannelConfig>(
    () => initialConfig?.channels ?? DEFAULT_CHANNELS,
  );
  const [execution] = useState<ExecutionConfig>(
    () => initialConfig?.execution ?? DEFAULT_EXECUTION,
  );
  const [showCustomThresholds, setShowCustomThresholds] = useState<boolean>(
    () =>
      baseGlobalThresholds.warning !== RECOMMENDED_THRESHOLDS.quantity.warning ||
      baseGlobalThresholds.critical !== RECOMMENDED_THRESHOLDS.quantity.critical ||
      baseExpirationThresholds.warning !==
        RECOMMENDED_THRESHOLDS.expiration.warning ||
      baseExpirationThresholds.critical !==
        RECOMMENDED_THRESHOLDS.expiration.critical,
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

  const previewConfig = useMemo<FiscalAlertsConfig>(
    () => ({
      alertsEnabled,
      monitoring,
      globalThresholds: normalizeThresholdPair(
        globalThresholds,
        baseGlobalThresholds,
      ),
      customThresholds: EMPTY_CUSTOM_THRESHOLDS,
      expirationThresholds: normalizeThresholdPair(
        expirationThresholds,
        baseExpirationThresholds,
      ),
      customExpirationThresholds: EMPTY_CUSTOM_THRESHOLDS,
      channels,
      execution: {
        ...execution,
        checkFrequencyMinutes: Math.max(5, execution.checkFrequencyMinutes),
      },
      lastUpdated: null,
      version: '2.0',
    }),
    [
      alertsEnabled,
      monitoring,
      globalThresholds,
      baseGlobalThresholds,
      expirationThresholds,
      baseExpirationThresholds,
      channels,
      execution,
    ],
  );

  const preview = useMemo(() => {
    const analysis = processFiscalReceipts(taxReceipts, previewConfig);
    const nextExpiration = analysis.receipts
      .filter(
        (receipt) =>
          typeof receipt.daysUntilExpiration === 'number' &&
          receipt.daysUntilExpiration >= 0,
      )
      .sort(
        (left, right) =>
          (left.daysUntilExpiration ?? Number.POSITIVE_INFINITY) -
          (right.daysUntilExpiration ?? Number.POSITIVE_INFINITY),
      )[0];

    return {
      summary: analysis.summary,
      nextExpiration,
    };
  }, [previewConfig, taxReceipts]);

  const activeSignals = useMemo(() => {
    const signals: string[] = [];

    if (monitoring.quantityEnabled) signals.push('Cantidad');
    if (monitoring.expirationEnabled) signals.push('Vencimiento');

    return signals;
  }, [monitoring.expirationEnabled, monitoring.quantityEnabled]);

  const mainRisk = useMemo<FiscalReceiptPreviewItem | null>(() => {
    return preview.summary.mostCritical ?? preview.summary.lowestRemaining ?? null;
  }, [preview.summary.lowestRemaining, preview.summary.mostCritical]);

  const previewStatus = useMemo(() => {
    if (!alertsEnabled) {
      return {
        tone: 'neutral' as PreviewTone,
        label: 'Alertas apagadas',
        description: 'No se evaluarán series hasta volver a activarlas.',
        actionTitle: 'Qué haría ahora',
        actionDescription: 'Activa alertas para recuperar visibilidad sobre riesgo y vencimientos.',
      };
    }

    if (activeSignals.length === 0) {
      return {
        tone: 'warning' as PreviewTone,
        label: 'Sin reglas activas',
        description: 'No hay señales activas para monitorear las series.',
        actionTitle: 'Qué haría ahora',
        actionDescription: 'Activa cantidad, vencimiento o ambos para que el monitoreo tenga efecto.',
      };
    }

    if (!channels.notificationCenter) {
      return {
        tone: 'warning' as PreviewTone,
        label: 'Sin canal visible',
        description: 'Se evalúan las reglas, pero no verás alertas en la app.',
        actionTitle: 'Qué haría ahora',
        actionDescription: 'Vuelve a activar el centro de notificaciones para no perder visibilidad.',
      };
    }

    if (preview.summary.criticalReceipts > 0) {
      return {
        tone: 'critical' as PreviewTone,
        label: 'Atención inmediata',
        description: mainRisk
          ? mainRisk.primaryAlertReason === 'expiration'
            ? `${mainRisk.name} vence en ${mainRisk.daysUntilExpiration ?? 0} día(s).`
            : `${mainRisk.name} tiene ${mainRisk.remainingNumbers} comprobantes restantes.`
          : 'Hay series críticas que requieren acción.',
        actionTitle: 'Qué haría ahora',
        actionDescription:
          mainRisk?.primaryAlertReason === 'expiration'
            ? 'Revisa o registra la secuencia antes del vencimiento.'
            : 'Gestiona nueva numeración o ajusta la serie más comprometida.',
      };
    }

    if (preview.summary.warningReceipts > 0) {
      return {
        tone: 'warning' as PreviewTone,
        label: 'Revisión recomendada',
        description: `${preview.summary.warningReceipts} serie(s) se acercan al umbral configurado.`,
        actionTitle: 'Qué haría ahora',
        actionDescription:
          'Mantén los umbrales si quieres más anticipación o bájalos si hoy generan demasiado ruido.',
      };
    }

    return {
      tone: 'success' as PreviewTone,
      label: 'Cobertura saludable',
      description: 'No hay series en riesgo con la configuración actual.',
      actionTitle: 'Qué haría ahora',
      actionDescription: hasCustomThresholds
        ? 'Tus umbrales personalizados están cubriendo bien el escenario actual.'
        : 'La configuración recomendada cubre bien el escenario actual.',
    };
  }, [
    activeSignals.length,
    alertsEnabled,
    channels.notificationCenter,
    hasCustomThresholds,
    mainRisk,
    preview.summary.criticalReceipts,
    preview.summary.warningReceipts,
  ]);

  const handleThresholdChange = (
    setter: Dispatch<SetStateAction<ThresholdConfig>>,
    type: keyof ThresholdConfig,
    value: number | null,
  ) => {
    setter((prev) => ({ ...prev, [type]: value }));
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
      customThresholds: EMPTY_CUSTOM_THRESHOLDS,
      expirationThresholds: normalizeThresholdPair(
        expirationThresholds,
        baseExpirationThresholds,
      ),
      customExpirationThresholds: EMPTY_CUSTOM_THRESHOLDS,
      channels,
      execution: {
        ...execution,
        checkFrequencyMinutes: Math.max(5, execution.checkFrequencyMinutes),
      },
    });
  };

  return (
    <ConfigContainer>
      <Spin spinning={loading || saving}>
        <HeaderRow>
          <HeaderCopy>
            <SwitchLabel>Activar alertas de comprobantes</SwitchLabel>
            <Text type="secondary">
              Si las apagas, dejas de evaluar todas las series.
            </Text>
          </HeaderCopy>
          <Switch
            checked={alertsEnabled}
            onChange={setAlertsEnabled}
            disabled={disabled || loading || saving}
          />
        </HeaderRow>

        {!alertsEnabled && (
          <Alert
            message="Las alertas están desactivadas"
            description="Actívalas para volver a recibir alertas."
            type="info"
            showIcon
          />
        )}

        <ContentStack>
          <HeroCard>
            <SectionHeader>
              <div>
                <SectionTitle>Impacto actual</SectionTitle>
                <SectionDescription>
                  Vista previa según esta configuración.
                </SectionDescription>
              </div>
            </SectionHeader>

            <HeroLayout>
              <HeroMainColumn>
                <StatusMetaGrid>
                  <StatusMetaCard>
                    <StatusMetaLabel>Estado actual</StatusMetaLabel>
                    <StatusBadge
                      tone={
                        previewStatus.tone === 'critical'
                          ? 'danger'
                          : previewStatus.tone
                      }
                      label={previewStatus.label}
                    />
                  </StatusMetaCard>
                  <StatusMetaCard>
                    <StatusMetaLabel>Modo de umbral</StatusMetaLabel>
                    <SecondaryStatusPill>
                      {hasCustomThresholds
                        ? 'Personalizado'
                        : 'Recomendado'}
                    </SecondaryStatusPill>
                  </StatusMetaCard>
                </StatusMetaGrid>

                <PreviewStatusRow>
                  <PreviewHeadline>
                    {preview.summary.receiptsNeedingAttention > 0
                      ? formatSeriesAttentionLabel(
                          preview.summary.receiptsNeedingAttention,
                        )
                      : 'Todo en orden'}
                  </PreviewHeadline>
                  <PreviewSupport>{previewStatus.description}</PreviewSupport>
                </PreviewStatusRow>

                <PreviewMetrics>
                  <PreviewMetric>
                    <PreviewMetricLabel>Series activas</PreviewMetricLabel>
                    <PreviewMetricValue>
                      {preview.summary.activeReceipts}
                    </PreviewMetricValue>
                    <PreviewMetricSupport>
                      En monitoreo con esta configuración
                    </PreviewMetricSupport>
                  </PreviewMetric>
                  <PreviewMetric>
                    <PreviewMetricLabel>En atención</PreviewMetricLabel>
                    <PreviewMetricValue>
                      {preview.summary.receiptsNeedingAttention}
                    </PreviewMetricValue>
                    <PreviewMetricSupport>
                      Series en warning o crítico
                    </PreviewMetricSupport>
                  </PreviewMetric>
                  <PreviewMetric>
                    <PreviewMetricLabel>Próximo vencimiento</PreviewMetricLabel>
                    <PreviewMetricValue>
                      {preview.nextExpiration
                        ? `Vence en ${formatDaysLabel(
                            preview.nextExpiration.daysUntilExpiration,
                          )}`
                        : 'Sin dato'}
                    </PreviewMetricValue>
                    <PreviewMetricSupport>
                      {preview.nextExpiration
                        ? preview.nextExpiration.name
                        : 'No hay vencimientos próximos'}
                    </PreviewMetricSupport>
                  </PreviewMetric>
                  <PreviewMetric>
                    <PreviewMetricLabel>Monitoreo activo</PreviewMetricLabel>
                    <PreviewMetricValue>
                      {activeSignals.length > 0
                        ? `${activeSignals.length}/2`
                        : '0/2'}
                    </PreviewMetricValue>
                    <PreviewMetricSupport>
                      {activeSignals.length > 0
                        ? activeSignals.join(' + ')
                        : 'Sin señales activas'}
                    </PreviewMetricSupport>
                  </PreviewMetric>
                </PreviewMetrics>
              </HeroMainColumn>

              <InsightPanel>
                <InsightTitle>{previewStatus.actionTitle}</InsightTitle>
                <InsightDescription>
                  {previewStatus.actionDescription}
                </InsightDescription>

                <InsightList>
                  <InsightItem>
                    <InsightLabel>Mayor riesgo</InsightLabel>
                    <InsightValue>
                      {mainRisk
                        ? `${
                            mainRisk.primaryAlertReason === 'expiration'
                              ? `Vence en ${formatDaysLabel(mainRisk.daysUntilExpiration)}`
                              : `${mainRisk.remainingNumbers} comprobantes restantes`
                          } (${mainRisk.name})`
                        : 'Sin series comprometidas'}
                    </InsightValue>
                  </InsightItem>
                  <InsightItem>
                    <InsightLabel>Entrega</InsightLabel>
                    <InsightValue>
                      {channels.notificationCenter
                        ? 'Centro de notificaciones'
                        : 'Desactivada'}
                    </InsightValue>
                  </InsightItem>
                  <InsightItem>
                    <InsightLabel>Cantidad</InsightLabel>
                    <InsightValue>
                      {formatThresholdSummary(
                        previewConfig.globalThresholds,
                        'comprobantes',
                      )}
                    </InsightValue>
                  </InsightItem>
                  <InsightItem>
                    <InsightLabel>Vencimiento</InsightLabel>
                    <InsightValue>
                      {formatThresholdSummary(
                        previewConfig.expirationThresholds,
                        'días',
                      )}
                    </InsightValue>
                  </InsightItem>
                </InsightList>
              </InsightPanel>
            </HeroLayout>
          </HeroCard>

          <SectionCard>
            <SectionHeader>
              <div>
                <SectionTitle>Qué vigilar</SectionTitle>
                <SectionDescription>
                  Elige qué alertas activar.
                </SectionDescription>
              </div>
            </SectionHeader>

            <PreferenceGrid>
              <PreferenceCard>
                <PreferenceHeader>
                  <PreferenceTitle>Agotamiento por cantidad</PreferenceTitle>
                  <Switch
                    checked={monitoring.quantityEnabled}
                    onChange={(value) =>
                      setMonitoring((prev) => ({
                        ...prev,
                        quantityEnabled: value,
                      }))
                    }
                    disabled={isInteractionDisabled}
                  />
                </PreferenceHeader>
                <PreferenceDescription>
                  Usa el saldo restante de cada serie.
                </PreferenceDescription>
              </PreferenceCard>

              <PreferenceCard>
                <PreferenceHeader>
                  <PreferenceTitle>Vencimiento de autorización</PreferenceTitle>
                  <Switch
                    checked={monitoring.expirationEnabled}
                    onChange={(value) =>
                      setMonitoring((prev) => ({
                        ...prev,
                        expirationEnabled: value,
                      }))
                    }
                    disabled={isInteractionDisabled}
                  />
                </PreferenceHeader>
                <PreferenceDescription>
                  Usa la fecha de vencimiento registrada.
                </PreferenceDescription>
              </PreferenceCard>
            </PreferenceGrid>
          </SectionCard>

          <SectionCard>
            <SectionHeader>
              <div>
                <SectionTitle>Anticipación</SectionTitle>
                <SectionDescription>
                  Usa la recomendada o ajusta umbrales.
                </SectionDescription>
              </div>
            </SectionHeader>

            <ModeRow>
              <ModePill $tone={hasCustomThresholds ? 'custom' : 'recommended'}>
                {hasCustomThresholds
                  ? 'Configuración personalizada'
                  : 'Configuración recomendada'}
              </ModePill>
              <SectionActions>
                {hasCustomThresholds && (
                  <RecommendationActionButton
                    type="button"
                    onClick={resetToRecommended}
                    disabled={isInteractionDisabled}
                  >
                    Usar recomendada
                  </RecommendationActionButton>
                )}
                <SecondaryActionButton
                  type="button"
                  onClick={() => setShowCustomThresholds((prev) => !prev)}
                  disabled={isInteractionDisabled}
                >
                  {showCustomThresholds
                    ? 'Ocultar personalización'
                    : 'Personalizar umbrales'}
                </SecondaryActionButton>
              </SectionActions>
            </ModeRow>

            <RecommendationHint>
              Recomendación base: cantidad advierte en{' '}
              {RECOMMENDED_THRESHOLDS.quantity.warning} y crítico en{' '}
              {RECOMMENDED_THRESHOLDS.quantity.critical}; vencimiento advierte{' '}
              {RECOMMENDED_THRESHOLDS.expiration.warning} días antes y crítico{' '}
              {RECOMMENDED_THRESHOLDS.expiration.critical} días antes.
            </RecommendationHint>

            {showCustomThresholds && (
              <ThresholdStack>
                <ThresholdHint>
                  Usa advertencia para anticiparte y crítico para lo urgente.
                </ThresholdHint>
                <ThresholdGroup>
                  <CardSectionTitle>Cantidad restante</CardSectionTitle>
                  <ThresholdRow>
                    <ThresholdItem>
                      <FieldLabel $color="warning">Advertencia</FieldLabel>
                      <FieldControl>
                        <InputNumber
                          value={globalThresholds.warning}
                          onChange={(value) =>
                            handleThresholdChange(
                              setGlobalThresholds,
                              'warning',
                              value,
                            )
                          }
                          min={1}
                          max={1000}
                          disabled={
                            isInteractionDisabled || !monitoring.quantityEnabled
                          }
                        />
                        <FieldUnit>comprobantes</FieldUnit>
                      </FieldControl>
                    </ThresholdItem>

                    <ThresholdItem>
                      <FieldLabel $color="critical">Crítico</FieldLabel>
                      <FieldControl>
                        <InputNumber
                          value={globalThresholds.critical}
                          onChange={(value) =>
                            handleThresholdChange(
                              setGlobalThresholds,
                              'critical',
                              value,
                            )
                          }
                          min={1}
                          max={Math.max(
                            Number(globalThresholds.warning) - 1,
                            1,
                          )}
                          disabled={
                            isInteractionDisabled || !monitoring.quantityEnabled
                          }
                        />
                        <FieldUnit>comprobantes</FieldUnit>
                      </FieldControl>
                    </ThresholdItem>
                  </ThresholdRow>
                </ThresholdGroup>

                <ThresholdGroup>
                  <CardSectionTitle>Vencimiento</CardSectionTitle>
                  <ThresholdRow>
                    <ThresholdItem>
                      <FieldLabel $color="warning">Advertencia</FieldLabel>
                      <FieldControl>
                        <InputNumber
                          value={expirationThresholds.warning}
                          onChange={(value) =>
                            handleThresholdChange(
                              setExpirationThresholds,
                              'warning',
                              value,
                            )
                          }
                          min={1}
                          max={365}
                          disabled={
                            isInteractionDisabled ||
                            !monitoring.expirationEnabled
                          }
                        />
                        <FieldUnit>días</FieldUnit>
                      </FieldControl>
                    </ThresholdItem>

                    <ThresholdItem>
                      <FieldLabel $color="critical">Crítico</FieldLabel>
                      <FieldControl>
                        <InputNumber
                          value={expirationThresholds.critical}
                          onChange={(value) =>
                            handleThresholdChange(
                              setExpirationThresholds,
                              'critical',
                              value,
                            )
                          }
                          min={1}
                          max={Math.max(
                            Number(expirationThresholds.warning) - 1,
                            1,
                          )}
                          disabled={
                            isInteractionDisabled ||
                            !monitoring.expirationEnabled
                          }
                        />
                        <FieldUnit>días</FieldUnit>
                      </FieldControl>
                    </ThresholdItem>
                  </ThresholdRow>
                </ThresholdGroup>
              </ThresholdStack>
            )}
          </SectionCard>

          <SectionCard>
            <SectionHeader>
              <div>
                <SectionTitle>Entrega</SectionTitle>
                <SectionDescription>
                  Muestra alertas en el centro de notificaciones.
                </SectionDescription>
              </div>
            </SectionHeader>

            <PreferenceGrid>
              <PreferenceCard>
                <PreferenceHeader>
                  <PreferenceTitle>Centro de notificaciones</PreferenceTitle>
                  <Switch
                    checked={channels.notificationCenter}
                    onChange={(value) =>
                      setChannels((prev) => ({
                        ...prev,
                        notificationCenter: value,
                      }))
                    }
                    disabled={isInteractionDisabled}
                  />
                </PreferenceHeader>
                <PreferenceDescription>
                  Muestra series en riesgo.
                </PreferenceDescription>
              </PreferenceCard>
            </PreferenceGrid>

            {alertsEnabled && !channels.notificationCenter && (
              <Alert
                message="No hay un canal activo"
                description="Si dejas este canal apagado, no verás alertas de comprobantes en la aplicación."
                type="warning"
                showIcon
              />
            )}
          </SectionCard>
        </ContentStack>

        <ActionsRow>
          <Button onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            disabled={disabled || loading}
            icon={<CheckCircleOutlined />}
          >
            Guardar configuración
          </Button>
        </ActionsRow>
      </Spin>
    </ConfigContainer>
  );
};

const ConfigContainer = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

const HeaderRow = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: flex-start;
  justify-content: space-between;
`;

const HeaderCopy = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const ContentStack = styled.div`
  display: grid;
  gap: var(--ds-space-4);
  width: 100%;
`;

const SectionCard = styled.section`
  display: grid;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const HeroCard = styled(SectionCard)`
  background: var(--ds-color-bg-surface);
`;

const SectionHeader = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const SectionTitle = styled.h4`
  margin: 0;
  font-size: var(--ds-type-scale-section-title-size);
  font-weight: var(--ds-type-scale-section-title-weight);
  line-height: var(--ds-type-scale-section-title-line-height);
  color: var(--ds-color-text-primary);
`;

const SectionDescription = styled.p`
  margin: 0;
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const PreviewStatusRow = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const PreviewHeadline = styled.h5`
  margin: 0;
  font-size: var(--ds-type-scale-section-title-size);
  font-weight: var(--ds-type-scale-section-title-weight);
  line-height: var(--ds-type-scale-section-title-line-height);
  color: var(--ds-color-text-primary);
`;

const PreviewSupport = styled.p`
  margin: 0;
  font-size: var(--ds-type-scale-body-size);
  line-height: var(--ds-type-scale-body-line-height);
  color: var(--ds-color-text-secondary);
`;

const PreviewMetrics = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
`;

const PreviewMetric = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);
`;

const PreviewMetricLabel = styled.span`
  font-size: var(--ds-type-scale-caption-size);
  line-height: var(--ds-type-scale-caption-line-height);
  color: var(--ds-color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
`;

const PreviewMetricValue = styled.span`
  font-size: var(--ds-type-scale-heading-size);
  font-weight: var(--ds-type-scale-heading-weight);
  line-height: var(--ds-type-scale-heading-line-height);
  color: var(--ds-color-text-primary);
`;

const PreviewMetricSupport = styled.span`
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const ThresholdRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-4);

  @media (width <= 768px) {
    flex-direction: column;
    gap: var(--ds-space-3);
  }
`;

const ThresholdItem = styled.div`
  display: grid;
  flex: 1;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const FieldLabel = styled.span<{ $color?: 'warning' | 'critical' }>`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  font-size: var(--ds-type-scale-label-size);
  font-weight: var(--ds-type-scale-label-weight);
  line-height: var(--ds-type-scale-label-line-height);
  color: var(--ds-color-text-secondary);

  &::before {
    content: ${({ $color }) => ($color ? "''" : 'none')};
    display: inline-block;
    width: var(--ds-space-2);
    height: var(--ds-space-2);
    border-radius: 50%;
    background: ${({ $color }) =>
      $color === 'warning'
        ? 'var(--ds-color-state-warning)'
        : $color === 'critical'
          ? 'var(--ds-color-state-danger)'
          : 'transparent'};
  }
`;

const SwitchLabel = styled.span`
  font-size: var(--ds-type-scale-heading-size);
  font-weight: var(--ds-type-scale-heading-weight);
  line-height: var(--ds-type-scale-heading-line-height);
  color: var(--ds-color-text-primary);
`;

const HeroLayout = styled.div`
  display: grid;
  gap: var(--ds-space-4);

  @media (width >= 960px) {
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr);
    align-items: stretch;
  }
`;

const HeroMainColumn = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

const StatusMetaGrid = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`;

const StatusMetaCard = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);
`;

const StatusMetaLabel = styled.span`
  font-size: var(--ds-type-scale-caption-size);
  line-height: var(--ds-type-scale-caption-line-height);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ds-color-text-muted);
`;

const SecondaryStatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: var(--ds-space-2) var(--ds-space-3);
  font-size: var(--ds-type-scale-label-size);
  font-weight: var(--ds-type-scale-label-weight);
  line-height: var(--ds-type-scale-label-line-height);
  color: var(--ds-color-text-secondary);
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-pill);
`;

const PreferenceGrid = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

const PreferenceCard = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);
`;

const PreferenceHeader = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: flex-start;
  justify-content: space-between;
`;

const PreferenceTitle = styled.h5`
  margin: 0;
  font-size: var(--ds-type-scale-heading-size);
  font-weight: var(--ds-type-scale-heading-weight);
  line-height: var(--ds-type-scale-heading-line-height);
  color: var(--ds-color-text-primary);
`;

const PreferenceDescription = styled.p`
  margin: 0;
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const InsightPanel = styled.aside`
  display: grid;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);
  align-content: start;
`;

const InsightTitle = styled.h5`
  margin: 0;
  font-size: var(--ds-type-scale-heading-size);
  font-weight: var(--ds-type-scale-heading-weight);
  line-height: var(--ds-type-scale-heading-line-height);
  color: var(--ds-color-text-primary);
`;

const InsightDescription = styled.p`
  margin: 0;
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const InsightList = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const InsightItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  padding-top: var(--ds-space-2);
  border-top: 1px solid var(--ds-color-border-subtle);
`;

const InsightLabel = styled.span`
  font-size: var(--ds-type-scale-caption-size);
  line-height: var(--ds-type-scale-caption-line-height);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ds-color-text-muted);
`;

const InsightValue = styled.span`
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-primary);
`;

const ModeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: space-between;
`;

const ModePill = styled.span<{ $tone: 'recommended' | 'custom' }>`
  display: inline-flex;
  align-items: center;
  padding: var(--ds-space-2) var(--ds-space-3);
  font-size: var(--ds-type-scale-label-size);
  font-weight: var(--ds-type-scale-label-weight);
  line-height: var(--ds-type-scale-label-line-height);
  color:
    ${({ $tone }) =>
      $tone === 'recommended'
        ? 'var(--ds-color-text-primary)'
        : 'var(--ds-color-state-warning-text)'};
  background:
    ${({ $tone }) =>
      $tone === 'recommended'
        ? 'var(--ds-color-bg-subtle)'
        : 'var(--ds-color-state-warning-bg)'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'recommended'
        ? 'var(--ds-color-border-default)'
        : 'var(--ds-color-state-warning-border)'};
  border-radius: var(--ds-radius-pill);
`;

const SectionActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
`;

const SecondaryActionButton = styled.button`
  justify-self: start;
  padding: var(--ds-space-2) var(--ds-space-3);
  font-size: var(--ds-type-scale-label-size);
  font-weight: var(--ds-type-scale-label-weight);
  line-height: var(--ds-type-scale-label-line-height);
  color: var(--ds-color-text-primary);
  cursor: pointer;
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  transition:
    background-color 120ms ease,
    border-color 120ms ease;

  &:hover:not(:disabled) {
    background: var(--ds-color-bg-surface);
    border-color: var(--ds-color-border-strong);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const RecommendationActionButton = styled(SecondaryActionButton)`
  color: var(--ds-color-state-info-text);
  background: var(--ds-color-state-info-subtle);
  border-color: var(--ds-color-state-info);

  &:hover:not(:disabled) {
    background: var(--ds-color-bg-surface);
    border-color: var(--ds-color-state-info);
  }
`;

const ThresholdStack = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

const RecommendationHint = styled.p`
  margin: 0;
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const ThresholdHint = styled.p`
  margin: 0;
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const FieldControl = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  align-items: center;

  .ant-input-number {
    flex: 0 0 120px;
  }
`;

const FieldUnit = styled.span`
  font-size: var(--ds-type-scale-body-small-size);
  line-height: var(--ds-type-scale-body-small-line-height);
  color: var(--ds-color-text-secondary);
`;

const ThresholdGroup = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  padding-top: var(--ds-space-2);
  border-top: 1px solid var(--ds-color-border-subtle);
`;

const CardSectionTitle = styled.span`
  font-size: var(--ds-type-scale-table-header-size);
  font-weight: var(--ds-type-scale-table-header-weight);
  line-height: var(--ds-type-scale-table-header-line-height);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ds-color-text-muted);
`;

const ActionsRow = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  justify-content: flex-end;
`;

export default FiscalReceiptsAlertSettings;
