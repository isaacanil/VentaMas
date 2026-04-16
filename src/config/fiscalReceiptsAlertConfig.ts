import type { FiscalAlertsConfig, FiscalAlertThresholds } from '@/firebase/Settings/fiscalAlertsConfig/types';

interface MessageConfig {
  template: string;
  action: string;
}

interface FiscalReceiptsAlertConfig {
  DEFAULT_WARNING_THRESHOLD: number;
  DEFAULT_CRITICAL_THRESHOLD: number;
  DEFAULT_EXPIRATION_WARNING_DAYS: number;
  DEFAULT_EXPIRATION_CRITICAL_DAYS: number;
  DEFAULT_CHECK_FREQUENCY_MINUTES: number;
  CUSTOM_THRESHOLDS: Record<string, FiscalAlertThresholds>;
  MESSAGES: Record<string, MessageConfig>;
}

export const FISCAL_RECEIPTS_ALERT_CONFIG: FiscalReceiptsAlertConfig = {
  DEFAULT_WARNING_THRESHOLD: 100,
  DEFAULT_CRITICAL_THRESHOLD: 50,
  DEFAULT_EXPIRATION_WARNING_DAYS: 30,
  DEFAULT_EXPIRATION_CRITICAL_DAYS: 7,
  DEFAULT_CHECK_FREQUENCY_MINUTES: 1440,
  CUSTOM_THRESHOLDS: {
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
  },
  MESSAGES: {
    CRITICAL_QUANTITY: {
      template:
        '{name} - Serie {series}: solo quedan {remaining} comprobantes disponibles.',
      action: 'Revisar series',
    },
    WARNING_QUANTITY: {
      template:
        '{name} - Serie {series}: quedan {remaining} comprobantes. Conviene gestionar una nueva autorización.',
      action: 'Revisar series',
    },
    CRITICAL_EXPIRATION: {
      template:
        '{name} - Serie {series}: la autorización vence en {daysUntilExpiration} día(s).',
      action: 'Registrar secuencia DGII',
    },
    WARNING_EXPIRATION: {
      template:
        '{name} - Serie {series}: la autorización vencerá en {daysUntilExpiration} día(s).',
      action: 'Registrar secuencia DGII',
    },
    INFO: {
      template:
        'Los comprobantes fiscales están deshabilitados o no configurados.',
      action: 'Configurar',
    },
    DISABLED: {
      template: 'Las alertas de comprobantes están desactivadas.',
      action: 'Configurar alertas',
    },
    SUCCESS: {
      template:
        'Todas las series están dentro de los umbrales configurados. La más ajustada es {name}.',
      action: 'Ver detalles',
    },
  },
};

export const getThresholdsForReceiptType = (
  receiptType: string,
): FiscalAlertThresholds => {
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

export const createDefaultFiscalAlertsConfig = (): FiscalAlertsConfig => ({
  alertsEnabled: true,
  monitoring: {
    quantityEnabled: true,
    expirationEnabled: true,
  },
  globalThresholds: {
    warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
    critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
  },
  customThresholds: {},
  expirationThresholds: {
    warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_EXPIRATION_WARNING_DAYS,
    critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_EXPIRATION_CRITICAL_DAYS,
  },
  customExpirationThresholds: {},
  channels: {
    notificationCenter: true,
    popupOnCritical: true,
    email: false,
  },
  execution: {
    checkFrequencyMinutes:
      FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CHECK_FREQUENCY_MINUTES,
    suppressRepeatedNotifications: true,
  },
  lastUpdated: null,
  version: '2.0',
});

export const formatMessage = (
  template: string,
  data: Record<string, unknown>,
): string => {
  return template.replace(/\{(\w+)\}/g, (match: string, key: string) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
};

export const getAlertMessage = (
  alertType: string,
  receiptData: Record<string, unknown> = {},
) => {
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
