import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import {
  CloseAccountingPeriodInputSchema,
  CloseAccountingPeriodResultSchema,
} from '@/shared/accountingSchemas.js';

export interface CloseAccountingPeriodInput {
  businessId: string;
  note?: string;
  periodKey: string;
}

export interface CloseAccountingPeriodResult {
  ok: boolean;
  periodKey: string;
  reused: boolean;
}

export const fbCloseAccountingPeriod = async (
  input: CloseAccountingPeriodInput,
): Promise<CloseAccountingPeriodResult> => {
  const { sessionToken } = getStoredSession();
  const parsedInput = CloseAccountingPeriodInputSchema.parse(input);
  const callable = httpsCallable<
    CloseAccountingPeriodInput & { sessionToken?: string },
    CloseAccountingPeriodResult
  >(functions, 'closeAccountingPeriod');

  const response = await callable({
    ...parsedInput,
    ...(sessionToken ? { sessionToken } : {}),
  });
  return CloseAccountingPeriodResultSchema.parse(response.data);
};
