import { useMemo, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';

import { createDefaultFiscalAlertsConfig } from '@/config/fiscalReceiptsAlertConfig';
import { selectUser } from '@/features/auth/userSlice';
import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { fbGetFiscalAlertsConfig } from '@/firebase/Settings/fiscalAlertsConfig/fbGetFiscalAlertsConfig';
import type {
  FiscalAlertsConfig,
  FiscalAlertThresholds,
} from '@/firebase/Settings/fiscalAlertsConfig/types';
import { useFbGetTaxReceipt } from '@/firebase/taxReceipt/fbGetTaxReceipt';
import type { TaxReceiptDocument } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';
import {
  generateFiscalReceiptsWidgetData,
  processFiscalReceipts,
} from '@/utils/fiscalReceiptsUtils';

type FiscalAlertLevel = 'critical' | 'warning' | 'normal';

type FiscalReceiptStatus = {
  id?: string;
  name: string;
  series: string;
  totalNumbers: number;
  usedNumbers: number;
  remainingNumbers: number;
  percentageRemaining: number;
  alertLevel: FiscalAlertLevel;
  isActive: boolean;
  needsAttention: boolean;
  thresholds?: FiscalAlertThresholds;
  primaryAlertReason?: 'quantity' | 'expiration' | null;
  daysUntilExpiration?: number | null;
  expirationDate?: string | null;
  [key: string]: unknown;
};

type FiscalReceiptsSummary = {
  totalReceipts: number;
  activeReceipts: number;
  receiptsNeedingAttention: number;
  criticalReceipts: number;
  warningReceipts: number;
  totalRemaining: number;
  lowestRemaining: FiscalReceiptStatus | null;
  mostCritical: FiscalReceiptStatus | null;
};

type FiscalReceiptsAnalysis = {
  receipts: FiscalReceiptStatus[];
  summary: FiscalReceiptsSummary;
};

type FiscalReceiptsWidgetData = {
  title: string;
  alertType: string;
  message: string;
  percentage: number;
  seriesInfo: string;
  hasIssues: boolean;
  [key: string]: unknown;
};

type FiscalReceiptsState = {
  hasIssues: boolean;
  hasChanges: boolean;
  isLoading?: boolean;
  isEnabled?: boolean;
  configLoaded?: boolean;
  widgetData: FiscalReceiptsWidgetData;
  analysis: FiscalReceiptsAnalysis;
};

/**
 * Hook personalizado para manejar las alertas de comprobantes fiscales
 * @returns {Object} Estado y funciones para manejar alertas de comprobantes
 */
export const useFiscalReceiptsAlerts = () => {
  const { taxReceipt, isLoading } = useFbGetTaxReceipt();
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessId = user?.businessID ?? null;
  const [shouldShowNotification, setShouldShowNotification] = useState(false);
  const [alertConfig, setAlertConfig] = useState<FiscalAlertsConfig | null>(
    null,
  );
  const [loadingConfig, setLoadingConfig] = useState(true);

  const lastCheckRef = useRef<FiscalReceiptStatus | null>(null);
  const lastNotificationKeyRef = useRef<string | null>(null);
  const lastNotificationAtRef = useRef<number>(0);

  // Cargar configuración de alertas personalizada
  useEffect(() => {
    const loadAlertConfig = async () => {
      if (businessId || user?.id) {
        try {
          setLoadingConfig(true);
          const config = await fbGetFiscalAlertsConfig({
            id: user?.id ?? null,
            businessID: businessId,
          });
          setAlertConfig(config);
        } catch (error) {
          console.error('Error al cargar configuración de alertas:', error);
          setAlertConfig(createDefaultFiscalAlertsConfig());
        } finally {
          setLoadingConfig(false);
        }
      } else {
        setAlertConfig(createDefaultFiscalAlertsConfig());
        setLoadingConfig(false);
      }
    };

    loadAlertConfig();
  }, [businessId, user?.id]);

  // Procesar datos de comprobantes fiscales con configuración personalizada
  const fiscalData = useMemo<FiscalReceiptsState>(() => {
    // Si aún está cargando la configuración, mostrar estado de carga
    if (loadingConfig) {
      return {
        hasIssues: false,
        hasChanges: false,
        isLoading: true,
        widgetData: {
          title: 'Comprobantes Fiscales',
          alertType: 'info',
          message: 'Cargando configuración de alertas...',
          percentage: 0,
          seriesInfo: 'Cargando...',
          hasIssues: false,
        },
        analysis: {
          receipts: [],
          summary: {
            totalReceipts: 0,
            activeReceipts: 0,
            receiptsNeedingAttention: 0,
            criticalReceipts: 0,
            warningReceipts: 0,
            totalRemaining: 0,
            lowestRemaining: null,
            mostCritical: null,
          },
        },
      };
    }

    if (!taxReceiptEnabled || !taxReceipt?.length) {
      return {
        hasIssues: false,
        hasChanges: false,
        widgetData: {
          title: 'Comprobantes Fiscales',
          alertType: 'info',
          message:
            'Los comprobantes fiscales están deshabilitados o no configurados.',
          percentage: 0,
          seriesInfo: 'No configurado',
          hasIssues: false,
        },
        analysis: {
          receipts: [],
          summary: {
            totalReceipts: 0,
            activeReceipts: 0,
            receiptsNeedingAttention: 0,
            criticalReceipts: 0,
            warningReceipts: 0,
            totalRemaining: 0,
            lowestRemaining: null,
            mostCritical: null,
          },
        },
      };
    }

    // Verificar si las alertas están habilitadas en la configuración
    if (alertConfig && !alertConfig.alertsEnabled) {
      return {
        hasIssues: false,
        hasChanges: false,
        widgetData: {
          title: 'Comprobantes Fiscales',
          alertType: 'info',
          message: 'Las alertas de comprobantes están desactivadas.',
          percentage: 0,
          seriesInfo: 'Alertas desactivadas',
          hasIssues: false,
        },
        analysis: {
          receipts: [],
          summary: {
            totalReceipts: 0,
            activeReceipts: 0,
            receiptsNeedingAttention: 0,
            criticalReceipts: 0,
            warningReceipts: 0,
            totalRemaining: 0,
            lowestRemaining: null,
            mostCritical: null,
          },
        },
      };
    }

    // Procesar con configuración personalizada
    const analysis = processFiscalReceipts(
      taxReceipt as TaxReceiptDocument[],
      alertConfig,
    ) as FiscalReceiptsAnalysis;
    const widgetData = generateFiscalReceiptsWidgetData(
      taxReceipt as TaxReceiptDocument[],
      alertConfig,
    ) as FiscalReceiptsWidgetData;
    const hasIssues = analysis.summary.receiptsNeedingAttention > 0;

    // Detectar si hay cambios desde la última verificación usando ref
    const currentMostCritical = analysis.summary.mostCritical;
    const hasChanges =
      Boolean(
        lastCheckRef.current &&
          currentMostCritical &&
          (lastCheckRef.current.remainingNumbers !==
            currentMostCritical.remainingNumbers ||
            lastCheckRef.current.alertLevel !== currentMostCritical.alertLevel ||
            lastCheckRef.current.primaryAlertReason !==
              currentMostCritical.primaryAlertReason ||
            lastCheckRef.current.daysUntilExpiration !==
              currentMostCritical.daysUntilExpiration),
      );

    return {
      hasIssues,
      hasChanges,
      widgetData,
      analysis,
      isEnabled: taxReceiptEnabled,
      isLoading: false,
      configLoaded: true,
    };
  }, [taxReceipt, taxReceiptEnabled, alertConfig, loadingConfig]);

  // Efecto para manejar notificaciones automáticas
  useEffect(() => {
    if (!alertConfig?.channels.popupOnCritical) {
      setShouldShowNotification(false);
      return;
    }

    if (!fiscalData.hasIssues) {
      lastNotificationKeyRef.current = null;
      setShouldShowNotification(false);
      return;
    }

    const mostCritical = fiscalData.analysis.summary.mostCritical;

    if (!mostCritical || mostCritical.alertLevel !== 'critical') {
      return;
    }

    const now = Date.now();
    const notificationKey = [
      mostCritical.id ?? `${mostCritical.name}-${mostCritical.series}`,
      mostCritical.alertLevel,
      mostCritical.primaryAlertReason ?? 'quantity',
      mostCritical.remainingNumbers,
      mostCritical.daysUntilExpiration ?? 'na',
    ].join('|');

    const repeatWindowMs =
      Math.max(alertConfig.execution.checkFrequencyMinutes, 5) * 60 * 1000;
    const shouldSuppressDuplicate =
      alertConfig.execution.suppressRepeatedNotifications &&
      lastNotificationKeyRef.current === notificationKey;
    const insideRepeatWindow =
      now - lastNotificationAtRef.current < repeatWindowMs;

    if (shouldSuppressDuplicate && insideRepeatWindow) {
      return;
    }

    lastNotificationKeyRef.current = notificationKey;
    lastNotificationAtRef.current = now;
    setShouldShowNotification(true);
  }, [alertConfig, fiscalData.analysis.summary.mostCritical, fiscalData.hasIssues]);

  // Efecto para actualizar la última verificación usando ref
  useEffect(() => {
    if (fiscalData.analysis.summary.mostCritical && !isLoading) {
      lastCheckRef.current = fiscalData.analysis.summary.mostCritical;
    }
  }, [fiscalData.analysis.summary.mostCritical, isLoading]);

  // Funciones auxiliares
  const dismissNotification = () => {
    setShouldShowNotification(false);
  };

  const getReceiptsByAlertLevel = (level: FiscalAlertLevel) => {
    return fiscalData.analysis.receipts.filter(
      (receipt) => receipt.isActive && receipt.alertLevel === level,
    );
  };

  const getMostUrgentReceipt = () => {
    return fiscalData.analysis.summary.mostCritical;
  };

  const getAlertSummary = () => {
    const { summary } = fiscalData.analysis;

    return {
      totalActive: summary.activeReceipts,
      needingAttention: summary.receiptsNeedingAttention,
      critical: summary.criticalReceipts,
      warning: summary.warningReceipts,
      totalRemaining: summary.totalRemaining,
      hasAnyIssues: fiscalData.hasIssues,
    };
  };

  const formatReceiptForDisplay = (receipt: FiscalReceiptStatus | null) => {
    if (!receipt) return null;

    return {
      id: receipt.id || `${receipt.name}-${receipt.series}`,
      name: receipt.name,
      series: receipt.series,
      remaining: receipt.remainingNumbers,
      total: receipt.totalNumbers,
      percentage: receipt.percentageRemaining,
      alertLevel: receipt.alertLevel,
      isUrgent:
        receipt.remainingNumbers <= (receipt.thresholds?.critical || 50),
      displayText: `${receipt.name} (Serie ${receipt.series}): ${receipt.remainingNumbers} restantes`,
      statusText:
        receipt.alertLevel === 'critical'
          ? 'Crítico'
          : receipt.alertLevel === 'warning'
            ? 'Advertencia'
            : 'Normal',
    };
  };

  return {
    // Estado principal
    isLoading: isLoading || loadingConfig,
    isEnabled: fiscalData.isEnabled,
    hasIssues: fiscalData.hasIssues,
    hasChanges: fiscalData.hasChanges,
    configLoaded: fiscalData.configLoaded,

    // Datos para widgets/componentes
    widgetData: fiscalData.widgetData,
    analysis: fiscalData.analysis,
    alertConfig: alertConfig, // Exponer la configuración cargada

    // Funciones utilitarias
    getReceiptsByAlertLevel,
    getMostUrgentReceipt,
    getAlertSummary,
    formatReceiptForDisplay,

    // Notificaciones
    shouldShowNotification,
    dismissNotification,

    // Datos específicos
    criticalReceipts: getReceiptsByAlertLevel('critical'),
    warningReceipts: getReceiptsByAlertLevel('warning'),
    mostUrgent: getMostUrgentReceipt(),
    alertSummary: getAlertSummary(),
  };
};
