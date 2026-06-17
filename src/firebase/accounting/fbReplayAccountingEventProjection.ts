import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';

export interface ReplayAccountingEventProjectionInput {
  businessId: string;
  eventId: string;
}

export interface ReplayAccountingEventProjectionResult {
  deadLetterId?: string | null;
  eventId: string;
  journalEntryId?: string | null;
  lastError?: unknown;
  ok: boolean;
  reusedExistingEntry?: boolean;
  status: string;
}

type ReplayAccountingEventProjectionRequest =
  ReplayAccountingEventProjectionInput & {
    sessionToken?: string;
  };

const replayAccountingEventProjectionCallable = createFirebaseCallable<
  ReplayAccountingEventProjectionRequest,
  ReplayAccountingEventProjectionResult
>('replayAccountingEventProjection');

export const fbReplayAccountingEventProjection = async (
  input: ReplayAccountingEventProjectionInput,
): Promise<ReplayAccountingEventProjectionResult> => {
  const { sessionToken } = getStoredSession();

  return replayAccountingEventProjectionCallable({
    ...input,
    ...(sessionToken ? { sessionToken } : {}),
  });
};
