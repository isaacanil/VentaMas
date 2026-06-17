import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import type {
  SessionTokenDoc,
  SessionTokensDeleteResult,
  SessionTokensScanResult,
} from '../types';
import { toIncompleteSessionTokenResult } from '../utils/sessionTokensCleanupData';

const SESSION_TOKENS_COLLECTION = 'sessionTokens';

export const FETCH_LIMIT = 500;

export const fetchIncompleteSessionTokens =
  async (): Promise<SessionTokensScanResult> => {
    const snapshot = await getDocs(
      query(collection(db, SESSION_TOKENS_COLLECTION), limit(FETCH_LIMIT)),
    );
    const tokens = snapshot.docs
      .map((documentSnapshot) =>
        toIncompleteSessionTokenResult(
          documentSnapshot.id,
          (documentSnapshot.data() || {}) as SessionTokenDoc,
        ),
      )
      .filter((item) => item !== null);

    return {
      scanned: snapshot.size,
      tokens,
    };
  };

export const deleteSessionTokens = async (
  tokenIds: string[],
): Promise<SessionTokensDeleteResult> => {
  const results = await Promise.allSettled(
    tokenIds.map((id) => deleteDoc(doc(db, SESSION_TOKENS_COLLECTION, id))),
  );
  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  return {
    successCount: results.length - failures.length,
    failedCount: failures.length,
    failures,
  };
};
