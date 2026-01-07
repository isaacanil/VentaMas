// @ts-nocheck
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbDeleteClient = async (businessID, id) => {
  try {
    if (!businessID) throw new Error('No businessID');
    if (!id) throw new Error('No id');
    const clientRef = doc(db, 'businesses', businessID, 'clients', id);
    await setDoc(
      clientRef,
      {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error('Error soft-deleting client: ', error);
  }
};

export const deleteMultipleClients = (businessID, ids = []) => {
  ids.forEach((id) => {
    fbDeleteClient(businessID, id);
  });
};
