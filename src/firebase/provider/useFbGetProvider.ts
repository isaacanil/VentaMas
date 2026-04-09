import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import type { ProviderDocument } from './types';

export const useFbGetProviders = (userOverride?: UserIdentity | null) => {
  const [providers, setProviders] = useState<ProviderDocument[]>([]);
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | null>(null);
  const storeUser = useSelector(selectUser) as UserIdentity | null;
  const user = userOverride ?? storeUser;
  const businessId = user?.businessID;

  useEffect(() => {
    if (!businessId) {
      return undefined;
    }

    const providersRef = collection<ProviderDocument>(
      db,
      'businesses',
      businessId,
      'providers',
    );

    const unsubscribe = onSnapshot(
      providersRef,
      (snapshot) => {
        const providersArray = snapshot.docs.map((item) => item.data());
        setLoadedBusinessId(businessId);
        setProviders(providersArray);
      },
      (error) => {
        console.error('Error fetching providers:', error);
        setLoadedBusinessId(businessId);
        setProviders([]);
      },
    );

    return () => unsubscribe();
  }, [businessId]);

  const isLoadedForCurrentBusiness = Boolean(
    businessId && loadedBusinessId === businessId,
  );
  const resolvedProviders = isLoadedForCurrentBusiness ? providers : [];
  const resolvedLoading = businessId ? !isLoadedForCurrentBusiness : false;

  return { providers: resolvedProviders, loading: resolvedLoading };
};
