import { doc, writeBatch } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import { buildClientWritePayload } from './clientNormalizer';
import { clients } from './clients';

export const fbAAddMultipleClients = (user) => {
  if (!user || !user.businessID) return;
  const batch = writeBatch(db);
  clients.forEach(({ client }) => {
    const clientRef = doc(
      db,
      'businesses',
      user.businessID,
      'clients',
      client.id,
    );
    const { payload } = buildClientWritePayload(client);
    batch.set(clientRef, payload, { merge: true });
  });
  batch.commit();
};
