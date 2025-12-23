import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbGetCashCountState = async (user, cashCountID) => {
  if (!user?.businessID || !cashCountID) {
    return { exists: false, state: null };
  }

  const cashCountRef = doc(
    db,
    'businesses',
    user.businessID,
    'cashCounts',
    cashCountID,
  );
  const cashCountDoc = await getDoc(cashCountRef);

  if (!cashCountDoc.exists()) {
    return { exists: false, state: null };
  }

  const cashCountData = cashCountDoc.data() || {};
  const state = cashCountData?.cashCount?.state ?? null;

  return {
    exists: true,
    state,
  };
};

export const fbCashCountStatus = async (user, cashCountID, state) => {
  if (!state) {
    return false;
  }

  const { exists, state: currentState } = await fbGetCashCountState(
    user,
    cashCountID,
  );
  return Boolean(exists && currentState === state);
};
