import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';

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

const resolveBankStatementLineMatchCallable = createFirebaseCallable<
  ResolveBankStatementLineMatchInput & { sessionToken?: string },
  ResolveBankStatementLineMatchResult
>('resolveBankStatementLineMatch');

export const fbResolveBankStatementLineMatch = async (
  input: ResolveBankStatementLineMatchInput,
): Promise<ResolveBankStatementLineMatchResult> => {
  const { sessionToken } = getStoredSession();

  const response = await resolveBankStatementLineMatchCallable({
    ...input,
    movementIds: Array.isArray(input.movementIds) ? input.movementIds : [],
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!response?.ok) {
    throw new Error('No se pudo resolver la excepción bancaria.');
  }

  return response;
};
