import {
  buildFunctionsAuthHeaders,
  getFunctionsBaseUrl,
  parseFunctionsResponse,
} from '@/services/functionsApiClient';

export interface AdjustmentNoteFinancialEffectIssue {
  issueType: string;
  noteType: 'debitNote' | 'creditNote' | string;
  noteId: string;
  ncf?: string | null;
  fiscalStatus?: string | null;
  status?: string | null;
  accountsReceivable?: {
    arId?: string | null;
    status?: string | null;
    isActive?: boolean | null;
    balance?: number | null;
    totalReceivable?: number | null;
  } | null;
  payments?: number | null;
  installmentPayments?: number | null;
  availableAmount?: number | null;
  applications?: number | null;
  accountingEvent?: {
    id?: string | null;
    status?: string | null;
  } | null;
  journalEntry?: {
    id?: string | null;
    status?: string | null;
  } | null;
}

export interface AdjustmentNoteFinancialEffectsIndicator {
  scanned: number;
  sampleLimit: number;
  issues: AdjustmentNoteFinancialEffectIssue[];
}

export interface AccountReceivableAuditHttpResponse {
  businessId: string;
  generatedAt: string;
  rangeStart: number | null;
  executionTimeMs: number;
  limits: {
    sampleLimit: number;
    days: number | null;
  };
  indicators: {
    adjustmentNoteFinancialEffects?: AdjustmentNoteFinancialEffectsIndicator;
    [key: string]: unknown;
  };
}

export interface FetchAccountReceivableAuditParams {
  businessId: string;
  sampleLimit?: number;
}

export const fetchAccountReceivableAudit = async ({
  businessId,
  sampleLimit,
}: FetchAccountReceivableAuditParams): Promise<AccountReceivableAuditHttpResponse> => {
  if (!businessId) {
    throw new Error('Debes indicar businessId.');
  }

  const authHeaders = await buildFunctionsAuthHeaders();
  const baseUrl = getFunctionsBaseUrl();
  const response = await fetch(`${baseUrl}/auditAccountsReceivableHttp`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      businessId,
      sampleLimit,
      sessionToken: authHeaders['X-Session-Token'],
    }),
  });

  return parseFunctionsResponse<AccountReceivableAuditHttpResponse>(response);
};
