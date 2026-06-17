import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type { UserWithBusiness } from '@/types/users';
import type { ProviderInfo } from '@/domain/providers/types';

type CreateProviderPayload = {
  businessId: string;
  provider: ProviderInfo;
  sessionToken?: string;
};
type CreateProviderResult = {
  ok: boolean;
};

const createProviderCallable = createFirebaseCallable<
  CreateProviderPayload,
  CreateProviderResult
>('createProvider');

export const fbAddProvider = async (
  provider: ProviderInfo,
  user: UserWithBusiness | null | undefined,
): Promise<void> => {
  if (!user?.businessID) return;
  const { sessionToken } = getStoredSession();

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
