import { doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';

import { buildClientWritePayload } from './clientNormalizer';
import type { ClientInput, NormalizedClient } from './clientNormalizer';

type UserWithBusiness = {
  businessID: string;
};

export const fbAddClient = async (
  user: UserWithBusiness | null | undefined,
  client: ClientInput,
): Promise<NormalizedClient | undefined> => {
  try {
    if (!user || !user.businessID) throw new Error('No user or businessID');
    // Processing client data
    const clientId = nanoid(8);
    const nextClient: ClientInput = {
      ...client,
      id: clientId,
      numberId: await getNextID(user, 'lastClientId'),
      isDeleted: false,
    };

    const clientRef = doc(
      db,
      'businesses',
      user.businessID,
      'clients',
      clientId,
    );

    const { payload, client: normalizedClient } =
      buildClientWritePayload(nextClient);

    await setDoc(clientRef, payload, { merge: true });
    return normalizedClient;
  } catch (error) {
    console.error('Error adding document: ', error);
  }
};
