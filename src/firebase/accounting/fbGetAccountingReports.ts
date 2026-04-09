import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import {
  GetAccountingReportsInputSchema,
  GetAccountingReportsResultSchema,
} from '@/shared/accountingSchemas.js';

export interface GetAccountingReportsInput {
  businessId: string;
  includeFinancialReports?: boolean;
  includeGeneralLedger?: boolean;
  ledgerAccountId?: string | null;
  ledgerPage?: number;
  ledgerPageSize?: number;
  ledgerPeriodKey?: string | null;
  ledgerQuery?: string | null;
  reportPeriodKey?: string | null;
}

export interface GetAccountingReportsResult {
  ok: boolean;
  generatedAt: string;
  periods: string[];
  generalLedger: {
    selectedAccountId: string | null;
    selectedPeriodKey: string | null;
    accountOptions: Array<{
      id: string;
      code: string;
      name: string;
      normalSide: string;
      type: string;
      movementCount: number;
    }>;
    snapshot: Record<string, unknown> | null;
  };
  financialReports: {
    selectedPeriodKey: string | null;
    snapshot: Record<string, unknown> | null;
  };
}

export const fbGetAccountingReports = async (
  input: GetAccountingReportsInput,
): Promise<GetAccountingReportsResult> => {
  const { sessionToken } = getStoredSession();
  const parsedInput = GetAccountingReportsInputSchema.parse(input);
  const callable = httpsCallable<
    GetAccountingReportsInput & { sessionToken?: string },
    GetAccountingReportsResult
  >(functions, 'getAccountingReports');

  const response = await callable({
    ...parsedInput,
    ...(sessionToken ? { sessionToken } : {}),
  });
  return GetAccountingReportsResultSchema.parse(response.data);
};
