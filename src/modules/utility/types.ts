import type { InvoiceData } from '@/types/invoice';
import type { ExpenseDoc } from '@/utils/expenses/types';

export type UtilityDateRange = {
  startDate?: number;
  endDate?: number;
};

export type UtilityPresetKey =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'custom';

export type UtilityTrend = 'up' | 'down' | 'flat';

export type UtilityInvoiceEntry =
  | InvoiceData
  | { data?: InvoiceData | null }
  | Record<string, unknown>;

export type UtilityExpenseEntry =
  | ExpenseDoc
  | (Record<string, unknown> & { expense?: Record<string, unknown> });

export type UtilitySummary = {
  totalSales: number;
  totalCost: number;
  totalTaxes: number;
  totalExpenses: number;
  profitBeforeExpenses: number;
  netProfit: number;
};

export type UtilityDailyMetric = {
  isoDate: string;
  timestamp: number;
  dateLabel: string;
  sales: number;
  cost: number;
  taxes: number;
  expenses: number;
  profitBeforeExpenses: number;
  netProfit: number;
};

export type UtilityHourlyMetric = UtilityDailyMetric & {
  isoDate: string;
};

export type UtilityProductBreakdown = {
  name: string;
  quantity: number;
  sales: number;
  cost: number;
  taxes: number;
  profit: number;
  instances: number;
  averageUnitPrice: number;
};

export type UtilityMetricsResult = {
  summary: UtilitySummary;
  productsBreakdown: UtilityProductBreakdown[];
  dailyMetrics: UtilityDailyMetric[];
  hourlyMetrics: UtilityHourlyMetric[];
};

export type UtilityComparison = {
  current: number;
  previous: number;
  delta: number;
  percentage: number | null;
  trend: UtilityTrend;
  title?: string;
  previousLabel?: string;
};

export type UtilityDistributionColors = {
  cost: string;
  expenses: string;
  netProfit: string;
  netLoss: string;
  taxes: string;
};

export type UtilityDistributionSegment = {
  key: 'cost' | 'expenses' | 'netProfit' | 'netLoss' | 'taxes';
  label: string;
  value: number;
  color: string;
  chartValue: number;
  rawPercentage: number;
  percentage: number;
};

export type UtilityInsightType = 'success' | 'warning' | 'critical' | 'info';

export type UtilityInsightMeta = {
  days?: Array<{ dateLabel: string; netProfit: number }>;
  dateLabel?: string;
  timestamp?: number;
  netProfit?: number;
  sales?: number;
  expenses?: number;
};

export type UtilityInsight = {
  key: string;
  type: UtilityInsightType;
  title: string;
  description: string;
  value: string;
  measurement?: string;
  meta?: UtilityInsightMeta;
};

export type UtilityDistributionDetail = UtilityDistributionSegment;

export type UtilityTransactionRow = {
  id: string;
  dateLabel: string;
  totalSales: number;
  totalCost: number;
  taxes: number;
  netProfit: number;
  trend: UtilityTrend;
};

export type UtilityCurrencyFormatter = (value: number) => string;
export type UtilityPercentageFormatter = (value: number | null) => string;
