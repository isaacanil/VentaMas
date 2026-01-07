// @ts-nocheck
/**
 * Utilitarios para manejar los cálculos de comprobantes fiscales
 */

import {
  getThresholdsForReceiptType,
  getAlertMessage,
  FISCAL_RECEIPTS_ALERT_CONFIG,
} from '@/config/fiscalReceiptsAlertConfig';

/**
 * Configuración por defecto para alertas de comprobantes
 * @deprecated Use FISCAL_RECEIPTS_ALERT_CONFIG instead
 */
export const FISCAL_RECEIPTS_CONFIG = {
  DEFAULT_WARNING_THRESHOLD:
    FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
  DEFAULT_CRITICAL_THRESHOLD:
    FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
};

/**
 * Calcula el estado de un comprobante fiscal individual
 * @param {Object} receipt - Datos del comprobante fiscal
 * @param {Object} alertConfig - Configuración personalizada de alertas
 * @returns {Object} Estado calculado del comprobante
 */
export const calculateReceiptStatus = (receipt, alertConfig = null) => {
  if (!receipt?.data) return null;

  const { data } = receipt;
  const {
    name = 'N/A',
    series = 'N/A',
    startNumber = 0,
    endNumber = 0,
    currentNumber = 0,
    quantity = 0,
    disabled = false,
  } = data;

  // Determinar umbrales a usar
  let thresholds;
  if (
    alertConfig &&
    alertConfig.customThresholds &&
    alertConfig.customThresholds[name]
  ) {
    // Usar umbrales personalizados específicos
    thresholds = alertConfig.customThresholds[name];
  } else if (alertConfig && alertConfig.globalThresholds) {
    // Usar umbrales globales personalizados
    thresholds = alertConfig.globalThresholds;
  } else {
    // Fallback a configuración por defecto
    thresholds = getThresholdsForReceiptType(name);
  }

  // Usar quantity como números restantes directamente (convertir a número)
  const remainingNumbers = parseInt(quantity) || 0;
  const totalNumbers = endNumber - startNumber + 1;
  const usedNumbers = totalNumbers - remainingNumbers;

  // Calcular porcentaje usado y restante
  const percentageUsed =
    totalNumbers > 0 ? Math.round((usedNumbers / totalNumbers) * 100) : 0;
  const percentageRemaining = 100 - percentageUsed;

  // Determinar el estado de alerta usando umbrales personalizados
  let alertLevel = 'normal';
  if (remainingNumbers <= thresholds.critical) {
    alertLevel = 'critical';
  } else if (remainingNumbers <= thresholds.warning) {
    alertLevel = 'warning';
  }

  return {
    name,
    series,
    startNumber,
    endNumber,
    currentNumber,
    totalNumbers,
    usedNumbers,
    remainingNumbers,
    percentageUsed,
    percentageRemaining,
    alertLevel,
    disabled,
    isActive: !disabled,
    needsAttention: !disabled && remainingNumbers <= thresholds.warning,
    thresholds: thresholds,
  };
};

/**
 * Procesa todos los comprobantes fiscales y devuelve un resumen
 * @param {Array} taxReceipts - Array de comprobantes fiscales
 * @param {Object} alertConfig - Configuración personalizada de alertas
 * @returns {Object} Resumen de todos los comprobantes
 */
export const processFiscalReceipts = (taxReceipts = [], alertConfig = null) => {
  if (!Array.isArray(taxReceipts) || taxReceipts.length === 0) {
    return {
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
    };
  }

  // Procesar cada comprobante con la configuración personalizada
  const processedReceipts = taxReceipts
    .map((receipt) => calculateReceiptStatus(receipt, alertConfig))
    .filter((receipt) => receipt !== null);

  // Calcular resumen
  const activeReceipts = processedReceipts.filter((r) => r.isActive);
  const receiptsNeedingAttention = processedReceipts.filter(
    (r) => r.needsAttention,
  );
  const criticalReceipts = processedReceipts.filter(
    (r) => r.alertLevel === 'critical' && r.isActive,
  );
  const warningReceipts = processedReceipts.filter(
    (r) => r.alertLevel === 'warning' && r.isActive,
  );

  const totalRemaining = activeReceipts.reduce(
    (sum, r) => sum + r.remainingNumbers,
    0,
  );

  // Encontrar el comprobante con menos números restantes
  const lowestRemaining =
    activeReceipts.length > 0
      ? activeReceipts.reduce((min, r) =>
          r.remainingNumbers < min.remainingNumbers ? r : min,
        )
      : null;

  // Encontrar el más crítico (que necesite atención inmediata)
  const mostCritical =
    receiptsNeedingAttention.length > 0
      ? receiptsNeedingAttention.reduce((min, r) =>
          r.remainingNumbers < min.remainingNumbers ? r : min,
        )
      : null;

  return {
    receipts: processedReceipts,
    summary: {
      totalReceipts: processedReceipts.length,
      activeReceipts: activeReceipts.length,
      receiptsNeedingAttention: receiptsNeedingAttention.length,
      criticalReceipts: criticalReceipts.length,
      warningReceipts: warningReceipts.length,
      totalRemaining,
      lowestRemaining,
      mostCritical,
    },
  };
};

/**
 * Genera los datos para el widget de comprobantes fiscales
 * @param {Array} taxReceipts - Array de comprobantes fiscales
 * @param {Object} alertConfig - Configuración personalizada de alertas
 * @returns {Object} Datos formateados para el widget
 */
export const generateFiscalReceiptsWidgetData = (
  taxReceipts = [],
  alertConfig = null,
) => {
  const { summary, receipts } = processFiscalReceipts(taxReceipts, alertConfig);

  if (summary.activeReceipts === 0) {
    const alertData = getAlertMessage('info');
    return {
      title: 'Comprobantes Fiscales',
      alertType: 'info',
      message: alertData.message,
      percentage: 0,
      seriesInfo: 'Sin configurar',
      hasIssues: false,
      receipts: [],
      actionText: alertData.action,
    };
  }

  // Si hay comprobantes críticos o con advertencia
  if (summary.mostCritical) {
    const critical = summary.mostCritical;
    const alertType =
      critical.alertLevel === 'critical' ? 'critical' : 'warning';
    const alertData = getAlertMessage(alertType, critical);

    return {
      title: 'Comprobantes Fiscales',
      alertType: alertType === 'critical' ? 'error' : 'warning',
      message: alertData.message,
      percentage: critical.percentageRemaining,
      seriesInfo: `${critical.name} - Serie ${critical.series}`,
      hasIssues: true,
      receipts: receipts.filter((r) => r.needsAttention),
      remaining: critical.remainingNumbers,
      total: critical.totalNumbers,
      current: critical.currentNumber,
      summary,
      actionText: alertData.action,
      thresholds: critical.thresholds,
    };
  }

  // Si todos están bien
  const lowestReceipt = summary.lowestRemaining;
  const alertData = getAlertMessage('success', lowestReceipt);

  return {
    title: 'Comprobantes Fiscales',
    alertType: 'success',
    message: alertData.message,
    percentage: lowestReceipt.percentageRemaining,
    seriesInfo: `${lowestReceipt.name} - Serie ${lowestReceipt.series}`,
    hasIssues: false,
    receipts: receipts.filter((r) => r.isActive),
    remaining: lowestReceipt.remainingNumbers,
    total: lowestReceipt.totalNumbers,
    current: lowestReceipt.currentNumber,
    summary,
    actionText: alertData.action,
    thresholds: lowestReceipt.thresholds,
  };
};
