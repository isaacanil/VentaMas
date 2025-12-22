/**
 * Configuración para alertas de comprobantes fiscales
 * Este archivo permite configurar cuándo mostrar alertas basadas en la cantidad restante
 */

export const FISCAL_RECEIPTS_ALERT_CONFIG = {
  // Umbrales por defecto
  DEFAULT_WARNING_THRESHOLD: 100, // Mostrar alerta de advertencia cuando queden menos de 100
  DEFAULT_CRITICAL_THRESHOLD: 50, // Mostrar alerta crítica cuando queden menos de 50

  // Configuraciones personalizables por tipo de comprobante
  CUSTOM_THRESHOLDS: {
    // Ejemplo: configuraciones específicas por tipo
    'CREDITO FISCAL': {
      warning: 150,
      critical: 75,
    },
    'CONSUMIDOR FINAL': {
      warning: 200,
      critical: 100,
    },
    GUBERNAMENTAL: {
      warning: 80,
      critical: 40,
    },
    // Se pueden agregar más configuraciones específicas aquí
  },

  // Configuración de mensajes
  MESSAGES: {
    CRITICAL: {
      template:
        '{name} - Serie {series}: ¡CRÍTICO! Solo quedan {remaining} de {total} comprobantes. Solicita más inmediatamente.',
      action: 'Solicitar urgente',
    },
    WARNING: {
      template:
        '{name} - Serie {series}: Quedan {remaining} de {total} comprobantes. Considera solicitar más pronto.',
      action: 'Solicitar más',
    },
    INFO: {
      template:
        'Los comprobantes fiscales están deshabilitados o no configurados.',
      action: 'Configurar',
    },
    SUCCESS: {
      template:
        'Todos los comprobantes están en buen estado. El de menor cantidad es {name} con {remaining} restantes.',
      action: 'Ver detalles',
    },
  },

  // Configuración de notificaciones automáticas
  NOTIFICATIONS: {
    // Mostrar notificación emergente cuando hay comprobantes críticos
    SHOW_POPUP_ON_CRITICAL: true,

    // Mostrar badge en el menú cuando hay alertas
    SHOW_BADGE_ON_ALERTS: true,

    // Frecuencia de verificación (en minutos)
    CHECK_FREQUENCY_MINUTES: 30,

    // Enviar recordatorios por email
    EMAIL_REMINDERS: false,
  },
};

/**
 * Obtiene los umbrales configurados para un tipo específico de comprobante
 * @param {string} receiptType - Tipo de comprobante
 * @returns {Object} Umbrales de advertencia y crítico
 */
export const getThresholdsForReceiptType = (receiptType) => {
  const customConfig =
    FISCAL_RECEIPTS_ALERT_CONFIG.CUSTOM_THRESHOLDS[receiptType];

  if (customConfig) {
    return {
      warning: customConfig.warning,
      critical: customConfig.critical,
    };
  }

  return {
    warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
    critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
  };
};

/**
 * Formatea un mensaje usando una plantilla
 * @param {string} template - Plantilla del mensaje
 * @param {Object} data - Datos para reemplazar en la plantilla
 * @returns {string} Mensaje formateado
 */
export const formatMessage = (template, data) => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
};

/**
 * Obtiene el mensaje configurado para un tipo de alerta
 * @param {string} alertType - Tipo de alerta (critical, warning, info, success)
 * @param {Object} receiptData - Datos del comprobante
 * @returns {Object} Mensaje y acción configurados
 */
export const getAlertMessage = (alertType, receiptData = {}) => {
  const messageConfig =
    FISCAL_RECEIPTS_ALERT_CONFIG.MESSAGES[alertType.toUpperCase()];

  if (!messageConfig) {
    return {
      message: 'Estado desconocido',
      action: 'Ver detalles',
    };
  }

  return {
    message: formatMessage(messageConfig.template, receiptData),
    action: messageConfig.action,
  };
};
