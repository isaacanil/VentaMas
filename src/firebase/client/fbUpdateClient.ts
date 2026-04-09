import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import { buildClientWritePayload } from './clientNormalizer';
import type { ClientInput, NormalizedClient } from './clientNormalizer';

type UserWithBusiness = {
  businessID: string;
};

export const fbUpdateClient = async (
  user: UserWithBusiness | null | undefined,
  client: ClientInput & { id: string },
): Promise<NormalizedClient> => {
  // Updating client data
  if (!user || !user.businessID) {
    throw new Error('No user or businessID');
  }

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
    const { payload, client: normalizedClient } = buildClientWritePayload(
      client,
    );
    await setDoc(clientRef, payload, { merge: true });
    return normalizedClient;
  } catch (error) {
    console.error('Error updating document: ', error);
    throw error instanceof Error
      ? error
      : new Error('No se pudo actualizar el cliente');
  }
};
