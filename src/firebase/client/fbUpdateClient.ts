import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import { buildClientWritePayload } from './clientNormalizer';
import type { ClientInput } from './clientNormalizer';

type UserWithBusiness = {
  businessID: string;
};

export const fbUpdateClient = async (
  user: UserWithBusiness | null | undefined,
  client: ClientInput & { id: string },
): Promise<void> => {
  // Updating client data
  if (!user || !user.businessID) return;

  const clientRef = doc(
    db,
    'businesses',
    user.businessID,
    'clients',
    client.id,
  );
  try {
    const docSnap = await getDoc(clientRef);
    if (!docSnap.exists()) {
      console.log('No such document!');
    }
    const { payload } = buildClientWritePayload(client);
    await setDoc(clientRef, payload, { merge: true });
  } catch (error) {
    console.error('Error updating document: ', error);
  }
};
