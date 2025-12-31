import { collection, getDocs, writeBatch } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { compareObjects } from '@/utils/object/compareObject';

import {
  buildClientWritePayload,
  CLIENT_ROOT_FIELDS,
  extractNormalizedClient,
  getDuplicatedRootFields,
} from './clientNormalizer';

const MAX_BATCH_SIZE = 450;

export async function fbNormalizeClients(user) {
  if (!user?.businessID) {
    throw new Error('fbNormalizeClients: user without businessID');
  }

  const clientsRef = collection(db, 'businesses', user.businessID, 'clients');
  const snapshot = await getDocs(clientsRef);

  if (snapshot.empty) {
    return { total: 0, normalized: 0 };
  }

  let batch = writeBatch(db);
  let operations = 0;
  let normalizedCount = 0;

  const flush = async () => {
    if (operations === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    operations = 0;
  };

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() || {};
    const normalizedClient = extractNormalizedClient(data);
    const currentClient = data?.client ?? {};

    const clientMatches = compareObjects({
      object1: currentClient,
      object2: normalizedClient,
      maxDepth: 5,
      strictTypeCheck: false,
    });

    const duplicatedFields = getDuplicatedRootFields(data);
    const hasDuplicated = Array.from(duplicatedFields).some(
      (field) => field !== 'client' && data[field] !== undefined,
    );

    if (clientMatches && !hasDuplicated) {
      continue;
    }

    const { payload } = buildClientWritePayload(normalizedClient);
    const extras = {};

    for (const [key, value] of Object.entries(data)) {
      if (key === 'client') continue;
      if (!CLIENT_ROOT_FIELDS.has(key)) {
        extras[key] = value;
      }
    }

    batch.set(docSnap.ref, { ...payload, ...extras }, { merge: true });
    operations += 1;
    normalizedCount += 1;

    if (operations >= MAX_BATCH_SIZE) {
      await flush();
    }
  }

  await flush();

  return { total: snapshot.size, normalized: normalizedCount };
}
