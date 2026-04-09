export interface FiscalAlertThresholds {
  warning: number;
  critical: number;
}

export interface FiscalAlertsConfig {
  alertsEnabled: boolean;
  globalThresholds: FiscalAlertThresholds;
  customThresholds: Record<string, FiscalAlertThresholds>;
  lastUpdated: unknown;
  version: string;
}
