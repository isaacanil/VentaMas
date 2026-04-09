import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';
import type { ProviderInfo } from '@/utils/provider/types';

export const fbAddProvider = async (
  provider: ProviderInfo,
  user: UserWithBusiness | null | undefined,
): Promise<void> => {
  if (!user?.businessID) return;
  const { sessionToken } = getStoredSession();
  const createProviderCallable = httpsCallable<
    {
      businessId: string;
      provider: ProviderInfo;
      sessionToken?: string;
    },
    { ok: boolean }
  >(functions, 'createProvider');

  try {
    await createProviderCallable({
      businessId: user.businessID,
      provider,
      ...(sessionToken ? { sessionToken } : {}),
    });
    console.info('Provider created successfully');
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};
