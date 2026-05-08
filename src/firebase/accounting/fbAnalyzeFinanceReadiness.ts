import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

export type FinanceReadinessStatus =
  | 'ready'
  | 'needs_preparation'
  | 'blocked';

export type FinanceReadinessIssue = {
  severity: 'blocker' | 'warning';
  code: string;
  message: string;
  collection?: string;
  documentId?: string;
  methodIndex?: number;
};

export type FinanceReadinessModule = {
  status: FinanceReadinessStatus;
  metrics: Record<string, unknown>;
  issues: FinanceReadinessIssue[];
};

export type FinanceReadinessBusinessResult = {
  businessId: string;
  businessName: string;
  status: FinanceReadinessStatus;
  issueCounts: {
    blockers: number;
    warnings: number;
  };
  modules: {
    cxp: FinanceReadinessModule;
    treasury: FinanceReadinessModule;
    currency: FinanceReadinessModule;
    accounting: FinanceReadinessModule;
  };
};

export type AnalyzeFinanceReadinessRequest = {
  businessId?: string;
  allBusinesses?: boolean;
  maxDocuments?: number;
};

export type AnalyzeFinanceReadinessResponse = {
  status: 'done';
  mode: 'read-only';
  runId: string;
  createdAt: number;
  maxDocuments: number;
  businessIds: string[];
  summary: {
    ready: number;
    needs_preparation: number;
    blocked: number;
    blockers: number;
    warnings: number;
  };
  businessResults: FinanceReadinessBusinessResult[];
};

const callable = httpsCallable<
  AnalyzeFinanceReadinessRequest,
  AnalyzeFinanceReadinessResponse
>(functions, 'analyzeFinanceReadiness');

export const fbAnalyzeFinanceReadiness = async (
  payload: AnalyzeFinanceReadinessRequest,
): Promise<AnalyzeFinanceReadinessResponse> => {
  const { data } = await callable(payload);
  return data;
};
