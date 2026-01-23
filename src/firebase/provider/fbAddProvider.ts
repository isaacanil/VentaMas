import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';
import type { ProviderInfo } from '@/utils/provider/types';

import type { ProviderDocument, ProviderRecord } from './types';

export const fbAddProvider = async (
  provider: ProviderInfo,
  user: UserWithBusiness | null | undefined,
): Promise<void> => {
  if (!user?.businessID) return;
  const providerRecord: ProviderRecord = {
    ...provider,
    id: nanoid(10),
    createdAt: Timestamp.now(),
    status: 'active',
  };
  try {
    const providerRef = doc<ProviderDocument>(
      db,
      'businesses',
      user.businessID,
      'providers',
      providerRecord.id,
    );
    await setDoc(providerRef, { provider: providerRecord });
    console.info('Provider created successfully');
  } catch (error) {
    console.error('Error adding document: ', error);
  }
};
