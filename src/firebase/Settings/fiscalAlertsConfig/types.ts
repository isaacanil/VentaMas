export interface FiscalAlertThresholds {
  warning: number;
  critical: number;
}

export interface FiscalAlertMonitoringConfig {
  quantityEnabled: boolean;
  expirationEnabled: boolean;
}

export interface FiscalAlertChannelsConfig {
  notificationCenter: boolean;
  popupOnCritical: boolean;
  email: boolean;
}

export interface FiscalAlertExecutionConfig {
  checkFrequencyMinutes: number;
  suppressRepeatedNotifications: boolean;
}

export interface FiscalAlertsConfig {
  alertsEnabled: boolean;
  monitoring: FiscalAlertMonitoringConfig;
  globalThresholds: FiscalAlertThresholds;
  customThresholds: Record<string, FiscalAlertThresholds>;
  expirationThresholds: FiscalAlertThresholds;
  customExpirationThresholds: Record<string, FiscalAlertThresholds>;
  channels: FiscalAlertChannelsConfig;
  execution: FiscalAlertExecutionConfig;
  lastUpdated: unknown;
  version: string;
}
