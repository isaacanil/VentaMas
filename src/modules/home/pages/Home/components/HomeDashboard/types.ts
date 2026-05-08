import type { ReactNode } from 'react';

export type HomeDashboardTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export type HomeDashboardStatus = 'ready' | 'pending';

export interface HomeDashboardMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  supportingValue?: string;
  tone: HomeDashboardTone;
  route?: string;
  icon?: ReactNode;
  loading?: boolean;
  status?: HomeDashboardStatus;
}

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

export interface HomeDashboardPreparedWidget {
  id: string;
  title: string;
  description: string;
}

export interface HomeDashboardData {
  metrics: HomeDashboardMetric[];
  alerts: HomeDashboardAlert[];
  activities: HomeDashboardActivity[];
  topProducts: HomeDashboardProduct[];
  trend: HomeDashboardTrendPoint[];
  preparedWidgets: HomeDashboardPreparedWidget[];
  loading: boolean;
  updatedAtLabel: string;
}
