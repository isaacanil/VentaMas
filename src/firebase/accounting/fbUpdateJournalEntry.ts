import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import {
  UpdateJournalEntryInputSchema,
  UpdateJournalEntryResultSchema,
} from '@/shared/accountingSchemas.js';

export interface UpdateJournalEntryInput {
  businessId: string;
  description: string;
  entryDate: string;
  entryId: string;
  lines: Array<{
    accountId: string;
    credit: number;
    debit: number;
    description?: string;
  }>;
  reason: string;
}

export interface UpdateJournalEntryResult {
  ok: boolean;
  editId: string;
  entryId: string;
  status: 'posted' | 'reversed';
}

const updateJournalEntryCallable = createFirebaseCallable<
  UpdateJournalEntryInput & { sessionToken?: string },
  UpdateJournalEntryResult
>('updateJournalEntry');

export const fbUpdateJournalEntry = async (
  input: UpdateJournalEntryInput,
): Promise<UpdateJournalEntryResult> => {
  const { sessionToken } = getStoredSession();
  const parsedInput = UpdateJournalEntryInputSchema.parse(input);

  const response = await updateJournalEntryCallable({
    ...parsedInput,
    ...(sessionToken ? { sessionToken } : {}),
  });
  return UpdateJournalEntryResultSchema.parse(response);
};
