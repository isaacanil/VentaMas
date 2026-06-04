import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

type CallableResult<T> = {
  data: T;
};

type ChartAccountPayload = {
  businessId: string;
  account?: unknown;
  updates?: unknown;
  accountId?: string;
  clientUserId?: string | null;
  reason?: string | null;
};

type PostingProfilePayload = {
  businessId: string;
  profile?: unknown;
  updates?: unknown;
  profileId?: string;
  clientUserId?: string | null;
  reason?: string | null;
};

type BankAccountPayload = {
  businessId: string;
  bankAccount?: unknown;
  account?: unknown;
  clientUserId?: string | null;
};

type BankAccountBackfillPayload = {
  businessId: string;
  clientUserId?: string | null;
};

type ChartAccountResult = {
  ok: boolean;
  accountId: string;
};

type BankAccountResult = {
  ok: boolean;
  bankAccountId: string;
  chartOfAccountId: string;
};

type BankAccountBackfillResult = {
  ok: boolean;
  processed: number;
  created: number;
  linkedExisting: number;
  skippedAlreadyLinked: number;
  results: Array<{
    bankAccountId: string;
    chartOfAccountId?: string | null;
    code?: string | null;
    status: string;
  }>;
};

type PostingProfileResult = {
  ok: boolean;
  profileId: string;
  previousProfileId?: string;
  versioned?: boolean;
};

const createChartAccountCallable = httpsCallable<
  ChartAccountPayload,
  ChartAccountResult
>(functions, 'createChartOfAccount');

const createBankAccountCallable = httpsCallable<
  BankAccountPayload,
  BankAccountResult
>(functions, 'createBankAccount');

const backfillBankAccountChartLinksCallable = httpsCallable<
  BankAccountBackfillPayload,
  BankAccountBackfillResult
>(functions, 'backfillBankAccountChartLinks');

const updateChartAccountCallable = httpsCallable<
  ChartAccountPayload,
  ChartAccountResult
>(functions, 'updateChartOfAccount');

const disableChartAccountCallable = httpsCallable<
  ChartAccountPayload,
  ChartAccountResult
>(functions, 'disableChartOfAccount');

const createPostingProfileCallable = httpsCallable<
  PostingProfilePayload,
  PostingProfileResult
>(functions, 'createAccountingPostingProfile');

const updatePostingProfileCallable = httpsCallable<
  PostingProfilePayload,
  PostingProfileResult
>(functions, 'updateAccountingPostingProfile');

const disablePostingProfileCallable = httpsCallable<
  PostingProfilePayload,
  PostingProfileResult
>(functions, 'disableAccountingPostingProfile');

const unwrap = <T>(result: CallableResult<T>): T => result.data;

export const createChartOfAccountConfig = async (
  payload: ChartAccountPayload,
) => unwrap(await createChartAccountCallable(payload));

export const createBankAccountConfig = async (payload: BankAccountPayload) =>
  unwrap(await createBankAccountCallable(payload));

export const backfillBankAccountChartLinksConfig = async (
  payload: BankAccountBackfillPayload,
) => unwrap(await backfillBankAccountChartLinksCallable(payload));

export const updateChartOfAccountConfig = async (
  payload: ChartAccountPayload,
) => unwrap(await updateChartAccountCallable(payload));

export const disableChartOfAccountConfig = async (
  payload: ChartAccountPayload,
) => unwrap(await disableChartAccountCallable(payload));

export const createAccountingPostingProfileConfig = async (
  payload: PostingProfilePayload,
) => unwrap(await createPostingProfileCallable(payload));

export const updateAccountingPostingProfileConfig = async (
  payload: PostingProfilePayload,
) => unwrap(await updatePostingProfileCallable(payload));

export const disableAccountingPostingProfileConfig = async (
  payload: PostingProfilePayload,
) => unwrap(await disablePostingProfileCallable(payload));
