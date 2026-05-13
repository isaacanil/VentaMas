export type HomeDashboardTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export interface HomeDashboardAlert {
  id: string;
  title: string;
  description: string;
  tone: HomeDashboardTone;
  route?: string;
  meta?: string;
}

export interface HomeDashboardActivity {
  id: string;
  title: string;
  description: string;
  amount?: string;
  timestampLabel?: string;
  route?: string;
  tone?: HomeDashboardTone;
}

export interface HomeDashboardProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  revenueLabel: string;
}

export interface HomeDashboardTrendPoint {
  key: string;
  label: string;
  total: number;
  valueLabel: string;
}

export interface HomeDashboardSummary {
  today: {
    salesAmount: number;
    salesLabel: string;
    invoiceCount: number;
    invoiceLabel: string;
  };
  cash: {
    statusLabel: string;
    detail: string;
    amountLabel?: string;
    tone: HomeDashboardTone;
  };
  finance: {
    receivableAmount: number;
    receivableLabel: string;
    receivableCount: number;
    payableAmount: number;
    payableLabel: string;
    payableCount: number;
    payableOverdueCount: number;
    netAmount: number;
    netLabel: string;
  };
  inventory: {
    criticalCount: number;
    lowCount: number;
    missingStockCount: number;
    lowThreshold: number;
  };
  fiscal: {
    issueCount: number;
    message: string;
    name?: string;
    series?: string;
    remainingNumbers?: number;
  };
}

export interface HomeDashboardData {
  alerts: HomeDashboardAlert[];
  activities: HomeDashboardActivity[];
  topProducts: HomeDashboardProduct[];
  trend: HomeDashboardTrendPoint[];
  summary: HomeDashboardSummary;
  loading: boolean;
  updatedAtLabel: string;
}
