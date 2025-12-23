import { doc, setDoc } from 'firebase/firestore';

import { compareObjects } from '@/utils/object/compareObject';
import { db } from '@/firebase/firebaseconfig';
import { fbGetDoc } from '@/firebase/firebaseOperations';

import {
  buildClientWritePayload,
  extractNormalizedClient,
} from './clientNormalizer';

export async function fbUpsertClient(user, client, transaction = null) {
  try {
    if (!user || !user.businessID) throw new Error('No user or businessID');
    if (!client) return;
    if (!client.id) return;
    if (client.id === 'GC-0000') return client;

    const clientId = client.id;
    const clientRef = doc(
      db,
      'businesses',
      user.businessID,
      'clients',
      clientId,
    );

    const clientSnapshot = await fbGetDoc(clientRef, transaction);
    const clientExist = clientSnapshot.exists();
    const clientData = clientExist
      ? extractNormalizedClient(clientSnapshot.data())
      : {};

    const { payload, client: normalizedClient } =
      buildClientWritePayload(client);

    const compareVersion = compareObjects({
      object1: clientData,
      object2: normalizedClient,
    });

    const setClient = async () => {
      if (transaction) {
        transaction.set(clientRef, payload, { merge: true });
      } else {
        await setDoc(clientRef, payload, { merge: true });
      }
    };

    if (!clientExist || !compareVersion) {
      await setClient();
    }

    return normalizedClient;
  } catch (error) {
    console.error('Error adding document: ', error);
  }
}
