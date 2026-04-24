import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

export interface ResolveBankStatementLineMatchInput {
  businessId: string;
  idempotencyKey: string;
  movementIds: string[];
  resolutionMode?: 'match' | 'write_off';
  statementLineId: string;
  writeOffNotes?: string | null;
  writeOffReason?: string | null;
}

export interface ResolveBankStatementLineMatchResult {
  differenceAmount?: number;
  matchedAmount: number;
  ok: boolean;
  resolutionMode?: 'match' | 'write_off';
  reused?: boolean;
  statementLineId: string;
  statementLine: Record<string, unknown>;
}

export const fbResolveBankStatementLineMatch = async (
  input: ResolveBankStatementLineMatchInput,
): Promise<ResolveBankStatementLineMatchResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    ResolveBankStatementLineMatchInput & { sessionToken?: string },
    ResolveBankStatementLineMatchResult
  >(functions, 'resolveBankStatementLineMatch');

  const response = await callable({
    ...input,
    movementIds: Array.isArray(input.movementIds) ? input.movementIds : [],
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!response.data?.ok) {
    throw new Error('No se pudo resolver la excepción bancaria.');
  }

  return response.data;
};
