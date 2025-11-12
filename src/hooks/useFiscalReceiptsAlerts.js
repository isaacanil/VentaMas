import { useMemo, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';

import { FISCAL_RECEIPTS_ALERT_CONFIG } from '../config/fiscalReceiptsAlertConfig';
import { selectUser } from '../features/auth/userSlice';
import { selectTaxReceiptEnabled } from '../features/taxReceipt/taxReceiptSlice';
import { fbGetFiscalAlertsConfig } from '../firebase/Settings/fiscalAlertsConfig/fbGetFiscalAlertsConfig';
import { fbGetTaxReceipt } from '../firebase/taxReceipt/fbGetTaxReceipt';
import {
  generateFiscalReceiptsWidgetData,
  processFiscalReceipts,
} from '../utils/fiscalReceiptsUtils';

/**
 * Hook personalizado para manejar las alertas de comprobantes fiscales
 * @returns {Object} Estado y funciones para manejar alertas de comprobantes
 */
export const useFiscalReceiptsAlerts = () => {
  const { taxReceipt, isLoading } = fbGetTaxReceipt();
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const user = useSelector(selectUser);
  const [shouldShowNotification, setShouldShowNotification] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Use useRef to store lastCheck to avoid circular dependencies
  const lastCheckRef = useRef(null);

  // Cargar configuración de alertas personalizada
  useEffect(() => {
    const loadAlertConfig = async () => {
      if (user?.id) {
        try {
          setLoadingConfig(true);
          const config = await fbGetFiscalAlertsConfig(user);
          setAlertConfig(config);
        } catch (error) {
          console.error('Error al cargar configuración de alertas:', error);
          // Usar configuración por defecto en caso de error
          setAlertConfig({
            alertsEnabled: true,
            globalThresholds: {
              warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
              critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
            },
            customThresholds: {},
          });
        } finally {
          setLoadingConfig(false);
        }
      } else {
        // Si no hay usuario, usar configuración por defecto
        setAlertConfig({
          alertsEnabled: true,
          globalThresholds: {
            warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
            critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
          },
          customThresholds: {},
        });
        setLoadingConfig(false);
      }
    };

    loadAlertConfig();
  }, [user?.id]); // Only depend on user.id to avoid unnecessary reloads

  // Procesar datos de comprobantes fiscales con configuración personalizada
  const fiscalData = useMemo(() => {
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
    const analysis = processFiscalReceipts(taxReceipt, alertConfig);
    const widgetData = generateFiscalReceiptsWidgetData(
      taxReceipt,
      alertConfig,
    );
    const hasIssues = analysis.summary.receiptsNeedingAttention > 0;

    // Detectar si hay cambios desde la última verificación usando ref
    const currentMostCritical = analysis.summary.mostCritical;
    const hasChanges =
      lastCheckRef.current &&
      currentMostCritical &&
      (lastCheckRef.current.remainingNumbers !==
        currentMostCritical.remainingNumbers ||
        lastCheckRef.current.alertLevel !== currentMostCritical.alertLevel);

    return {
      hasIssues,
      hasChanges,
      widgetData,
      analysis,
      isEnabled: taxReceiptEnabled,
      isLoading: false,
      configLoaded: true,
    };
  }, [taxReceipt, taxReceiptEnabled, isLoading, alertConfig, loadingConfig]); // Removed lastCheck from dependencies

  // Efecto para manejar notificaciones automáticas
  useEffect(() => {
    if (
      fiscalData.hasIssues &&
      FISCAL_RECEIPTS_ALERT_CONFIG.NOTIFICATIONS.SHOW_POPUP_ON_CRITICAL
    ) {
      const criticalReceipts = fiscalData.analysis.summary.criticalReceipts;

      if (criticalReceipts > 0) {
        setShouldShowNotification(true);
      }
    }
  }, [fiscalData.hasIssues, fiscalData.analysis.summary.criticalReceipts]);

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

  const getReceiptsByAlertLevel = (level) => {
    return fiscalData.analysis.receipts.filter(
      (receipt) => receipt.isActive && receipt.alertLevel === level,
    );
  };

  const getMostUrgentReceipt = () => {
    const critical = getReceiptsByAlertLevel('critical');
    if (critical.length > 0) {
      return critical.reduce((min, receipt) =>
        receipt.remainingNumbers < min.remainingNumbers ? receipt : min,
      );
    }

    const warning = getReceiptsByAlertLevel('warning');
    if (warning.length > 0) {
      return warning.reduce((min, receipt) =>
        receipt.remainingNumbers < min.remainingNumbers ? receipt : min,
      );
    }

    return null;
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

  const formatReceiptForDisplay = (receipt) => {
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
