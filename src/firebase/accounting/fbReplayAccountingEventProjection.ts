import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

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

export const fbReplayAccountingEventProjection = async (
  input: ReplayAccountingEventProjectionInput,
): Promise<ReplayAccountingEventProjectionResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    ReplayAccountingEventProjectionInput & { sessionToken?: string },
    ReplayAccountingEventProjectionResult
  >(functions, 'replayAccountingEventProjection');

  const response = await callable({
    ...input,
    ...(sessionToken ? { sessionToken } : {}),
  });
  return response.data;
};
