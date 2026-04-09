import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';
import { flowTrace } from '@/utils/flowTrace';

type AccountsReceivableWithBackendFlag = AccountsReceivableDoc & {
  installmentsCreatedInBackend?: boolean;
};

interface FbAddARParams {
  user?: UserIdentity | null;
  accountsReceivable?: AccountsReceivableDoc;
}

export async function fbAddAR({
  user,
  accountsReceivable,
}: FbAddARParams): Promise<AccountsReceivableWithBackendFlag | undefined> {
  if (!user?.businessID) return undefined;
  if (!accountsReceivable) return undefined;

  await flowTrace('AR_CREATE_REQUEST', {
    businessId: user.businessID,
    userId: user.uid,
    accountsReceivable,
  });

  const { sessionToken } = getStoredSession();
  const createAccountsReceivableCallable = httpsCallable<
    {
      businessId: string;
      accountsReceivable: AccountsReceivableDoc;
      sessionToken?: string;
    },
    {
      ok: boolean;
      accountsReceivable?: AccountsReceivableWithBackendFlag;
    }
  >(functions, 'createAccountsReceivable');

  const response = await createAccountsReceivableCallable({
    businessId: user.businessID,
    accountsReceivable,
    ...(sessionToken ? { sessionToken } : {}),
  });

  const ar = response.data?.accountsReceivable;
  if (ar?.id) {
    await flowTrace('AR_CREATE_SUCCESS', {
      businessId: user.businessID,
      arId: ar.id,
      numberId: ar.numberId,
    });
  }
  return ar;
}
