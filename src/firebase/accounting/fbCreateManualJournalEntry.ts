import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import {
  CreateManualJournalEntryInputSchema,
  CreateManualJournalEntryResultSchema,
} from '@/shared/accountingSchemas.js';

export interface CreateManualJournalEntryInput {
  businessId: string;
  description: string;
  entryDate: string;
  lines: Array<{
    accountId: string;
    credit: number;
    debit: number;
    description?: string;
  }>;
  note?: string;
}

export interface CreateManualJournalEntryResult {
  ok: boolean;
  entryId: string;
  eventId: string;
  status: 'posted' | 'reversed';
}

export const fbCreateManualJournalEntry = async (
  input: CreateManualJournalEntryInput,
): Promise<CreateManualJournalEntryResult> => {
  const { sessionToken } = getStoredSession();
  const parsedInput = CreateManualJournalEntryInputSchema.parse(input);
  const callable = httpsCallable<
    CreateManualJournalEntryInput & { sessionToken?: string },
    CreateManualJournalEntryResult
  >(functions, 'createManualJournalEntry');

  const response = await callable({
    ...parsedInput,
    ...(sessionToken ? { sessionToken } : {}),
  });
  return CreateManualJournalEntryResultSchema.parse(response.data);
};
