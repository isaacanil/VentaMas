export interface TaxNormalizationProgress {
  processed: number;
  total: number;
  businessID: string;
}

export interface TaxNormalizationSummary {
  productsUpdated?: number;
  saleUnitsUpdated?: number;
  selectedUnitUpdated?: number;
}

export interface TaxNormalizationItem {
  businessID: string;
  success: boolean;
  summary?: TaxNormalizationSummary;
  error?: string;
}

export interface TaxNormalizationResult {
  totalBusinesses: number;
  processed: number;
  summaries: TaxNormalizationItem[];
}

export interface ClientNormalizationSummary {
  normalized?: number;
  total?: number;
}

export interface ClientNormalizationItem {
  businessID: string;
  success: boolean;
  summary?: ClientNormalizationSummary;
  error?: string;
}

export interface ClientNormalizationResult {
  totalBusinesses: number;
  summaries: ClientNormalizationItem[];
}

export interface ClientNormalizationProgress {
  processed: number;
  total: number;
  businessID: string;
  normalized: number | null;
}

export interface FixProductIdResult {
  total: number;
  updated: number;
}

export interface ExpenseFixSample {
  id: string;
  fields: string[];
}

export interface ExpenseFixSummary {
  scanned: number;
  affected: number;
  updated: number;
  fieldsConverted: number;
  sample?: ExpenseFixSample[];
}

export interface ExpenseFixAllTotals {
  scanned: number;
  affected: number;
  updated: number;
  fieldsConverted: number;
}

export interface ExpenseFixAllSummaryItem {
  businessID: string;
  success: boolean;
  summary?: { sample?: ExpenseFixSample[] };
  error?: string;
}

export interface ExpenseFixAllResult {
  processed: number;
  totalBusinesses: number;
  totals?: ExpenseFixAllTotals;
  summaries?: ExpenseFixAllSummaryItem[];
}

export type ExpenseFixResult =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      dryRun: boolean;
      mode: 'all' | 'single';
      data: ExpenseFixAllResult | ExpenseFixSummary;
    };

export interface TestPlaygroundState {
  normalizing: boolean;
  progress: TaxNormalizationProgress | null;
  result:
    | { success: true; data: TaxNormalizationResult }
    | { success: false; error: string }
    | null;
  clientNormalizationState: {
    running: boolean;
    progress: ClientNormalizationProgress | null;
    result:
      | { success: true; data: ClientNormalizationResult }
      | { success: false; error: string }
      | null;
  };
  productIdFixState: {
    businessId: string | null;
    running: boolean;
    result:
      | { success: true; data: FixProductIdResult }
      | { success: false; error: string }
      | null;
  };
  expenseTimestampFixState: {
    businessId: string | null;
    running: boolean;
    result: ExpenseFixResult | null;
  };
  applyToAllBusinesses: boolean;
}
