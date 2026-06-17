import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
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

type ReverseJournalEntryRequest = ReverseJournalEntryInput & {
  sessionToken?: string;
};

const reverseJournalEntryCallable = createFirebaseCallable<
  ReverseJournalEntryRequest,
  ReverseJournalEntryResult
>('reverseJournalEntry');

export const fbReverseJournalEntry = async (
  input: ReverseJournalEntryInput,
): Promise<ReverseJournalEntryResult> => {
  const { sessionToken } = getStoredSession();
  const parsedInput = ReverseJournalEntryInputSchema.parse(input);

  const result = await reverseJournalEntryCallable({
    ...parsedInput,
    ...(sessionToken ? { sessionToken } : {}),
  });
  return ReverseJournalEntryResultSchema.parse(result);
};
