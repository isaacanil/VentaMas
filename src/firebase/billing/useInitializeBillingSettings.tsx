import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import type { UserIdentity } from '@/types/users';
import { initializeAndSubscribeBillingSettings } from './billingSettingsSubscription';

export const useInitializeBillingSettings = () => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.businessID) return;

    const unsubscribe = initializeAndSubscribeBillingSettings({
      businessId: user.businessID,
      dispatch,
      queryClient,
    });

    return () => unsubscribe();
  }, [user?.businessID, dispatch, queryClient]);
};
