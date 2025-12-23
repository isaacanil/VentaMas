import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';

export const fbAddProvider = async (provider, user) => {
  if (!user || !user?.businessID) return;
  provider = {
    ...provider,
    id: nanoid(10),
    createdAt: Timestamp.now(),
    status: 'active',
  };
  try {
    const providerRef = doc(
      db,
      'businesses',
      user.businessID,
      'providers',
      provider.id,
    );
    await setDoc(providerRef, { provider });
    console.info('Provider created successfully');
  } catch (error) {
    console.error('Error adding document: ', error);
  }
};
