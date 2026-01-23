import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import type { ProviderDocument } from './types';

export const useFbGetProviders = (userOverride?: UserIdentity | null) => {
  const [providers, setProviders] = useState<ProviderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const user = userOverride ?? (useSelector(selectUser) as UserIdentity | null);

  useEffect(() => {
    if (!user?.businessID) {
      setLoading(false);
      return;
    }

    const providersRef = collection<ProviderDocument>(
      db,
      'businesses',
      user.businessID,
      'providers',
    );

    const fetchData = async () => {
      setLoading(true);

      try {
        const unsubscribe = onSnapshot(providersRef, (snapshot) => {
          const providersArray = snapshot.docs.map((item) => item.data());
          setProviders(providersArray);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching providers:', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return { providers, loading };
};
