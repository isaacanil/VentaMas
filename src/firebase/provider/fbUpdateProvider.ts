import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';

import type { ProviderDocument, ProviderRecord } from './types';

export const fbUpdateProvider = async (
  provider: ProviderRecord,
  user: UserWithBusiness | null | undefined,
): Promise<void> => {
  if (!user?.businessID) return;
  if (!provider?.id) return;
  const providerRef = doc<ProviderDocument>(
    db,
    'businesses',
    user.businessID,
    'providers',
    provider.id,
  );
  await updateDoc(providerRef, { provider }).then(() => {
    /* Provider updated successfully */
  });
};
