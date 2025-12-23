import {
  collection,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';

export const useClientAccountsReceivableCounts = ({ user, clientId }) => {
  const [counts, setCounts] = useState({ open: 0, closed: 0 });

  useEffect(() => {
    if (!user?.businessID || !clientId) return;

    const colRef = collection(
      db,
      'businesses',
      user.businessID,
      'accountsReceivable',
    );

    const fetchCounts = async () => {
      try {
        const openQ = query(
          colRef,
          where('clientId', '==', clientId),
          where('isActive', '==', true),
        );
        const closedQ = query(
          colRef,
          where('clientId', '==', clientId),
          where('isActive', '==', false),
        );

        const [openSnap, closedSnap] = await Promise.all([
          getCountFromServer(openQ),
          getCountFromServer(closedQ),
        ]);

        setCounts({
          open: openSnap.data().count,
          closed: closedSnap.data().count,
        });
      } catch (e) {
        console.error('Error fetching AR counts', e);
      }
    };

    fetchCounts();
  }, [user?.businessID, clientId]);

  return counts;
};
