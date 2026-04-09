import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import {
  ReverseJournalEntryInputSchema,
  ReverseJournalEntryResultSchema,
} from '@/shared/accountingSchemas.js';

export interface ReverseJournalEntryInput {
  businessId: string;
  entryId: string;
  reason?: string;
  reversalDate?: string;
}

export interface ReverseJournalEntryResult {
  ok: boolean;
  entryId: string;
  reversalEntryId: string | null;
  reused: boolean;
}

export const fbReverseJournalEntry = async (
  input: ReverseJournalEntryInput,
): Promise<ReverseJournalEntryResult> => {
  const { sessionToken } = getStoredSession();
  const parsedInput = ReverseJournalEntryInputSchema.parse(input);
  const callable = httpsCallable<
    ReverseJournalEntryInput & { sessionToken?: string },
    ReverseJournalEntryResult
  >(functions, 'reverseJournalEntry');

  const response = await callable({
    ...parsedInput,
    ...(sessionToken ? { sessionToken } : {}),
  });
  return ReverseJournalEntryResultSchema.parse(response.data);
};
